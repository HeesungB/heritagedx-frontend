import { claudeAdapter } from './claude.ts';
import { codexAdapter } from './codex.ts';
import type { AgentAdapter, AgentName } from './types.ts';

export const agents: Record<AgentName, AgentAdapter> = {
  claude: claudeAdapter,
  codex: codexAdapter,
};

export function otherAgent(name: AgentName): AgentName {
  return name === 'claude' ? 'codex' : 'claude';
}

export type { AgentAdapter, AgentName, AgentInvocation, AgentResult } from './types.ts';
