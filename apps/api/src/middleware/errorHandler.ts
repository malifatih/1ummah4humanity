import type { Request, Response, NextFunction } from 'express';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public override message: string,
    public details?: Record<string, string[]>
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function errorHandler(err: Error & { statusCode?: number; status?: number; type?: string }, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: err.name,
      message: err.message,
      statusCode: err.statusCode,
      ...(err.details && { details: err.details }),
    });
    return;
  }

  // Handle body-parser / JSON parse errors
  if (err instanceof SyntaxError && err.type === 'entity.parse.failed') {
    res.status(400).json({
      error: 'BadRequest',
      message: 'Invalid JSON in request body',
      statusCode: 400,
    });
    return;
  }

  // Handle other HTTP errors from middleware (e.g., payload too large)
  if (err.statusCode && err.statusCode >= 400 && err.statusCode < 500) {
    res.status(err.statusCode).json({
      error: 'BadRequest',
      message: err.message || 'Bad request',
      statusCode: err.statusCode,
    });
    return;
  }

  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'InternalServerError',
    message: 'An unexpected error occurred',
    statusCode: 500,
  });
}

export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json({
    error: 'NotFound',
    message: 'The requested resource was not found',
    statusCode: 404,
  });
}
