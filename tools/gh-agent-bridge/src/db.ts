import Database from 'better-sqlite3';
import { dirname } from 'node:path';
import { mkdirSync } from 'node:fs';
import { config } from './config.ts';
import { logger } from './logger.ts';

mkdirSync(dirname(config.DB_PATH), { recursive: true });

export const db = new Database(config.DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('synchronous = NORMAL');

db.exec(`
CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  delivery_id TEXT UNIQUE NOT NULL,
  event_name TEXT NOT NULL,
  payload TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued',  -- queued | running | done | failed
  attempts INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  created_at INTEGER NOT NULL DEFAULT (strftime('%s','now')),
  updated_at INTEGER NOT NULL DEFAULT (strftime('%s','now'))
);

CREATE TABLE IF NOT EXISTS issue_state (
  issue_number INTEGER PRIMARY KEY,
  worktree_path TEXT,
  branch TEXT,
  claude_plan_json TEXT,
  codex_plan_json TEXT,
  consensus_size TEXT,                    -- small | medium | large | disagree
  last_label TEXT,
  updated_at INTEGER NOT NULL DEFAULT (strftime('%s','now'))
);

CREATE TABLE IF NOT EXISTS pr_state (
  pr_number INTEGER PRIMARY KEY,
  issue_number INTEGER,
  author_agent TEXT,                      -- claude | codex
  reviewer_agent TEXT,
  reviewed_at INTEGER,
  updated_at INTEGER NOT NULL DEFAULT (strftime('%s','now'))
);

CREATE TABLE IF NOT EXISTS budget_usage (
  day TEXT PRIMARY KEY,                   -- yyyy-mm-dd
  usd REAL NOT NULL DEFAULT 0
);
`);

logger.info({ path: config.DB_PATH }, 'sqlite ready');

export type EventStatus = 'queued' | 'running' | 'done' | 'failed';

export interface EventRow {
  id: number;
  delivery_id: string;
  event_name: string;
  payload: string;
  status: EventStatus;
  attempts: number;
  last_error: string | null;
  created_at: number;
  updated_at: number;
}

export const stmts = {
  insertEvent: db.prepare<{
    delivery_id: string;
    event_name: string;
    payload: string;
  }>(
    `INSERT OR IGNORE INTO events (delivery_id, event_name, payload) VALUES (@delivery_id, @event_name, @payload)`,
  ),
  nextQueued: db.prepare(
    `SELECT * FROM events WHERE status='queued' ORDER BY id ASC LIMIT 1`,
  ),
  markRunning: db.prepare(
    `UPDATE events SET status='running', attempts=attempts+1, updated_at=strftime('%s','now') WHERE id=?`,
  ),
  markDone: db.prepare(
    `UPDATE events SET status='done', updated_at=strftime('%s','now') WHERE id=?`,
  ),
  markFailed: db.prepare(
    `UPDATE events SET status='failed', last_error=?, updated_at=strftime('%s','now') WHERE id=?`,
  ),
  upsertIssueState: db.prepare<{
    issue_number: number;
    worktree_path: string | null;
    branch: string | null;
    last_label: string | null;
  }>(
    `INSERT INTO issue_state (issue_number, worktree_path, branch, last_label)
     VALUES (@issue_number, @worktree_path, @branch, @last_label)
     ON CONFLICT(issue_number) DO UPDATE SET
       worktree_path=COALESCE(excluded.worktree_path, issue_state.worktree_path),
       branch=COALESCE(excluded.branch, issue_state.branch),
       last_label=COALESCE(excluded.last_label, issue_state.last_label),
       updated_at=strftime('%s','now')`,
  ),
  setPlan: db.prepare<{
    issue_number: number;
    agent: 'claude' | 'codex';
    plan_json: string;
  }>(
    `UPDATE issue_state
       SET claude_plan_json = CASE WHEN @agent='claude' THEN @plan_json ELSE claude_plan_json END,
           codex_plan_json  = CASE WHEN @agent='codex'  THEN @plan_json ELSE codex_plan_json END,
           updated_at=strftime('%s','now')
     WHERE issue_number=@issue_number`,
  ),
  getIssueState: db.prepare<number>(
    `SELECT * FROM issue_state WHERE issue_number=?`,
  ),
  setConsensus: db.prepare<{ issue_number: number; consensus_size: string }>(
    `UPDATE issue_state SET consensus_size=@consensus_size, updated_at=strftime('%s','now') WHERE issue_number=@issue_number`,
  ),
  upsertPr: db.prepare<{
    pr_number: number;
    issue_number: number | null;
    author_agent: string;
  }>(
    `INSERT INTO pr_state (pr_number, issue_number, author_agent)
     VALUES (@pr_number, @issue_number, @author_agent)
     ON CONFLICT(pr_number) DO UPDATE SET
       issue_number=COALESCE(excluded.issue_number, pr_state.issue_number),
       author_agent=excluded.author_agent,
       updated_at=strftime('%s','now')`,
  ),
  setReviewer: db.prepare<{ pr_number: number; reviewer_agent: string }>(
    `UPDATE pr_state SET reviewer_agent=@reviewer_agent, reviewed_at=strftime('%s','now'), updated_at=strftime('%s','now') WHERE pr_number=@pr_number`,
  ),
  addBudget: db.prepare<{ day: string; usd: number }>(
    `INSERT INTO budget_usage (day, usd) VALUES (@day, @usd)
     ON CONFLICT(day) DO UPDATE SET usd = usd + excluded.usd`,
  ),
  getBudget: db.prepare<string>(`SELECT usd FROM budget_usage WHERE day=?`),
};
