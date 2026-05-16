import { readFileSync } from 'node:fs';
import { Octokit } from '@octokit/rest';
import { createAppAuth } from '@octokit/auth-app';
import { config } from './config.ts';
import { logger } from './logger.ts';

const privateKey = readFileSync(config.GITHUB_APP_PRIVATE_KEY_PATH, 'utf8');

export const octokit = new Octokit({
  authStrategy: createAppAuth,
  auth: {
    appId: config.GITHUB_APP_ID,
    privateKey,
    installationId: config.GITHUB_APP_INSTALLATION_ID,
  },
});

const { GITHUB_OWNER: owner, GITHUB_REPO: repo } = config;

export async function postIssueComment(
  issueNumber: number,
  body: string,
): Promise<void> {
  await octokit.issues.createComment({ owner, repo, issue_number: issueNumber, body });
}

export async function postPrReviewComment(
  prNumber: number,
  body: string,
  event: 'COMMENT' | 'REQUEST_CHANGES' | 'APPROVE' = 'COMMENT',
): Promise<void> {
  await octokit.pulls.createReview({
    owner,
    repo,
    pull_number: prNumber,
    body,
    event,
  });
}

export async function listIssueComments(issueNumber: number) {
  const { data } = await octokit.issues.listComments({
    owner,
    repo,
    issue_number: issueNumber,
    per_page: 100,
  });
  return data;
}

export async function ensureLabel(name: string, color: string, description = ''): Promise<void> {
  try {
    await octokit.issues.getLabel({ owner, repo, name });
  } catch (err) {
    if ((err as { status?: number }).status === 404) {
      await octokit.issues.createLabel({ owner, repo, name, color, description });
      logger.info({ name }, 'created label');
    } else {
      throw err;
    }
  }
}

export async function setIssueLabels(
  issueNumber: number,
  labels: string[],
  removePrefixes: string[] = [],
): Promise<void> {
  const { data: existing } = await octokit.issues.listLabelsOnIssue({
    owner,
    repo,
    issue_number: issueNumber,
  });
  const keep = existing
    .map((l) => l.name)
    .filter((n) => !removePrefixes.some((p) => n.startsWith(p)));
  const next = Array.from(new Set([...keep, ...labels]));
  await octokit.issues.setLabels({ owner, repo, issue_number: issueNumber, labels: next });
}

export async function createSubIssue(
  parentNumber: number,
  title: string,
  body: string,
): Promise<number> {
  const linked = `Parent: #${parentNumber}\n\n${body}`;
  const { data } = await octokit.issues.create({
    owner,
    repo,
    title,
    body: linked,
    labels: ['state:new', 'sub-of-' + parentNumber],
  });
  return data.number;
}

export async function getIssue(issueNumber: number) {
  const { data } = await octokit.issues.get({ owner, repo, issue_number: issueNumber });
  return data;
}

export async function getPullRequest(prNumber: number) {
  const { data } = await octokit.pulls.get({ owner, repo, pull_number: prNumber });
  return data;
}

export async function listPrFiles(prNumber: number) {
  const { data } = await octokit.pulls.listFiles({
    owner,
    repo,
    pull_number: prNumber,
    per_page: 300,
  });
  return data;
}

export const repoCoords = { owner, repo };
