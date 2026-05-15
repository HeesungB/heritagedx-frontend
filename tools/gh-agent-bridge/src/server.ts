import Fastify from 'fastify';
import { Webhooks } from '@octokit/webhooks';
import { config } from './config.ts';
import { logger } from './logger.ts';
import { enqueueEvent } from './queue.ts';

export async function createServer() {
  const app = Fastify({ logger: false, bodyLimit: 25 * 1024 * 1024 });
  const webhooks = new Webhooks({ secret: config.GITHUB_WEBHOOK_SECRET });

  app.get('/health', async () => ({ ok: true, ts: Date.now() }));

  app.post('/webhook', async (req, reply) => {
    const id = req.headers['x-github-delivery'] as string | undefined;
    const name = req.headers['x-github-event'] as string | undefined;
    const sig = req.headers['x-hub-signature-256'] as string | undefined;
    if (!id || !name || !sig) {
      logger.warn({ id, name, hasSig: Boolean(sig) }, '필수 헤더 누락');
      return reply.code(400).send({ error: 'bad request' });
    }
    const rawBody = JSON.stringify(req.body);
    const valid = await webhooks.verify(rawBody, sig);
    if (!valid) {
      logger.warn({ id }, '서명 검증 실패');
      return reply.code(401).send({ error: 'bad signature' });
    }
    logger.info({ id, name, action: (req.body as { action?: string }).action }, 'webhook received');
    enqueueEvent(id, name, req.body);
    return { queued: true };
  });

  return app;
}
