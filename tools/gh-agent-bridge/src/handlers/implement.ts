import { agents } from '../agents/index.ts';
import type { AgentName } from '../agents/types.ts';
import { config } from '../config.ts';
import { stmts } from '../db.ts';
import { getIssue, listIssueComments, postIssueComment } from '../github.ts';
import { logger } from '../logger.ts';
import { buildImplementPrompt } from '../prompts.ts';
import {
  loadClaudeMd,
  loadStructureExcerpt,
  priorCommentsAsText,
  recentCommits,
} from '../context.ts';
import { STATE_LABELS, transitionIssue, AGENT_LABELS, tagAgent } from '../state.ts';
import { ensureWorktree, gitInWorktree, shellInWorktree } from '../worktree.ts';

export async function handleImplement(issueNumber: number, agent: AgentName): Promise<void> {
  logger.info({ issueNumber, agent }, 'handleImplement');
  await transitionIssue(
    issueNumber,
    agent === 'claude' ? STATE_LABELS.implementingClaude : STATE_LABELS.implementingCodex,
  );
  await tagAgent(issueNumber, agent);

  const { path: worktree, branch } = await ensureWorktree(issueNumber);
  const issue = await getIssue(issueNumber);
  const comments = await listIssueComments(issueNumber);

  const row = stmts.getIssueState.get(issueNumber) as
    | { claude_plan_json: string | null; codex_plan_json: string | null }
    | undefined;
  const planSrc = agent === 'claude' ? row?.claude_plan_json : row?.codex_plan_json;
  if (!planSrc) {
    await postIssueComment(issueNumber, `❌ ${agent} 플랜이 존재하지 않습니다.`);
    return;
  }
  const { plan, prose } = JSON.parse(planSrc);
  const planText = `### ${agent} plan\n\n\`\`\`yaml\n${yamlify(plan)}\n\`\`\`\n\n${prose}`;

  const prompt = buildImplementPrompt(
    {
      agent,
      issueTitle: issue.title,
      issueBody: issue.body ?? '',
      recentCommits: recentCommits(),
      structureExcerpt: loadStructureExcerpt(),
      claudeMd: loadClaudeMd(),
      priorComments: priorCommentsAsText(comments),
    },
    planText,
  );

  await postIssueComment(issueNumber, `🛠️ ${agent} 가 \`${branch}\` 에서 구현을 시작합니다.`);

  const res = await agents[agent].invoke({
    prompt,
    cwd: worktree,
    label: `issue#${issueNumber} impl(${agent})`,
    timeoutMs: 30 * 60 * 1000,
  });

  if (!res.ok) {
    await postIssueComment(
      issueNumber,
      `❌ ${agent} 구현 실패 (exit ${res.exitCode}).\n\n<details><summary>stderr</summary>\n\n\`\`\`\n${res.stderr.slice(0, 4000)}\n\`\`\`\n</details>`,
    );
    return;
  }

  // 검증: lint + type-check
  const lint = await shellInWorktree(worktree, 'pnpm', ['lint']);
  const tc = await shellInWorktree(worktree, 'pnpm', ['type-check']);
  if (lint.code !== 0 || tc.code !== 0) {
    await postIssueComment(
      issueNumber,
      `⚠️ ${agent} 검증 실패. lint=${lint.code} type-check=${tc.code}. 1회 자가 수정 시도 중…`,
    );
    const fixRes = await agents[agent].invoke({
      prompt:
        prompt +
        `\n\n# Verification failed\n\nlint exit ${lint.code}\n\`\`\`\n${lint.stderr.slice(0, 4000)}\n\`\`\`\n` +
        `\ntype-check exit ${tc.code}\n\`\`\`\n${tc.stderr.slice(0, 4000)}\n\`\`\`\n\n위 실패를 해결한 뒤 다시 한 번 lint 와 type-check 가 통과하도록 수정하세요.`,
      cwd: worktree,
      label: `issue#${issueNumber} impl-fix(${agent})`,
      timeoutMs: 20 * 60 * 1000,
    });
    if (!fixRes.ok) {
      await postIssueComment(
        issueNumber,
        `❌ ${agent} 자가 수정 실패. 수동 개입 필요.`,
      );
      return;
    }
    const lint2 = await shellInWorktree(worktree, 'pnpm', ['lint']);
    const tc2 = await shellInWorktree(worktree, 'pnpm', ['type-check']);
    if (lint2.code !== 0 || tc2.code !== 0) {
      await postIssueComment(issueNumber, `❌ 재검증 실패. lint=${lint2.code} type-check=${tc2.code}.`);
      return;
    }
  }

  // 변경 있는지 확인
  const status = await gitInWorktree(worktree, ['status', '--porcelain']);
  if (!status.stdout.trim()) {
    await postIssueComment(
      issueNumber,
      `ℹ️ ${agent} 가 파일을 변경하지 않았습니다. PR 생성을 건너뜁니다.`,
    );
    return;
  }

  await gitInWorktree(worktree, ['add', '-A']);
  await gitInWorktree(worktree, [
    '-c',
    'user.email=bot+gh-agent-bridge@heritagedx.com',
    '-c',
    `user.name=${agent === 'claude' ? 'Claude' : 'Codex'} (gh-agent-bridge)`,
    'commit',
    '-m',
    commitMessage(agent, issue.title, issueNumber),
  ]);
  const push = await gitInWorktree(worktree, ['push', '-u', 'origin', branch]);
  if (push.code !== 0) {
    await postIssueComment(issueNumber, `❌ push 실패\n\n\`\`\`\n${push.stderr}\n\`\`\``);
    return;
  }

  const prBody = renderPrBody(agent, issueNumber, plan, prose, res.stdout);
  const prCreate = await shellInWorktree(worktree, config.GH_CLI, [
    'pr',
    'create',
    '--title',
    prTitle(agent, issue.title, issueNumber),
    '--body',
    prBody,
    '--label',
    AGENT_LABELS[agent],
    '--label',
    STATE_LABELS.awaitingReview,
    '--head',
    branch,
    '--base',
    'main',
  ]);
  if (prCreate.code !== 0) {
    await postIssueComment(issueNumber, `❌ PR 생성 실패\n\n\`\`\`\n${prCreate.stderr}\n\`\`\``);
    return;
  }
  await transitionIssue(issueNumber, STATE_LABELS.awaitingReview);
  await postIssueComment(issueNumber, `✅ ${agent} PR 생성 완료. 상호 리뷰 대기.\n\n${prCreate.stdout.trim()}`);
}

