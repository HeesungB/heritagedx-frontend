import { config } from './config.ts';
import { logger } from './logger.ts';
import { createServer } from './server.ts';
import { startQueueLoop } from './queue.ts';
import { ensureAllLabels } from './state.ts';

async function main(): Promise<void> {
  await ensureAllLabels().catch((err) =>
    logger.warn({ err }, '라벨 동기화 실패 (권한 점검 필요)'),
  );

  const app = await createServer();
  await app.listen({ port: config.PORT, host: config.HOST });
  logger.info({ host: config.HOST, port: config.PORT }, 'webhook server listening');

  startQueueLoop();
  logger.info({ concurrency: config.WORKER_CONCURRENCY }, 'queue loop started');

  process.on('SIGTERM', () => {
    logger.info('SIGTERM 수신, 종료');
    void app.close().then(() => process.exit(0));
  });
}

main().catch((err) => {
  logger.fatal({ err }, '부팅 실패');
  process.exit(1);
});
