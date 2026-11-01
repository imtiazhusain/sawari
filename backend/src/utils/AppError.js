/** Operational error with an HTTP status and a stable machine-readable code. */
export class AppError extends Error {
  status;
  code;
  details;
  constructor(status, code, message, details) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
    this.name = 'AppError';
  }
}

export const errors = {
  notFound: (what) => {
    return new AppError(404, 'NOT_FOUND', `${what} not found`);
  },
  forbidden: (message) => {
    return new AppError(403, 'FORBIDDEN', message);
  },
  conflict: (code, message, details) => {
    return new AppError(409, code, message, details);
  },
  invalidTransition: (from, to) => {
    return new AppError(
      409,
      'INVALID_STATE_TRANSITION',
      `A ride that is '${from}' cannot become '${to}'`,
      { from, to }
    );
  },
};
