import { randomUUID } from 'crypto';
import { Ride } from '../../src/models/Ride.js';
import { useTestDb } from '../helpers/db.js';
import {
  FAR_AWAY,
  LIBERTY,
  api,
  bookRide,
  createDriver,
  createRider,
  rideBody
} from '../helpers/factories.js';

useTestDb();

describe(
  'POST /rides — creation',
  () => {
    it(
      'creates a ride with a server-computed fare and ETA',
      async () => {
        const rider = await createRider();
        await createDriver();

        const res = await bookRide(String(rider._id));
        expect(res.status).toBe(201);
        expect(res.body.data).toMatchObject(
          { status: 'requested', category: 'economy', driver: null }
        );
        expect(res.body.data.fare.total).toBeGreaterThanOrEqual(180);
        expect(res.body.data.etaMinutes).toBeGreaterThanOrEqual(2);
        expect(await Ride.countDocuments()).toBe(1);
      }
    );
    it(
      'can be fetched afterwards',
      async () => {
        const rider = await createRider();
        await createDriver();

        const created = await bookRide(String(rider._id));
        const res = await api().get(`/api/v1/rides/${created.body.data.id}`);
        expect(res.status).toBe(200);
        expect(res.body.data.id).toBe(created.body.data.id);
      }
    );
    it(
      'returns 404 for an unknown ride and 400 for a malformed id',
      async () => {
        expect(
          (await api().get('/api/v1/rides/64b7f0c2a1b2c3d4e5f60718')).status
        ).toBe(
          404
        );

        const bad = await api().get('/api/v1/rides/not-an-id');
        expect(bad.status).toBe(400);
        expect(bad.body.error.code).toBe('VALIDATION_ERROR');
      }
    );
  }
);

describe(
  'POST /rides — validation',
  () => {
    it.each([
      ['missing destination', { destination: undefined }],
      ['unknown category', { category: 'luxury' }],
      ['pickup outside Lahore', { pickup: { address: 'Karachi', lat: 24.86, lng: 67.0 } }],
      ['same pickup and destination', { destination: LIBERTY }],
      ['blank address', { pickup: { ...LIBERTY, address: ' ' } }],
      ['non-numeric coordinates', { pickup: { address: 'X', lat: 'abc', lng: 74.3 } }],
    ])(
      'rejects %s with a field-level 400',
      async (_name, override) => {
        const rider = await createRider();
        await createDriver();

        const res = await bookRide(
          String(rider._id),
          { body: rideBody(override) }
        );
        expect(res.status).toBe(400);
        expect(res.body.error.code).toBe('VALIDATION_ERROR');
        expect(res.body.error.details.length).toBeGreaterThan(0);
        expect(res.body.error.requestId).toBeTruthy();
        expect(await Ride.countDocuments()).toBe(0);
      }
    );
    it(
      'requires an Idempotency-Key header',
      async () => {
        const rider = await createRider();
        const res = await api().post('/api/v1/rides').set(
          'X-Rider-Id',
          String(
            rider._id
          )
        ).send(
          rideBody()
        );
        expect(res.status).toBe(400);
        expect(res.body.error.details[0].message).toMatch(/Idempotency-Key/);
      }
    );
    it(
      'requires an identified rider',
      async () => {
        const res = await api().post('/api/v1/rides').set(
          'Idempotency-Key',
          randomUUID()
        ).send(
          rideBody()
        );
        expect(res.status).toBe(401);
      }
    );
    it(
      'returns invalid JSON as 400, not 500',
      async () => {
        const res = await api().post('/api/v1/rides/estimate').set(
          'Content-Type',
          'application/json'
        ).send(
          '{"nope"'
        );
        expect(res.status).toBe(400);
        expect(res.body.error.code).toBe('INVALID_JSON');
      }
    );
  }
);

describe(
  'driver availability at request time',
  () => {
    it(
      'refuses the request when no eligible driver is available',
      async () => {
        const rider = await createRider();
        await createDriver({ status: 'offline' });
        await createDriver({ status: 'busy' });
        await createDriver({ category: 'comfort' }); // wrong category
        await createDriver({ at: FAR_AWAY }); // outside search radius
        const res = await bookRide(String(rider._id));
        expect(res.status).toBe(409);
        expect(res.body.error.code).toBe('NO_DRIVERS_AVAILABLE');
        expect(await Ride.countDocuments()).toBe(0);
      }
    );
    it(
      'estimate reports per-category availability and ETA',
      async () => {
        await createDriver({ category: 'economy' });

        const res = await api()
          .post('/api/v1/rides/estimate')
          .send({ pickup: LIBERTY, destination: rideBody().destination });
        expect(res.status).toBe(200);

        const [economy, comfort] = res.body.data.options;
        expect(economy).toMatchObject({ category: 'economy', available: true });
        expect(economy.etaMinutes).toBeGreaterThanOrEqual(2);
        expect(comfort).toMatchObject(
          { category: 'comfort', available: false, etaMinutes: null }
        );
      }
    );
  }
);

describe(
  'duplicate requests and retries',
  () => {
    it(
      'replays the original ride when the same Idempotency-Key is retried',
      async () => {
        const rider = await createRider();
        await createDriver();

        const key = randomUUID();
        const first = await bookRide(String(rider._id), { key });
        const retry = await bookRide(String(rider._id), { key });
        expect(first.status).toBe(201);
        expect(retry.status).toBe(200);
        expect(retry.headers['idempotent-replayed']).toBe('true');
        expect(retry.body.data.id).toBe(first.body.data.id);
        expect(await Ride.countDocuments()).toBe(1);
      }
    );
    it(
      'rejects reusing a key with a different payload',
      async () => {
        const rider = await createRider();
        await createDriver();
        await createDriver({ category: 'comfort' });

        const key = randomUUID();
        await bookRide(String(rider._id), { key });

        const res = await bookRide(
          String(rider._id),
          {
            key, body: rideBody(
              { category: 'comfort' }
            )
          }
        );
        expect(res.status).toBe(422);
        expect(res.body.error.code).toBe('IDEMPOTENCY_KEY_REUSED');
      }
    );
    it(
      'creates exactly one ride when the same request arrives concurrently',
      async () => {
        const rider = await createRider();
        await createDriver();

        const key = randomUUID();
        const results = await Promise.all(Array.from(
          { length: 8 },
          () => {
            return bookRide(String(rider._id), { key });
          }
        ));
        expect(results.every((r) => {
          return r.status === 200 || r.status === 201;
        })).toBe(true);
        expect(results.filter((r) => {
          return r.status === 201;
        }).length).toBe(1);
        expect(new Set(results.map((r) => {
          return r.body.data.id;
        })).size).toBe(1);
        expect(await Ride.countDocuments()).toBe(1);
      }
    );
    it(
      'blocks a second active ride for the same rider (different key)',
      async () => {
        const rider = await createRider();
        await createDriver();
        await bookRide(String(rider._id));

        const second = await bookRide(String(rider._id));
        expect(second.status).toBe(409);
        expect(second.body.error.code).toBe('RIDER_HAS_ACTIVE_RIDE');
        expect(await Ride.countDocuments()).toBe(1);
      }
    );
  }
);
