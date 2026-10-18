// Error classes that carry an HTTP status. Services and validators throw them,
// and the central error handler turns them into responses.

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
  }
}

// Named subclasses let services say WHAT went wrong without knowing status codes.
class BadRequestError extends HttpError {
  constructor(message) {
    super(400, message);
  }
}

class UnauthorizedError extends HttpError {
  constructor(message) {
    super(401, message);
  }
}

class ForbiddenError extends HttpError {
  constructor(message) {
    super(403, message);
  }
}

class NotFoundError extends HttpError {
  constructor(message) {
    super(404, message);
  }
}

module.exports = {
  HttpError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
};
