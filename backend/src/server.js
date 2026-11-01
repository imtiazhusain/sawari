import { createApp } from './app.js';
import { connectDb, disconnectDb } from './config/db.js';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';

async function main() {
  await connectDb();

  const server = createApp().listen(
    env.PORT,
    () => {
      return logger.info({ port: env.PORT }, 'API listening');
    }
  );
  const shutdown = (signal) => {
    logger.info({ signal }, 'shutting down');
    server.close(async () => {
      await disconnectDb();
      process.exit(0);
    });
    setTimeout(
      () => {
        return process.exit(1);
      },
      10_000
    ).unref(); // hard stop if connections hang
  };
  process.on(
    'SIGTERM',
    () => {
      return shutdown('SIGTERM');
    }
  );
  process.on(
    'SIGINT',
    () => {
      return shutdown('SIGINT');
    }
  );
}

main().catch((err) => {
  logger.fatal({ err }, 'failed to start');
  process.exit(1);
});
