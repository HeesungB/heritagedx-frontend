import { z } from 'zod';

export const PlanSize = z.enum(['small', 'medium', 'large']);
export type PlanSize = z.infer<typeof PlanSize>;

export const PlanSchema = z.object({
  size: PlanSize,
  approach: z.string().min(1),
  key_files: z.array(z.string()).default([]),
  steps: z.array(z.string()).default([]),
  risks: z.array(z.string()).default([]),
});
export type Plan = z.infer<typeof PlanSchema>;

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
  return [
    `### ${author} 플랜`,
    '',
    `- **size**: \`${plan.size}\``,
    `- **approach**: ${plan.approach}`,
    plan.key_files.length ? `- **key_files**: ${plan.key_files.map((f) => `\`${f}\``).join(', ')}` : '',
    plan.steps.length ? '\n**steps**\n' + plan.steps.map((s, i) => `${i + 1}. ${s}`).join('\n') : '',
    plan.risks.length ? '\n**risks**\n' + plan.risks.map((r) => `- ${r}`).join('\n') : '',
    prose ? '\n---\n' + prose : '',
  ]
    .filter(Boolean)
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
    footer =
      '\n\n> 두 에이전트 모두 **large** 판정. 작은 단위로 분해를 제안합니다. `/approve-split` 또는 `/reject-split` 으로 응답해 주세요.';
  } else if (verdict.verdict === 'disagree') {
    footer = `\n\n> 사이즈 의견 차이 (${verdict.sizes.join(' vs ')}). 어느 쪽 접근으로 갈지 댓글로 알려주세요.`;
  } else {
    footer = `\n\n> 합의 \`${verdict.size}\`. \`/implement claude|codex\` 로 구현을 시작할 수 있습니다.`;
  }
  return `### 합의 단계\n\n${tableHead}\n${rows}${footer}`;
}

function escapePipe(s: string): string {
  return s.replace(/\|/g, '\\|');
}
