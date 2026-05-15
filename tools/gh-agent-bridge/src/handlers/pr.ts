import { agents, otherAgent } from '../agents/index.ts';
import type { AgentName } from '../agents/types.ts';
import { config } from '../config.ts';
import { stmts } from '../db.ts';
import { getPullRequest, listPrFiles, postPrReviewComment } from '../github.ts';
import { logger } from '../logger.ts';
import { buildReviewPrompt } from '../prompts.ts';
import { runScreenshotForPr } from '../screenshot.ts';
import { STATE_LABELS } from '../state.ts';
import { spawnSync } from 'node:child_process';

const AGENT_LABEL_PREFIX = 'agent:';

export async function handlePrOpened(prNumber: number): Promise<void> {
  logger.info({ prNumber }, 'handlePrOpened');
  const pr = await getPullRequest(prNumber);
  const authorAgent = detectAuthorAgent(pr.labels.map((l) => (typeof l === 'string' ? l : l.name ?? '')));
  if (!authorAgent) {
    logger.info({ prNumber }, '작성자 에이전트 라벨 없음 — 리뷰 건너뜀');
    return;
  }
  const reviewer = otherAgent(authorAgent);

  const issueRef = pr.body?.match(/Closes #(\d+)/i);
  const issueNumber = issueRef ? Number(issueRef[1]) : null;

  stmts.upsertPr.run({
    pr_number: prNumber,
    issue_number: issueNumber,
    author_agent: authorAgent,
  });

  // diff 추출 (gh CLI 사용)
  const diff = spawnSync(config.GH_CLI, ['pr', 'diff', String(prNumber)], {
    cwd: config.REPO_DIR,
    encoding: 'utf8',
    maxBuffer: 10 * 1024 * 1024,
  }).stdout ?? '';

  const reviewPrompt = buildReviewPrompt(
    reviewer,
    authorAgent,
    pr.title,
    pr.body ?? '',
    diff.slice(0, 200_000),
  );

  const res = await agents[reviewer].invoke({
    prompt: reviewPrompt,
    cwd: config.REPO_DIR,
    label: `pr#${prNumber} review(${reviewer})`,
    timeoutMs: 8 * 60 * 1000,
  });

  const verdict = /판정.*request-changes/i.test(res.stdout)
    ? 'REQUEST_CHANGES'
    : /판정.*approve/i.test(res.stdout)
      ? 'APPROVE'
      : 'COMMENT';

  await postPrReviewComment(prNumber, res.stdout.trim() || '(빈 응답)', verdict);
  stmts.setReviewer.run({ pr_number: prNumber, reviewer_agent: reviewer });

  // UI 라우트 후보 추출 → 있으면 스크린샷 워커에 위임
  const files = await listPrFiles(prNumber);
  await runScreenshotForPr(prNumber, files.map((f) => f.filename));

  // 라벨 전환은 webhook 으로 자동 반영되지만 명시적으로도
  if (verdict !== 'REQUEST_CHANGES') {
    // 작성자 에이전트 라벨은 유지하고 state 만 reviewed 로
    await postPrReviewComment(prNumber, `_state → ${STATE_LABELS.reviewed}_`, 'COMMENT');
  }
}

function detectAuthorAgent(labels: string[]): AgentName | null {
  for (const l of labels) {
    if (l === `${AGENT_LABEL_PREFIX}claude`) return 'claude';
    if (l === `${AGENT_LABEL_PREFIX}codex`) return 'codex';
  }
  return null;
}
