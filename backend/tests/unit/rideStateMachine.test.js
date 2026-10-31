import { RIDE_STATUSES, canTransition, isTerminal, statusesAllowing } from '../../src/domain/rideStateMachine.js';
describe('ride state machine', () => {
  it('allows the happy path and cancellation', () => {
    expect(canTransition('requested', 'accepted')).toBe(true);
    expect(canTransition('accepted', 'completed')).toBe(true);
    expect(canTransition('requested', 'cancelled')).toBe(true);
    expect(canTransition('accepted', 'cancelled')).toBe(true);
  });
  it('rejects skipping states and moving backwards', () => {
    expect(canTransition('requested', 'completed')).toBe(false);
    expect(canTransition('accepted', 'requested')).toBe(false);
    expect(canTransition('completed', 'cancelled')).toBe(false);
  });
  it('treats completed and cancelled as terminal', () => {
    for (const s of RIDE_STATUSES) expect(isTerminal(s)).toBe(s === 'completed' || s === 'cancelled');
  });
  it('derives the allowed source states for a target', () => {
    expect(statusesAllowing('accepted')).toEqual(['requested']);
    expect(statusesAllowing('cancelled').sort()).toEqual(['accepted', 'requested']);
  });
});
