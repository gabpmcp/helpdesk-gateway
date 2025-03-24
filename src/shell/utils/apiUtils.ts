import { ZohoApiError } from '../../errors/zohoErrors';

interface RetryConfig {
  maxRetries: number;
  delayMs: number;
  backoffFactor: number;
}

const defaultRetryConfig: RetryConfig = {
  maxRetries: 3,
  delayMs: 1000,
  backoffFactor: 2
};

// Pure function to create delay
const createDelay = (ms: number): Promise<void> =>
  new Promise(resolve => setTimeout(resolve, ms));

// Pure function to determine if error is retryable
const isRetryableError = (error: unknown): boolean => {
  if (error instanceof ZohoApiError) {
    return error.status ? error.status >= 500 : true;
  }
  return true;
};

// Curried function for retry logic
export const withRetry = async <T>(
  operation: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<T> => {
  const finalConfig = { ...defaultRetryConfig, ...config };
  let lastError: Error | null = null;
  
  // Use recursion with Promise chaining for retry attempts
  const attemptOperation = (attempt: number, delay: number): Promise<T> => {
    return operation().catch(error => {
      lastError = error as Error;
      
      if (!isRetryableError(error) || attempt >= finalConfig.maxRetries) {
        return Promise.reject(error);
      }
      
      const nextDelay = delay * finalConfig.backoffFactor;
      
      return createDelay(delay)
        .then(() => attemptOperation(attempt + 1, nextDelay));
    });
  };
  
  return attemptOperation(0, finalConfig.delayMs);
};

// Curried function for rate limiting
export const rateLimit = <T>(
  operation: () => Promise<T>,
  limitMs: number = 1000
): Promise<T> => {
  const now = Date.now();
  const timeSinceLastCall = now - rateLimit.lastCall;
  const waitTime = Math.max(0, limitMs - timeSinceLastCall);
  
  return createDelay(waitTime)
    .then(() => {
      rateLimit.lastCall = Date.now();
      return operation();
    });
};

// Static property to track last call time
rateLimit.lastCall = 0;
