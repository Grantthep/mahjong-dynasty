/** An error that is safe to show to the client. Anything else becomes a generic 500. */
export class AppError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const Errors = {
  unauthorized: (message = 'Authentication required') => new AppError(401, 'UNAUTHORIZED', message),
  forbidden: (message = 'Forbidden') => new AppError(403, 'FORBIDDEN', message),
  notFound: (message = 'Not found') => new AppError(404, 'NOT_FOUND', message),
  conflict: (code: string, message: string) => new AppError(409, code, message),
  badRequest: (code: string, message: string, details?: unknown) =>
    new AppError(400, code, message, details),
  insufficientBalance: () =>
    new AppError(400, 'INSUFFICIENT_BALANCE', 'Not enough DEMO CREDITS for this bet'),
  spinInProgress: () =>
    new AppError(409, 'SPIN_IN_PROGRESS', 'A spin is already in progress. Please wait.'),
};
