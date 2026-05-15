import PQueue from 'p-queue';
import { config } from './config.ts';
import { stmts, type EventRow } from './db.ts';
import { logger } from './logger.ts';
import { handleIssueOpened } from './handlers/issue.ts';
import { handleIssueComment } from './handlers/comment.ts';
import { handlePrOpened } from './handlers/pr.ts';

const pool = new PQueue({ concurrency: config.WORKER_CONCURRENCY });

/** 같은 이슈에 대한 작업을 직렬화하기 위한 mutex 집합. */
const issueLocks = new Map<number, PQueue>();
function issueLock(issueNumber: number): PQueue {
  let q = issueLocks.get(issueNumber);
  if (!q) {
    q = new PQueue({ concurrency: 1 });
    issueLocks.set(issueNumber, q);
  }
  return q;
}

interface ParsedPayload {
  action?: string;
  issue?: { number: number };
  pull_request?: { number: number };
  comment?: { body: string; user: { login: string } };
  sender?: { login: string };
}

async function dispatch(event: EventRow): Promise<void> {
  const payload = JSON.parse(event.payload) as ParsedPayload;
  switch (event.event_name) {
    case 'issues': {
      const n = payload.issue?.number;
      if (!n) return;
      if (payload.action === 'opened' || payload.action === 'labeled') {
        await issueLock(n).add(() => handleIssueOpened(n));
      }
      return;
    }
    case 'issue_comment': {
      const n = payload.issue?.number;
      if (!n || !payload.comment) return;
      const isPr = Boolean((payload.issue as unknown as { pull_request?: unknown })?.pull_request);
      await issueLock(n).add(() =>
        handleIssueComment({
          issueNumber: n,
          commenterLogin: payload.comment!.user.login,
          body: payload.comment!.body,
          isFromPr: isPr,
          prNumber: isPr ? n : undefined,
        }),
      );
      return;
    }
    case 'pull_request': {
      const n = payload.pull_request?.number;
      if (!n) return;
      if (payload.action === 'opened' || payload.action === 'reopened' || payload.action === 'synchronize') {
        await issueLock(n).add(() => handlePrOpened(n));
      }
      return;
    }
    default:
      logger.debug({ event_name: event.event_name }, 'unhandled event');
  }
}

export async function processNext(): Promise<boolean> {
  const event = stmts.nextQueued.get() as EventRow | undefined;
  if (!event) return false;
  stmts.markRunning.run(event.id);
  pool.add(async () => {
    try {
      await dispatch(event);
      stmts.markDone.run(event.id);
    } catch (err) {
      logger.error({ err, eventId: event.id }, 'event dispatch 실패');
      stmts.markFailed.run((err as Error).message ?? 'unknown', event.id);
    }
  });
  return true;
}

export function startQueueLoop(): NodeJS.Timeout {
  return setInterval(() => {
    void (async () => {
      let kept = true;
      while (kept) kept = await processNext();
    })();
  }, 1000);
}

export function enqueueEvent(deliveryId: string, eventName: string, payload: unknown): void {
  stmts.insertEvent.run({
    delivery_id: deliveryId,
    event_name: eventName,
    payload: JSON.stringify(payload),
  });
}
