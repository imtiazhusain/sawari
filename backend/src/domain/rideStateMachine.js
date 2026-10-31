export const RIDE_STATUSES = ['requested', 'accepted', 'completed', 'cancelled'];
/** Single source of truth for legal ride lifecycle transitions. */
const TRANSITIONS = {
  requested: ['accepted', 'cancelled'],
  accepted: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
};
export const canTransition = (from, to) => TRANSITIONS[from].includes(to);
/** Statuses a ride may currently be in for `to` to be a legal next step. Used to build atomic DB filters. */
export const statusesAllowing = (to) => RIDE_STATUSES.filter((from) => canTransition(from, to));
export const isTerminal = (status) => TRANSITIONS[status].length === 0;
