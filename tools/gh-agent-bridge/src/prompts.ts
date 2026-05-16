import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROMPTS_DIR = join(__dirname, '..', 'prompts');

function load(name: string): string {
  return readFileSync(join(PROMPTS_DIR, name), 'utf8');
}

export const PROMPTS = {
  plan: load('plan.md'),
  implement: load('implement.md'),
  review: load('review.md'),
  slashHelp: load('slash-help.md'),
};

export interface PromptContext {
  agent: 'claude' | 'codex';
  issueTitle: string;
  issueBody: string;
  recentCommits: string;
  structureExcerpt: string;
  claudeMd: string;
  priorComments?: string;
}

export function buildPlanPrompt(ctx: PromptContext): string {
  return PROMPTS.plan
    .replace('{{AGENT}}', ctx.agent.toUpperCase())
    .replace('{{ISSUE_TITLE}}', ctx.issueTitle)
    .replace('{{ISSUE_BODY}}', ctx.issueBody)
    .replace('{{RECENT_COMMITS}}', ctx.recentCommits)
    .replace('{{STRUCTURE}}', ctx.structureExcerpt)
    .replace('{{CLAUDE_MD}}', ctx.claudeMd)
    .replace('{{PRIOR_COMMENTS}}', ctx.priorComments ?? '');
}

export function buildImplementPrompt(ctx: PromptContext, plan: string): string {
  return PROMPTS.implement
    .replace('{{AGENT}}', ctx.agent.toUpperCase())
    .replace('{{ISSUE_TITLE}}', ctx.issueTitle)
    .replace('{{ISSUE_BODY}}', ctx.issueBody)
    .replace('{{PLAN}}', plan)
    .replace('{{PRIOR_COMMENTS}}', ctx.priorComments ?? '');
}

export function buildReviewPrompt(
  reviewer: 'claude' | 'codex',
  authorAgent: 'claude' | 'codex',
  prTitle: string,
  prBody: string,
  diff: string,
): string {
  return PROMPTS.review
    .replace('{{REVIEWER}}', reviewer.toUpperCase())
    .replace('{{AUTHOR}}', authorAgent.toUpperCase())
    .replace('{{PR_TITLE}}', prTitle)
    .replace('{{PR_BODY}}', prBody)
    .replace('{{DIFF}}', diff);
}
