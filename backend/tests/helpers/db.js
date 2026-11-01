import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

/** Call once at the top of an integration test file: real MongoDB (in-memory), real indexes, clean state per test. */
export function useTestDb() {
  let mongod;
  beforeAll(
    async () => {
      mongod = await MongoMemoryServer.create();
      await mongoose.connect(mongod.getUri(), { dbName: 'ride_test' });

      const [{ Ride }, { Driver }, { Rider }] = await Promise.all([
        import('../../src/models/Ride.js'),
        import('../../src/models/Driver.js'),
        import('../../src/models/Rider.js'),
      ]);
      await Promise.all([Ride.init(), Driver.init(), Rider.init()]); // build unique + 2dsphere indexes before any test runs
    },
    120_000
  ); // first run downloads a mongod binary
  afterEach(async () => {
    await Promise.all(Object.values(mongoose.connection.collections).map((c) => {
      return c.deleteMany({});
    }));
  });
  afterAll(async () => {
    await mongoose.disconnect();
    await mongod.stop();
  });
}
