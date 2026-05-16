import { config } from '../config.ts';
import type { AgentAdapter, AgentInvocation, AgentResult } from './types.ts';
import { runCli } from './claude.ts';

/**
 * `codex exec --skip-git-check <prompt>` 비대화 모드.
 */
async function invokeCodex(input: AgentInvocation): Promise<AgentResult> {
  const start = Date.now();
  const args = ['exec', '--skip-git-check', input.prompt];
  return runCli(config.CODEX_CLI, args, input, start);
}

export const codexAdapter: AgentAdapter = {
  name: 'codex',
  invoke: invokeCodex,
};
