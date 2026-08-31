// Express 4 doesn't catch rejected promises from async route handlers on its
// own — wrapping each handler forwards any thrown/rejected error to next()
// so the central errorHandler middleware can turn it into a JSON response.
export function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}
