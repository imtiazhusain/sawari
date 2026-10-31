import { Driver } from '../../src/models/Driver.js';
import { Ride } from '../../src/models/Ride.js';
import { useTestDb } from '../helpers/db.js';
import {
  FAR_AWAY,
  acceptRide,
  api,
  bookRide,
  cancelRide,
  completeRide,
  createDriver,
  createRider,
} from '../helpers/factories.js';
useTestDb();
async function requestedRide() {
  const rider = await createRider();
  const driver = await createDriver();
  const res = await bookRide(String(rider._id));
  return { rider, driver, rideId: res.body.data.id };
}
describe('driver assignment', () => {
  it('assigns the driver and marks them busy', async () => {
    const { driver, rideId } = await requestedRide();
    const res = await acceptRide(rideId, String(driver._id));
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ status: 'accepted', driverId: String(driver._id) });
    expect(res.body.data.driver.name).toBe(driver.name);
    const after = await Driver.findById(driver._id);
    expect(after?.status).toBe('busy');
    expect(String(after?.currentRide)).toBe(rideId);
  });
  it('does not let a second driver take an already accepted ride', async () => {
    const { driver, rideId } = await requestedRide();
    const other = await createDriver();
    await acceptRide(rideId, String(driver._id));
    const res = await acceptRide(rideId, String(other._id));
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('INVALID_STATE_TRANSITION');
    expect((await Driver.findById(other._id))?.status).toBe('available'); // not left busy by the failed attempt
  });
  it.each([
    ['an offline driver', { status: 'offline' }, 'DRIVER_UNAVAILABLE', 409],
    ['a busy driver', { status: 'busy' }, 'DRIVER_UNAVAILABLE', 409],
    ['a driver of the wrong category', { category: 'comfort' }, 'DRIVER_NOT_ELIGIBLE', 403],
    ['a driver too far from the pickup', { at: FAR_AWAY }, 'DRIVER_TOO_FAR', 409],
  ])('rejects %s', async (_label, over, code, status) => {
    const { rideId } = await requestedRide();
    const ineligible = await createDriver(over);
    const res = await acceptRide(rideId, String(ineligible._id));
    expect(res.status).toBe(status);
    expect(res.body.error.code).toBe(code);
    expect((await Ride.findById(rideId))?.status).toBe('requested');
  });
  it('404s for unknown driver or ride', async () => {
    const { rideId, driver } = await requestedRide();
    expect((await acceptRide(rideId, '64b7f0c2a1b2c3d4e5f60718')).status).toBe(404);
    expect((await acceptRide('64b7f0c2a1b2c3d4e5f60718', String(driver._id))).status).toBe(404);
  });
});
describe('ride lifecycle transitions', () => {
  it('walks requested -> accepted -> completed and frees the driver', async () => {
    const { rider, driver, rideId } = await requestedRide();
    await acceptRide(rideId, String(driver._id));
    const res = await completeRide(rideId, String(driver._id));
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('completed');
    expect(res.body.data.completedAt).toBeTruthy();
    const freed = await Driver.findById(driver._id);
    expect(freed?.status).toBe('available');
    expect(freed?.currentRide).toBeNull();
    // the rider can book again once the ride is finished
    expect((await bookRide(String(rider._id))).status).toBe(201);
  });
  it('cannot complete a ride that was never accepted', async () => {
    const { driver, rideId } = await requestedRide();
    const res = await completeRide(rideId, String(driver._id));
    expect(res.status).toBe(409);
    expect(res.body.error).toMatchObject({
      code: 'INVALID_STATE_TRANSITION',
      details: { from: 'requested', to: 'completed' },
    });
  });
  it('cannot complete a ride as a different driver', async () => {
    const { driver, rideId } = await requestedRide();
    const intruder = await createDriver();
    await acceptRide(rideId, String(driver._id));
    const res = await completeRide(rideId, String(intruder._id));
    expect(res.status).toBe(403);
    expect((await Ride.findById(rideId))?.status).toBe('accepted');
  });
  it('cannot complete twice', async () => {
    const { driver, rideId } = await requestedRide();
    await acceptRide(rideId, String(driver._id));
    await completeRide(rideId, String(driver._id));
    const again = await completeRide(rideId, String(driver._id));
    expect(again.status).toBe(409);
    expect(again.body.error.code).toBe('INVALID_STATE_TRANSITION');
  });
  it('cannot accept a completed or cancelled ride', async () => {
    const { rider, driver, rideId } = await requestedRide();
    await cancelRide(rideId, String(rider._id));
    const res = await acceptRide(rideId, String(driver._id));
    expect(res.status).toBe(409);
    expect(res.body.error.details).toEqual({ from: 'cancelled', to: 'accepted' });
  });
});
describe('cancellation', () => {
  it('cancels a requested ride', async () => {
    const { rider, rideId } = await requestedRide();
    const res = await cancelRide(rideId, String(rider._id));
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ status: 'cancelled', cancelledBy: 'rider', cancelReason: 'Changed my mind' });
  });
  it('cancelling an accepted ride releases the driver', async () => {
    const { rider, driver, rideId } = await requestedRide();
    await acceptRide(rideId, String(driver._id));
    await cancelRide(rideId, String(rider._id));
    const freed = await Driver.findById(driver._id);
    expect(freed?.status).toBe('available');
    expect(freed?.currentRide).toBeNull();
  });
  it('cannot cancel a completed ride', async () => {
    const { rider, driver, rideId } = await requestedRide();
    await acceptRide(rideId, String(driver._id));
    await completeRide(rideId, String(driver._id));
    const res = await cancelRide(rideId, String(rider._id));
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('INVALID_STATE_TRANSITION');
  });
  it("cannot cancel someone else's ride", async () => {
    const { rideId } = await requestedRide();
    const stranger = await createRider('Stranger');
    const res = await cancelRide(rideId, String(stranger._id));
    expect(res.status).toBe(403);
    expect((await Ride.findById(rideId))?.status).toBe('requested');
  });
});
describe('driver availability endpoints', () => {
  it('lets an idle driver go offline and back, but not while busy', async () => {
    const { driver, rideId } = await requestedRide();
    const id = String(driver._id);
    expect((await api().patch(`/api/v1/drivers/${id}/availability`).send({ status: 'offline' })).body.data.status).toBe(
      'offline',
    );
    expect(
      (await api().patch(`/api/v1/drivers/${id}/availability`).send({ status: 'available' })).body.data.status,
    ).toBe('available');
    await acceptRide(rideId, id);
    const res = await api().patch(`/api/v1/drivers/${id}/availability`).send({ status: 'offline' });
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('DRIVER_BUSY');
  });
  it('shows open nearby requests as offers, only to available drivers of the right category', async () => {
    const { driver, rideId } = await requestedRide();
    const offers = await api().get(`/api/v1/drivers/${driver._id}/offers`);
    expect(offers.body.data.map((r) => r.id)).toEqual([rideId]);
    const comfort = await createDriver({ category: 'comfort' });
    expect((await api().get(`/api/v1/drivers/${comfort._id}/offers`)).body.data).toEqual([]);
  });
});
