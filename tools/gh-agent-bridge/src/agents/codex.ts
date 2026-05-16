import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { config } from '../config.ts';
import { logger } from '../logger.ts';
import type { AgentAdapter, AgentInvocation, AgentResult } from './types.ts';
import { runCli } from './claude.ts';

/**
 * `codex exec --skip-git-repo-check --color never -o <file> <prompt>` 비대화 모드.
 * stdout 에는 보더/세션메타/사용자 prompt 에코까지 섞이므로
 * `-o` 로 최종 메시지를 파일에 받아 그것만 stdout 으로 반환한다.
 */
async function invokeCodex(input: AgentInvocation): Promise<AgentResult> {
  const dir = mkdtempSync(join(tmpdir(), 'codex-'));
  const outFile = join(dir, 'last.md');
  const start = Date.now();
  const args = [
    'exec',
    '--skip-git-repo-check',
    '--color',
    'never',
    // implement 단계에서 codex 가 worktree 안 파일을 직접 써야 하므로
    // default `read-only` 가 아닌 workspace-write 로 sandbox 를 풀어준다.
    // plan 단계는 코드 변경을 하지 않으므로 영향 없다.
    '--sandbox',
    'workspace-write',
    '-o',
    outFile,
    input.prompt,
  ];
  const res = await runCli(config.CODEX_CLI, args, input, start);
  let body = '';
  try {
    body = readFileSync(outFile, 'utf8');
  } catch (err) {
    logger.warn({ err: (err as Error).message, outFile }, 'codex output 파일 read 실패');
  }
  try {
    rmSync(dir, { recursive: true, force: true });
  } catch {
    // best-effort cleanup
  }
  return { ...res, stdout: body || res.stdout };
}

export const codexAdapter: AgentAdapter = {
  name: 'codex',
  invoke: invokeCodex,
};
