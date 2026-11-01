import { Driver } from '../../src/models/Driver.js';
import { Ride } from '../../src/models/Ride.js';
import { useTestDb } from '../helpers/db.js';
import {
  acceptRide,
  bookRide,
  cancelRide,
  createDriver,
  createRider
} from '../helpers/factories.js';

useTestDb();

describe(
  'concurrent driver acceptance',
  () => {
    it(
      'lets exactly one of many drivers accept the same ride',
      async () => {
        const rider = await createRider();
        const drivers = await Promise.all(Array.from(
          { length: 10 },
          () => {
            return createDriver();
          }
        ));
        const created = await bookRide(String(rider._id));
        const rideId = created.body.data.id;
        const results = await Promise.all(drivers.map((d) => {
          return acceptRide(rideId, String(d._id));
        }));
        const winners = results.filter((r) => {
          return r.status === 200;
        });
        const losers = results.filter((r) => {
          return r.status !== 200;
        });
        expect(winners).toHaveLength(1);
        expect(losers).toHaveLength(9);
        expect(losers.every((r) => {
          return r.status === 409;
        })).toBe(true);

        const winnerId = winners[0].body.data.driverId;
        expect(String((await Ride.findById(rideId))?.driver)).toBe(winnerId);

        // No driver is left stuck in "busy": exactly the winner is busy, everyone else is available again.
        const states = await Driver.find();
        expect(states.filter((d) => {
          return d.status === 'busy';
        }).map((d) => {
          return String(d._id);
        })).toEqual([winnerId]);
        expect(states.filter((d) => {
          return d.status === 'available';
        })).toHaveLength(9);
        expect(states.filter((d) => {
          return d.status === 'available';
        }).every((d) => {
          return d.currentRide === null;
        })).toBe(true);
      }
    );
    it(
      'never assigns one driver to two rides at the same time',
      async () => {
        const [riderA, riderB, driver] = await Promise.all(
          [createRider('A'), createRider(
            'B'
          ), createDriver()]
        );
        const [rideA, rideB] = await Promise.all(
          [bookRide(String(riderA._id)), bookRide(
            String(
              riderB._id
            )
          )]
        );
        const results = await Promise.all([
          acceptRide(rideA.body.data.id, String(driver._id)),
          acceptRide(rideB.body.data.id, String(driver._id)),
        ]);
        expect(results.map((r) => {
          return r.status;
        }).sort()).toEqual([200, 409]);
        expect(
          await Ride.countDocuments(
            { driver: driver._id, status: 'accepted' }
          )
        ).toBe(
          1
        );
        expect(await Ride.countDocuments({ status: 'requested' })).toBe(1);
      }
    );
    it(
      'survives repeated racing between accept and cancel without leaking a busy driver',
      async () => {
        for (let i = 0; i < 10; i++) {
          const rider = await createRider(`R${i}`);
          const driver = await createDriver();
          const created = await bookRide(String(rider._id));
          const rideId = created.body.data.id;
          await Promise.all(
            [acceptRide(rideId, String(driver._id)), cancelRide(
              rideId,
              String(
                rider._id
              )
            )]
          );

          const ride = await Ride.findById(rideId);
          const after = await Driver.findById(driver._id);
          // Whatever order won, state must be consistent.
          expect(ride?.status).toBe('cancelled');
          expect(after?.status).toBe('available');
          expect(after?.currentRide).toBeNull();
          await Promise.all([Ride.deleteMany({}), Driver.deleteMany({})]);
        }
      }
    );
  }
);
