/** Parses and replaces req.body / req.params. Any ZodError is turned into a 400 by the error handler. */
export const validate = (schemas) => (req, _res, next) => {
  try {
    if (schemas.body) req.body = schemas.body.parse(req.body);
    if (schemas.params) req.params = schemas.params.parse(req.params);
    next();
  } catch (err) {
    next(err);
  }
};
