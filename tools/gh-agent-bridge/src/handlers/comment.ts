import { agents } from '../agents/index.ts';
import type { AgentName } from '../agents/types.ts';
import { config } from '../config.ts';
import { stmts } from '../db.ts';
import { createSubIssue, getIssue, listIssueComments, postIssueComment } from '../github.ts';
import { logger } from '../logger.ts';
import { HELP_TEXT, parseSlash } from '../slash.ts';
import { handleImplement } from './implement.ts';
import { loadClaudeMd, loadStructureExcerpt, priorCommentsAsText, recentCommits } from '../context.ts';

interface CommentInput {
  issueNumber: number;
  commenterLogin: string;
  body: string;
  isFromPr?: boolean;
  prNumber?: number;
}

export async function handleIssueComment(input: CommentInput): Promise<void> {
  const { issueNumber, commenterLogin, body } = input;

  if (config.ALLOWED_LOGINS.length && !config.ALLOWED_LOGINS.includes(commenterLogin)) {
    logger.info({ commenterLogin }, '비허용 로그인 — 무시');
    return;
  }

  const cmd = parseSlash(body);
  if (!cmd) return;

  logger.info({ issueNumber, commenterLogin, cmd: cmd.kind }, 'slash');

  switch (cmd.kind) {
    case 'help':
      await postIssueComment(issueNumber, HELP_TEXT);
      return;
    case 'ask':
      await runAsk(issueNumber, cmd.target, cmd.text);
      return;
    case 'implement':
      await handleImplement(issueNumber, cmd.agent);
      return;
    case 'approve-split':
      await approveSplit(issueNumber);
      return;
    case 'reject-split':
      await postIssueComment(issueNumber, '분해를 건너뛰고 단일 PR 로 진행합니다. `/implement claude|codex` 로 시작하세요.');
      return;
    case 'cancel':
      await postIssueComment(issueNumber, '⏹️ 현재 진행 중인 작업 취소 요청을 받았습니다 (취소 큐 미구현 — 다음 작업부터 반영).');
      return;
    case 'screenshot':
      await postIssueComment(
        issueNumber,
        `📸 \`${cmd.route}\` 라우트 캡처 요청을 받았습니다. 스크린샷 워커 활성화 시 PR 코멘트로 게시됩니다.`,
      );
      return;
    case 'handoff':
      await postIssueComment(issueNumber, `✋ PR 작성자를 ${cmd.to} 로 변경합니다. 다음 \`/implement ${cmd.to}\` 호출 시 적용됩니다.`);
      return;
    default:
      return;
  }
}

async function runAsk(
  issueNumber: number,
  target: AgentName | 'both',
  text: string,
): Promise<void> {
  const issue = await getIssue(issueNumber);
  const comments = await listIssueComments(issueNumber);
  const sharedCtx = {
    issueTitle: issue.title,
    issueBody: issue.body ?? '',
    structureExcerpt: loadStructureExcerpt(),
    claudeMd: loadClaudeMd(),
    recentCommits: recentCommits(),
    priorComments: priorCommentsAsText(comments),
  };
  const targets: AgentName[] = target === 'both' ? ['claude', 'codex'] : [target];
  await Promise.all(
    targets.map(async (a) => {
      const prompt = [
        `You are **${a.toUpperCase()}**, responding to a user question on issue #${issueNumber}.`,
        '',
        `## Issue title\n${sharedCtx.issueTitle}`,
        '',
        '## Issue body',
        sharedCtx.issueBody,
        '',
        '## Conversation so far',
        sharedCtx.priorComments || '(없음)',
        '',
        '## User question',
        text,
        '',
        '## Repo context (excerpt)',
        '### CLAUDE.md',
        sharedCtx.claudeMd,
        '',
        '### STRUCTURE.md',
        sharedCtx.structureExcerpt,
        '',
        '응답은 한국어로 ~250 단어 이내. 코드 변경은 하지 마세요. 필요한 경우 파일 경로:라인 표기를 사용하세요.',
      ].join('\n');
      const res = await agents[a].invoke({
        prompt,
        cwd: config.REPO_DIR,
        label: `issue#${issueNumber} ask(${a})`,
        timeoutMs: 4 * 60 * 1000,
      });
      await postIssueComment(
        issueNumber,
        `### ${a === 'claude' ? 'Claude' : 'Codex'} 응답\n\n${res.stdout.trim() || '(빈 응답)'}`,
      );
    }),
  );
}

async function approveSplit(issueNumber: number): Promise<void> {
  const row = stmts.getIssueState.get(issueNumber) as
    | { claude_plan_json: string | null; codex_plan_json: string | null }
    | undefined;
  const claudePlan = row?.claude_plan_json ? JSON.parse(row.claude_plan_json) : null;
  const codexPlan = row?.codex_plan_json ? JSON.parse(row.codex_plan_json) : null;
  if (!claudePlan || !codexPlan) {
    await postIssueComment(issueNumber, '플랜이 아직 두 에이전트 모두 완성되지 않았습니다.');
    return;
  }
  // 두 플랜의 steps 를 직렬 후보로 사용해 sub-issue 3개 까지 생성
  const steps: string[] = Array.from(
    new Set([...(claudePlan.plan.steps ?? []), ...(codexPlan.plan.steps ?? [])]),
  ).slice(0, 3);
  if (steps.length === 0) {
    await postIssueComment(issueNumber, '분해할 step 이 비어있어 자동 분해를 건너뜁니다.');
    return;
  }
  const created: number[] = [];
  for (const [i, step] of steps.entries()) {
    const n = await createSubIssue(
      issueNumber,
      `[#${issueNumber} sub ${i + 1}] ${step.slice(0, 80)}`,
      `${step}\n\n자동 분해된 sub-issue 입니다.`,
    );
    created.push(n);
  }
  await postIssueComment(
    issueNumber,
    `🔧 분해 완료: ${created.map((n) => '#' + n).join(', ')}. 각 sub-issue 가 별도 worktree 에서 병렬 처리됩니다.`,
  );
}
