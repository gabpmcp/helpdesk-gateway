// Error types for Zoho API integration
export class ZohoError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly status?: number,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = 'ZohoError';
  }
}

export class ZohoAuthenticationError extends ZohoError {
  constructor(message: string, details?: unknown) {
    super(message, 'ZOHO_AUTH_ERROR', 401, details);
    this.name = 'ZohoAuthenticationError';
  }
}

export class ZohoApiError extends ZohoError {
  constructor(message: string, status: number, details?: unknown) {
    super(message, 'ZOHO_API_ERROR', status, details);
    this.name = 'ZohoApiError';
  }
}

// Pure function to create error message from API response
const createErrorMessage = (error: any): string => {
  if (typeof error === 'string') return error;
  
  if (error?.message) return error.message;
  
  if (error?.error?.message) return error.error.message;
  
  return 'Unknown Zoho API error';
};

// Pure function to extract status code from API response
const extractStatusCode = (error: any): number => {
  if (error?.status) return error.status;
  
  if (error?.error?.status) return error.error.status;
  
  return 500;
};

// Pure function to normalize error to ZohoError type
export const normalizeZohoError = (error: unknown): ZohoError => {
  if (error instanceof ZohoError) {
    return error;
  }

  const message = createErrorMessage(error);
  const status = extractStatusCode(error);
  
  // Authentication errors
  if (status === 401 || status === 403) {
    return new ZohoAuthenticationError(message, error);
  }
  
  // API errors
  return new ZohoApiError(message, status, error);
};
