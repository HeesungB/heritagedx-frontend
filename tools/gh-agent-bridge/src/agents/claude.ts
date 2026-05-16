import { spawn } from 'node:child_process';
import { config } from '../config.ts';
import { logger } from '../logger.ts';
import type { AgentAdapter, AgentInvocation, AgentResult } from './types.ts';

/**
 * `claude -p <prompt>` 비대화 모드. 출력은 plain text (기본 --output-format text).
 * 도구 사용은 implement 단계에서만 필요하므로 호출 측이 --allowedTools 를 prompt 에 자연어로 명시한다.
 * 별도 시스템 옵션은 두지 않고 단순히 stdout 을 모은다.
 */
async function invokeClaude(input: AgentInvocation): Promise<AgentResult> {
  const start = Date.now();
  const args = ['-p', input.prompt];
  return runCli(config.CLAUDE_CLI, args, input, start);
}

function runCli(
  cli: string,
  args: string[],
  input: AgentInvocation,
  start: number,
): Promise<AgentResult> {
  return new Promise((resolve) => {
    logger.info({ cli, label: input.label, cwd: input.cwd }, 'agent invoke');
    // stdin 은 의도적으로 ignore. codex CLI 는 stdin 이 piped 면 추가 prompt 로 인식해 EOF 까지 대기하므로
    // 우리 spawn 의 기본 'pipe' 가 그대로면 6분 timeout 까지 hang 한다.
    const child = spawn(cli, args, { cwd: input.cwd, stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';
    const timer = setTimeout(() => {
      child.kill('SIGTERM');
      stderr += `\n[timeout after ${input.timeoutMs ?? 480000}ms]`;
    }, input.timeoutMs ?? 480000);

    child.stdout.on('data', (d) => (stdout += d.toString()));
    child.stderr.on('data', (d) => (stderr += d.toString()));
    child.on('error', (err) => {
      clearTimeout(timer);
      resolve({
        ok: false,
        stdout,
        stderr: stderr + '\n' + String(err),
        durationMs: Date.now() - start,
        exitCode: -1,
      });
    });
    child.on('close', (code) => {
      clearTimeout(timer);
      resolve({
        ok: code === 0,
        stdout,
        stderr,
        durationMs: Date.now() - start,
        exitCode: code ?? -1,
      });
    });
  });
}

export const claudeAdapter: AgentAdapter = {
  name: 'claude',
  invoke: invokeClaude,
};

export { runCli };