function prTitle(agent: AgentName, issueTitle: string, issueNumber: number): string {
  const prefix = agent === 'claude' ? '[Claude]' : '[Codex]';
  return `${prefix} ${issueTitle} (#${issueNumber})`;
}

function commitMessage(agent: AgentName, issueTitle: string, issueNumber: number): string {
  return `${agent}: ${issueTitle} (#${issueNumber})\n\nImplemented by gh-agent-bridge.`;
}

function renderPrBody(
  agent: AgentName,
  issueNumber: number,
  plan: unknown,
  prose: string,
  agentSummary: string,
): string {
  return [
    `Closes #${issueNumber}`,
    '',
    `Implemented by **${agent}** via gh-agent-bridge.`,
    '',
    '### 적용된 플랜',
    '```yaml',
    yamlify(plan),
    '```',
    '',
    prose,
    '',
    '### 에이전트 요약',
    '',
    agentSummary.trim() || '(빈 요약)',
    '',
    '---',
    '_상호 리뷰가 곧 게시됩니다._',
  ].join('\n');
}

function yamlify(obj: unknown): string {
  if (obj === null || obj === undefined) return '';
  if (typeof obj !== 'object') return String(obj);
  const o = obj as Record<string, unknown>;
  const lines: string[] = [];
  for (const [k, v] of Object.entries(o)) {
    if (Array.isArray(v)) {
      if (v.length === 0) lines.push(`${k}: []`);
      else {
        lines.push(`${k}:`);
        for (const item of v) lines.push(`  - ${String(item)}`);
      }
    } else {
      lines.push(`${k}: ${String(v)}`);
    }
  }
  return lines.join('\n');
}
