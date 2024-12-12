// Custom API Error class
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code: string = 'INTERNAL_SERVER_ERROR'
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Handle and log service errors
export const handleServiceError = (error: unknown, service: string): never => {
  console.error(`${service} error:`, error);

  if (error instanceof ApiError) {
    throw error;
  }

  throw new ApiError(
    error instanceof Error ? error.message : 'An unexpected error occurred',
    500
  );
};
