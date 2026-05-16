import { agents } from '../agents/index.ts';
import type { AgentName } from '../agents/types.ts';
import { config } from '../config.ts';
import { stmts } from '../db.ts';
import { getIssue, listIssueComments, postIssueComment } from '../github.ts';
import { logger } from '../logger.ts';
import {
  judgeConsensus,
  parsePlanResponse,
  renderConsensusComment,
  renderPlanComment,
  type Plan,
} from '../plan.ts';
import { buildPlanPrompt } from '../prompts.ts';
import { loadClaudeMd, loadStructureExcerpt, priorCommentsAsText, recentCommits } from '../context.ts';
import { STATE_LABELS, transitionIssue } from '../state.ts';
import { ensureWorktree } from '../worktree.ts';

export async function handleIssueOpened(issueNumber: number): Promise<void> {
  logger.info({ issueNumber }, 'handleIssueOpened');

  // 이미 plan 단계를 지난 이슈는 재진입하지 않는다 (봇 자체 라벨링이 다시 trigger 되는 경우 대비).
  const existing = stmts.getIssueState.get(issueNumber) as
    | { last_label?: string | null }
    | undefined;
  if (existing?.last_label && existing.last_label !== STATE_LABELS.new) {
    logger.info(
      { issueNumber, last_label: existing.last_label },
      '이미 처리됨 — handleIssueOpened skip',
    );
    return;
  }

  const issue = await getIssue(issueNumber);
  const { path, branch } = await ensureWorktree(issueNumber);
  stmts.upsertIssueState.run({
    issue_number: issueNumber,
    worktree_path: path,
    branch,
    last_label: STATE_LABELS.planning,
  });
  await transitionIssue(issueNumber, STATE_LABELS.planning);

  const comments = await listIssueComments(issueNumber);
  const priorComments = priorCommentsAsText(comments);
  const promptCtxBase = {
    issueTitle: issue.title,
    issueBody: issue.body ?? '',
    recentCommits: recentCommits(),
    structureExcerpt: loadStructureExcerpt(),
    claudeMd: loadClaudeMd(),
    priorComments,
  };

  const [claudeRes, codexRes] = await Promise.all(
    (['claude', 'codex'] as AgentName[]).map((a) =>
      agents[a].invoke({
        prompt: buildPlanPrompt({ agent: a, ...promptCtxBase }),
        cwd: config.REPO_DIR,
        label: `issue#${issueNumber} plan(${a})`,
        timeoutMs: 6 * 60 * 1000,
      }),
    ),
  );

  const claudeParsed = parseAndStore(issueNumber, 'claude', claudeRes.stdout);
  const codexParsed = parseAndStore(issueNumber, 'codex', codexRes.stdout);

  if (claudeParsed) {
    await postIssueComment(
      issueNumber,
      renderPlanComment(claudeParsed.plan, claudeParsed.prose, 'Claude'),
    );
  } else {
    await postIssueComment(
      issueNumber,
      '⚠️ Claude 플랜 파싱 실패. raw 응답:\n\n<details><summary>출력</summary>\n\n```\n' +
        claudeRes.stdout.slice(0, 4000) +
        '\n```\n</details>',
    );
  }
  if (codexParsed) {
    await postIssueComment(
      issueNumber,
      renderPlanComment(codexParsed.plan, codexParsed.prose, 'Codex'),
    );
  } else {
    await postIssueComment(
      issueNumber,
      '⚠️ Codex 플랜 파싱 실패. raw 응답:\n\n<details><summary>출력</summary>\n\n```\n' +
        codexRes.stdout.slice(0, 4000) +
        '\n```\n</details>',
    );
  }

  if (claudeParsed && codexParsed) {
    const verdict = judgeConsensus(claudeParsed.plan, codexParsed.plan);
    await postIssueComment(
      issueNumber,
      renderConsensusComment(claudeParsed.plan, codexParsed.plan, verdict),
    );
    if (verdict.verdict === 'large-large') {
      stmts.setConsensus.run({ issue_number: issueNumber, consensus_size: 'large-large' });
      await transitionIssue(issueNumber, STATE_LABELS.splitProposed);
    } else if (verdict.verdict === 'disagree') {
      stmts.setConsensus.run({ issue_number: issueNumber, consensus_size: 'disagree' });
      await transitionIssue(issueNumber, STATE_LABELS.planDisagree);
    } else {
      stmts.setConsensus.run({ issue_number: issueNumber, consensus_size: verdict.size });
      await transitionIssue(issueNumber, STATE_LABELS.planReady);
    }
  } else {
    await transitionIssue(issueNumber, STATE_LABELS.planDisagree);
  }
}

function parseAndStore(
  issueNumber: number,
  agent: AgentName,
  raw: string,
): { plan: Plan; prose: string } | null {
  const parsed = parsePlanResponse(raw);
  if (!parsed) return null;
  stmts.setPlan.run({
    issue_number: issueNumber,
    agent,
    plan_json: JSON.stringify({ plan: parsed.plan, prose: parsed.prose }),
  });
  return parsed;
}
