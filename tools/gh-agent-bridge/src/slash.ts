export type AgentName = 'claude' | 'codex';

export type SlashCommand =
  | { kind: 'ask'; target: AgentName | 'both'; text: string }
  | { kind: 'implement'; agent: AgentName }
  | { kind: 'approve-split' }
  | { kind: 'reject-split' }
  | { kind: 'cancel' }
  | { kind: 'screenshot'; route: string }
  | { kind: 'handoff'; to: AgentName }
  | { kind: 'help' }
  | null;

/**
 * 댓글 본문의 첫 줄만 슬래시 커맨드로 해석한다. 첫 줄이 슬래시로 시작하지 않으면 null.
 * 봇 자기 자신의 코멘트 필터링은 호출 측에서 commenter login 으로 분리한다.
 */
export function parseSlash(body: string): SlashCommand {
  const firstLine = body.split(/\r?\n/, 1)[0]?.trim() ?? '';
  if (!firstLine.startsWith('/')) return null;

  const [head, ...rest] = firstLine.split(/\s+/);
  const arg = rest.join(' ').trim();

  switch (head) {
    case '/claude':
      return { kind: 'ask', target: 'claude', text: arg };
    case '/codex':
      return { kind: 'ask', target: 'codex', text: arg };
    case '/both':
      return { kind: 'ask', target: 'both', text: arg };
    case '/implement': {
      const agent = arg.toLowerCase() as AgentName;
      if (agent !== 'claude' && agent !== 'codex') return { kind: 'help' };
      return { kind: 'implement', agent };
    }
    case '/approve-split':
      return { kind: 'approve-split' };
    case '/reject-split':
    case '/no':
      return { kind: 'reject-split' };
    case '/cancel':
      return { kind: 'cancel' };
    case '/screenshot':
      return { kind: 'screenshot', route: arg || '/' };
    case '/handoff': {
      const to = arg.toLowerCase() as AgentName;
      if (to !== 'claude' && to !== 'codex') return { kind: 'help' };
      return { kind: 'handoff', to };
    }
    case '/help':
      return { kind: 'help' };
    default:
      return null;
  }
}

export const HELP_TEXT = `**슬래시 커맨드**
- \`/claude <message>\` Claude 에게만 질문
- \`/codex <message>\` Codex 에게만 질문
- \`/both <message>\` 두 에이전트 모두에게 (병렬)
- \`/implement claude|codex\` 구현 시작 → PR 생성
- \`/approve-split\` 분해 제안 승인 → sub-issue 자동 생성
- \`/reject-split\` 분해 거절, 단일 PR 로 진행
- \`/cancel\` 현재 진행 중 작업 취소
- \`/screenshot <route>\` 특정 라우트 강제 캡처
- \`/handoff claude|codex\` PR 작성자 변경
- \`/help\` 이 도움말`;
