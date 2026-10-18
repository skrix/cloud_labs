// Errors with an HTTP status, turned into responses by the central error handler.

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
  }
}

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
