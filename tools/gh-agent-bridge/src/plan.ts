import { z } from 'zod';

export const PlanSize = z.enum(['small', 'medium', 'large']);
export type PlanSize = z.infer<typeof PlanSize>;

export const PlanSchema = z.object({
  /** 일반인용 한 줄 요약 (한국어, 기술 용어 금지). 비기술자가 plan 코멘트의 최상단에 보게 된다. */
  plain_summary: z.string().min(1),
  size: PlanSize,
  approach: z.string().min(1),
  key_files: z.array(z.string()).default([]),
  steps: z.array(z.string()).default([]),
  risks: z.array(z.string()).default([]),
});
export type Plan = z.infer<typeof PlanSchema>;

const SIZE_LABEL_KO: Record<PlanSize, string> = {
  small: '작은 변경 (한두 파일)',
  medium: '중간 변경 (한 패키지/앱 내부)',
  large: '큰 변경 (여러 패키지 교차, 마이그레이션 등)',
};

const ASK_HINT = [
  '',
  '---',
  '💬 궁금한 점은 댓글에 `/claude <질문>` 또는 `/codex <질문>` 으로 물어보세요. ' +
    '`/both <질문>` 이면 두 에이전트 모두에게 동시에 질문할 수 있습니다.',
].join('\n');

/**
 * 에이전트 응답에서 YAML/JSON 헤더와 산문을 분리한다.
 * 헤더 포맷:
 *   ```yaml
 *   size: small
 *   approach: ...
 *   key_files: [...]
 *   steps:
 *     - ...
 *   risks: [...]
 *   ```
 *   <자유 산문>
 */
export function parsePlanResponse(raw: string): { plan: Plan; prose: string } | null {
  const match = raw.match(/```(?:yaml|yml|json)?\s*\n([\s\S]*?)\n```/);
  if (!match) return null;
  const headerText = match[1];
  const rest = raw.slice(match.index! + match[0].length).trim();

  const parsed = parseLooseYaml(headerText);
  const validation = PlanSchema.safeParse(parsed);
  if (!validation.success) return null;
  return { plan: validation.data, prose: rest };
}

/** 매우 단순한 YAML 부분 파서. 키:값 + `- item` 리스트만 지원. */
function parseLooseYaml(text: string): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  let currentKey: string | null = null;
  let currentList: string[] | null = null;
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const listItem = trimmed.match(/^-\s+(.+)$/);
    if (listItem && currentList) {
      currentList.push(stripQuotes(listItem[1]));
      continue;
    }
    const kv = trimmed.match(/^([a-z_]+)\s*:\s*(.*)$/i);
    if (kv) {
      const [, key, valueRaw] = kv;
      const value = valueRaw.trim();
      if (value === '' || value === '|' || value === '>') {
        currentKey = key;
        currentList = [];
        out[key] = currentList;
        continue;
      }
      // inline array
      if (value.startsWith('[') && value.endsWith(']')) {
        out[key] = value
          .slice(1, -1)
          .split(',')
          .map((s) => stripQuotes(s.trim()))
          .filter(Boolean);
        currentKey = null;
        currentList = null;
        continue;
      }
      out[key] = stripQuotes(value);
      currentKey = null;
      currentList = null;
    }
  }
  void currentKey;
  return out;
}

function stripQuotes(s: string): string {
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    return s.slice(1, -1);
  }
  return s;
}

export type ConsensusVerdict =
  | { verdict: 'agree'; size: PlanSize }
  | { verdict: 'large-large' }
  | { verdict: 'disagree'; sizes: [PlanSize, PlanSize] };

export function judgeConsensus(claude: Plan, codex: Plan): ConsensusVerdict {
  if (claude.size === 'large' && codex.size === 'large') return { verdict: 'large-large' };
  if (claude.size === codex.size) return { verdict: 'agree', size: claude.size };
  return { verdict: 'disagree', sizes: [claude.size, codex.size] };
}

export function renderPlanComment(plan: Plan, prose: string, author: string): string {
  const tech: string[] = [
    `- **작업 규모**: \`${plan.size}\` — ${SIZE_LABEL_KO[plan.size]}`,
    `- **접근 방법**: ${plan.approach}`,
  ];
  if (plan.key_files.length) {
    tech.push(`- **건드릴 파일**: ${plan.key_files.map((f) => `\`${f}\``).join(', ')}`);
  }
  if (plan.steps.length) {
    tech.push('- **수행 단계**:');
    plan.steps.forEach((s, i) => tech.push(`  ${i + 1}. ${s}`));
  }
  if (plan.risks.length) {
    tech.push('- **위험 요소**:');
    plan.risks.forEach((r) => tech.push(`  - ${r}`));
  }

  return [
    `### 🤖 ${author} 가 본 작업 요약`,
    '',
    `> ${plan.plain_summary}`,
    '',
    '<details>',
    '<summary>📋 기술 세부 (개발자용)</summary>',
    '',
    tech.join('\n'),
    '',
    '</details>',
    prose ? '\n' + prose : '',
    ASK_HINT,
  ]
    .filter((s) => s !== undefined)
    .join('\n');
}

export function renderConsensusComment(
  claude: Plan,
  codex: Plan,
  verdict: ConsensusVerdict,
): string {
  const tableHead = '| | Claude | Codex |\n|---|---|---|';
  const row = (k: string, a: string, b: string): string => `| **${k}** | ${a} | ${b} |`;
  const rows = [
    row('size', claude.size, codex.size),
    row('approach', escapePipe(claude.approach), escapePipe(codex.approach)),
    row('key_files', claude.key_files.join(', ') || '—', codex.key_files.join(', ') || '—'),
  ].join('\n');
  let footer = '';
  if (verdict.verdict === 'large-large') {
    footer = [
      '',
      '',
      '> 두 에이전트 모두 **큰 작업**이라고 판단했습니다.',
      '> ',
      '> - 작은 단위로 나누길 원하면 댓글에 `/approve-split` — 자동으로 sub-issue 3개까지 만들어 줍니다.',
      '> - 한 번에 진행하길 원하면 `/reject-split` — 그대로 단일 PR 로 갑니다.',
    ].join('\n');
  } else if (verdict.verdict === 'disagree') {
    footer = [
      '',
      '',
      `> 두 에이전트의 작업 규모 판단이 다릅니다 (Claude: \`${verdict.sizes[0]}\` vs Codex: \`${verdict.sizes[1]}\`).`,
      '> ',
      '> - 한쪽으로 갈지 결정되면 `/implement claude` 또는 `/implement codex` 로 시작하면 됩니다.',
      '> - 결정하기 전에 더 알아보고 싶다면 `/both 이 차이가 어디서 나는지 자세히 설명해 주세요` 같은 질문을 던져도 좋습니다.',
    ].join('\n');
  } else {
    footer = [
      '',
      '',
      `> ✅ 두 에이전트가 \`${verdict.size}\` (${SIZE_LABEL_KO[verdict.size]}) 로 의견 일치.`,
      '> ',
      '> **다음 단계**: 댓글에 `/implement claude` 또는 `/implement codex` 를 입력하세요.',
      '> 코드는 선택된 에이전트가 작성하고, 반대 에이전트가 PR 을 자동 리뷰합니다.',
    ].join('\n');
  }
  return `### 🤝 합의 단계\n\n${tableHead}\n${rows}${footer}`;
}

function escapePipe(s: string): string {
  return s.replace(/\|/g, '\\|');
}
