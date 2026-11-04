export class AppError extends Error {
  statusCode: number;
  isOperational = true;
  errors?: unknown[];
  code?: string;

  constructor(message: string, statusCode = 400, errors?: unknown[], code?: string) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.code = code;
  }

  static badRequest(msg = 'Bad request', errors?: unknown[]) { return new AppError(msg, 400, errors); }
  static unauthorized(msg = 'Authentication required') { return new AppError(msg, 401); }
  static forbidden(msg = 'You do not have permission to perform this action') { return new AppError(msg, 403); }
  static notFound(msg = 'Resource not found') { return new AppError(msg, 404); }
  static conflict(msg = 'Resource already exists') { return new AppError(msg, 409); }
}
