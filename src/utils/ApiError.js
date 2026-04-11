export class ApiError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    this.success = false;
    
    // Captures the stack trace (useful for debugging)
    Error.captureStackTrace(this, this.constructor);
  }
}
