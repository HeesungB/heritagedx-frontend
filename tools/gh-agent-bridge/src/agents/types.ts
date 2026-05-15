export type AgentName = 'claude' | 'codex';

export interface AgentInvocation {
  /** 시스템/사용자 프롬프트가 합쳐진 단일 문자열. CLI 가 -p / exec 로 받음. */
  prompt: string;
  /** 작업 디렉토리. plan/review 는 REPO_DIR, implement 는 worktree path. */
  cwd: string;
  /** 진행 로그용 라벨 (이슈 #, 단계 등). */
  label: string;
  /** 최대 실행 시간 (ms). 기본 8분. */
  timeoutMs?: number;
}

export interface AgentResult {
  ok: boolean;
  stdout: string;
  stderr: string;
  durationMs: number;
  exitCode: number;
}

export interface AgentAdapter {
  name: AgentName;
  invoke: (input: AgentInvocation) => Promise<AgentResult>;
}
