import { connectDb, disconnectDb } from '../config/db.js';
import { Driver } from '../models/Driver.js';
import { Ride } from '../models/Ride.js';
import { Rider } from '../models/Rider.js';
import { logger } from '../utils/logger.js';

/** Creates/updates all indexes. Run once per environment (and after index changes) — see docs/DATABASE.md. */
async function main() {
  await connectDb();
  await Promise.all(
    [Rider.syncIndexes(), Driver.syncIndexes(), Ride.syncIndexes()]
  );
  logger.info('indexes synced');
  await disconnectDb();
}

main().catch((err) => {
  logger.error({ err }, 'index sync failed');
  process.exit(1);
});
