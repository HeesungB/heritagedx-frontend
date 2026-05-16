import { ensureLabel, setIssueLabels } from './github.ts';

export const STATE_PREFIX = 'state:';
export const AGENT_PREFIX = 'agent:';

export const STATE_LABELS = {
  new: 'state:new',
  planning: 'state:planning',
  planReady: 'state:plan-ready',
  planDisagree: 'state:plan-disagree',
  splitProposed: 'state:split-proposed',
  implementingClaude: 'state:implementing:claude',
  implementingCodex: 'state:implementing:codex',
  awaitingReview: 'state:awaiting-review',
  reviewed: 'state:reviewed',
} as const;

export const AGENT_LABELS = {
  claude: 'agent:claude',
  codex: 'agent:codex',
} as const;

const LABEL_DEFS: Array<{ name: string; color: string; description: string }> = [
  { name: STATE_LABELS.new, color: 'ededed', description: '데몬이 플랜 작업을 큐잉할 대상' },
  { name: STATE_LABELS.planning, color: 'fbca04', description: '에이전트 플랜 작업 중' },
  { name: STATE_LABELS.planReady, color: '0e8a16', description: '두 플랜 게시 완료' },
  { name: STATE_LABELS.planDisagree, color: 'd93f0b', description: '에이전트 의견 충돌' },
  { name: STATE_LABELS.splitProposed, color: 'f9d0c4', description: '이슈 분해 제안됨' },
  { name: STATE_LABELS.implementingClaude, color: '5319e7', description: 'Claude 구현 중' },
  { name: STATE_LABELS.implementingCodex, color: '1d76db', description: 'Codex 구현 중' },
  { name: STATE_LABELS.awaitingReview, color: 'a2eeef', description: '상호 리뷰 대기' },
  { name: STATE_LABELS.reviewed, color: '0e8a16', description: '리뷰 완료, 사용자 결정 대기' },
  { name: AGENT_LABELS.claude, color: '5319e7', description: 'Claude 작성/관여' },
  { name: AGENT_LABELS.codex, color: '1d76db', description: 'Codex 작성/관여' },
];

export async function ensureAllLabels(): Promise<void> {
  for (const def of LABEL_DEFS) {
    await ensureLabel(def.name, def.color, def.description);
  }
}

export async function transitionIssue(
  issueNumber: number,
  next: (typeof STATE_LABELS)[keyof typeof STATE_LABELS],
): Promise<void> {
  await setIssueLabels(issueNumber, [next], [STATE_PREFIX]);
}

export async function tagAgent(
  issueNumber: number,
  agent: keyof typeof AGENT_LABELS,
): Promise<void> {
  await setIssueLabels(issueNumber, [AGENT_LABELS[agent]], []);
}
