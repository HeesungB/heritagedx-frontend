import { spawn } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { config } from './config.ts';
import { logger } from './logger.ts';

export interface WorktreeInfo {
  path: string;
  branch: string;
}

function run(
  cmd: string,
  args: string[],
  cwd = config.REPO_DIR,
): Promise<{ stdout: string; stderr: string; code: number }> {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { cwd });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (d) => (stdout += d.toString()));
    child.stderr.on('data', (d) => (stderr += d.toString()));
    child.on('error', reject);
    child.on('close', (code) => resolve({ stdout, stderr, code: code ?? 0 }));
  });
}

export async function ensureWorktree(issueNumber: number): Promise<WorktreeInfo> {
  if (!existsSync(config.WORKTREE_ROOT)) mkdirSync(config.WORKTREE_ROOT, { recursive: true });
  const path = join(config.WORKTREE_ROOT, `issue-${issueNumber}`);
  const branch = `agent/issue-${issueNumber}`;

  if (existsSync(path)) return { path, branch };

  // git fetch first to ensure main is up to date
  await run('git', ['fetch', 'origin', 'main', '--quiet']);
  const create = await run('git', [
    'worktree',
    'add',
    '-b',
    branch,
    path,
    'origin/main',
  ]);
  if (create.code !== 0) {
    // 브랜치가 이미 존재할 수 있음 → 기존 브랜치로 attach 시도
    const reuse = await run('git', ['worktree', 'add', path, branch]);
    if (reuse.code !== 0) {
      logger.error({ stderr: create.stderr || reuse.stderr }, 'worktree add 실패');
      throw new Error(create.stderr || reuse.stderr);
    }
  }
  logger.info({ issueNumber, path, branch }, 'worktree 생성');

  // 의존성 설치 — worktree 는 root 의 node_modules 를 공유하지 않으므로
  // lint / type-check 가 binary·config 를 찾도록 lockfile 기반으로 한 번 install 한다.
  // pnpm-workspace.yaml 이 root 에 있어 worktree 안에서도 정상 동작.
  logger.info({ issueNumber, path }, 'worktree 의존성 설치 시작 (pnpm install)');
  const install = await run('pnpm', ['install', '--frozen-lockfile'], path);
  if (install.code !== 0) {
    logger.warn(
      { issueNumber, code: install.code, stderr: install.stderr.slice(0, 1000) },
      'worktree pnpm install 경고 (계속 진행)',
    );
  } else {
    logger.info({ issueNumber }, 'worktree 의존성 설치 완료');
  }

  return { path, branch };
}

export async function removeWorktree(issueNumber: number): Promise<void> {
  const path = join(config.WORKTREE_ROOT, `issue-${issueNumber}`);
  if (!existsSync(path)) return;
  await run('git', ['worktree', 'remove', '--force', path]);
  logger.info({ issueNumber }, 'worktree 제거');
}

export async function gitInWorktree(
  worktreePath: string,
  args: string[],
): Promise<{ stdout: string; stderr: string; code: number }> {
  return run('git', args, worktreePath);
}

export async function shellInWorktree(
  worktreePath: string,
  cmd: string,
  args: string[],
  envExtra: Record<string, string> = {},
): Promise<{ stdout: string; stderr: string; code: number }> {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, {
      cwd: worktreePath,
      env: { ...process.env, ...envExtra },
    });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (d) => (stdout += d.toString()));
    child.stderr.on('data', (d) => (stderr += d.toString()));
    child.on('error', reject);
    child.on('close', (code) => resolve({ stdout, stderr, code: code ?? 0 }));
  });
}
