/** An expected error with an HTTP status and a message that is safe to show to users. */
export class AppError extends Error {
  constructor(status, code, message, fieldErrors) {
    super(message);
    this.status = status;
    this.code = code;
    this.fieldErrors = fieldErrors;
  }

  static notFound(resource) {
    return new AppError(404, 'NOT_FOUND', `${resource} not found`);
  }

  static conflict(code, message, fieldErrors) {
    return new AppError(409, code, message, fieldErrors);
  }
}
