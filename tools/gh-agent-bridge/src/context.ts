import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { config } from './config.ts';

function readIfExists(path: string, maxBytes = 200_000): string {
  if (!existsSync(path)) return '';
  const raw = readFileSync(path, 'utf8');
  return raw.length > maxBytes ? raw.slice(0, maxBytes) + '\n[... 잘림 ...]' : raw;
}

export function loadClaudeMd(): string {
  return readIfExists(join(config.REPO_DIR, 'CLAUDE.md'));
}

export function loadStructureExcerpt(maxBytes = 12_000): string {
  return readIfExists(join(config.REPO_DIR, 'STRUCTURE.md'), maxBytes);
}

export function recentCommits(count = 10): string {
  const r = spawnSync(
    'git',
    ['log', '-n', String(count), '--pretty=format:- %h %s'],
    { cwd: config.REPO_DIR, encoding: 'utf8' },
  );
  return (r.stdout ?? '').trim();
}

export function priorCommentsAsText(
  comments: Array<{ user: { login: string } | null; body?: string | null; created_at: string }>,
): string {
  return comments
    .map((c) => `### @${c.user?.login ?? 'unknown'} (${c.created_at})\n${c.body ?? ''}`)
    .join('\n\n');
}
