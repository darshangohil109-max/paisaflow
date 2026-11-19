import type { NextFunction, Request, RequestHandler, Response } from 'express';

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;

  constructor(message: string, statusCode = 500, code = 'INTERNAL_ERROR') {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
  }
}

export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>
): RequestHandler {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

export function apiNotFoundHandler(req: Request, _res: Response, next: NextFunction): void {
  next(new AppError(`API route not found: ${req.method} ${req.originalUrl}`, 404, 'ROUTE_NOT_FOUND'));
}

export function globalErrorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: err.message,
      code: err.code,
    });
    return;
  }

  // Handle invalid JSON syntax errors from express.json()
  if (err instanceof SyntaxError && 'status' in err && (err as { status?: number }).status === 400) {
    res.status(400).json({
      error: 'Malformed JSON request payload.',
      code: 'INVALID_JSON',
    });
    return;
  }

  console.error('[PaisaFlow Server Error]', err);
  const message =
    err instanceof Error ? err.message : 'An unexpected server error occurred.';

  res.status(500).json({
    error: message,
    code: 'INTERNAL_SERVER_ERROR',
  });
}
