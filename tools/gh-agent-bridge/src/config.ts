import 'dotenv/config';
import { z } from 'zod';

const Schema = z.object({
  GITHUB_APP_ID: z.string().min(1),
  GITHUB_APP_PRIVATE_KEY_PATH: z.string().min(1),
  GITHUB_APP_INSTALLATION_ID: z.string().min(1),
  GITHUB_OWNER: z.string().min(1),
  GITHUB_REPO: z.string().min(1),
  GITHUB_WEBHOOK_SECRET: z.string().min(1),

  PORT: z.coerce.number().int().positive().default(7878),
  HOST: z.string().default('127.0.0.1'),
  PUBLIC_WEBHOOK_URL: z.string().url(),

  CLAUDE_CLI: z.string().min(1),
  CODEX_CLI: z.string().min(1),
  GH_CLI: z.string().min(1).default('/opt/homebrew/bin/gh'),

  REPO_DIR: z.string().min(1),
  WORKTREE_ROOT: z.string().min(1),
  DB_PATH: z.string().min(1),

  WORKER_CONCURRENCY: z.coerce.number().int().positive().default(4),
  DAILY_BUDGET_USD: z.coerce.number().positive().default(20),
  ALLOWED_LOGINS: z
    .string()
    .default('')
    .transform((s) => s.split(',').map((x) => x.trim()).filter(Boolean)),

  LOG_LEVEL: z
    .enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal'])
    .default('info'),

  SCREENSHOT_OS_PORT: z.coerce.number().int().positive().default(3100),
  SCREENSHOT_BO_PORT: z.coerce.number().int().positive().default(3101),
  SCREENSHOT_TIMEOUT_MS: z.coerce.number().int().positive().default(20000),
});

const parsed = Schema.safeParse(process.env);
if (!parsed.success) {
  // eslint-disable-next-line no-console
  console.error('환경변수 검증 실패:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const config = parsed.data;
export type AppConfig = typeof config;
