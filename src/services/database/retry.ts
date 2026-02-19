/**
 * Connection Retry Logic with Exponential Backoff
 * 
 * Provides retry functionality for database connections with exponential backoff
 */

import log from '../logger/index.js';

export interface RetryOptions {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  retryableErrors?: string[];
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxRetries: 5,
  initialDelay: 1000, // 1 second
  maxDelay: 30000, // 30 seconds
  backoffMultiplier: 2,
  retryableErrors: ['ECONNREFUSED', 'ETIMEDOUT', 'ENOTFOUND', 'ECONNRESET']
};

/**
 * Calculate delay for exponential backoff
 */
function calculateDelay(attempt: number, options: Required<RetryOptions>): number {
  const delay = options.initialDelay * Math.pow(options.backoffMultiplier, attempt);
  return Math.min(delay, options.maxDelay);
}

/**
 * Check if error is retryable
 */
function isRetryableError(error: any, options: Required<RetryOptions>): boolean {
  if (!error) return false;
  
  const errorMessage = error.message || '';
  const errorCode = error.code || '';
  const errorString = (errorMessage + ' ' + errorCode).toUpperCase();
  
  return options.retryableErrors.some(retryableError => 
    errorString.includes(retryableError.toUpperCase())
  );
}

/**
 * Retry a function with exponential backoff
 * 
 * @param fn Function to retry (should return a Promise)
 * @param options Retry options
 * @returns Promise that resolves with the function result or rejects after max retries
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts: Required<RetryOptions> = {
    ...DEFAULT_OPTIONS,
    ...options
  };

  let lastError: any;
  
  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      
      // If this is the last attempt, throw the error
      if (attempt === opts.maxRetries) {
        log.error(`Retry failed after ${opts.maxRetries} attempts:`, error);
        throw error;
      }
      
      // Check if error is retryable
      if (!isRetryableError(error, opts)) {
        log.warn('Error is not retryable:', error.message);
        throw error;
      }
      
      // Calculate delay with exponential backoff
      const delay = calculateDelay(attempt, opts);
      
      log.warn(
        `Connection attempt ${attempt + 1} failed, retrying in ${delay}ms...`,
        error.message
      );
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  // This should never be reached, but TypeScript needs it
  throw lastError;
}

/**
 * Retry with exponential backoff and custom error handler
 */
export async function retryWithBackoffAndHandler<T>(
  fn: () => Promise<T>,
  onRetry: (attempt: number, error: any, delay: number) => void,
  options: RetryOptions = {}
): Promise<T> {
  const opts: Required<RetryOptions> = {
    ...DEFAULT_OPTIONS,
    ...options
  };

  let lastError: any;
  
  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      
      if (attempt === opts.maxRetries) {
        log.error(`Retry failed after ${opts.maxRetries} attempts:`, error);
        throw error;
      }
      
      if (!isRetryableError(error, opts)) {
        log.warn('Error is not retryable:', error.message);
        throw error;
      }
      
      const delay = calculateDelay(attempt, opts);
      onRetry(attempt + 1, error, delay);
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
}

export default retryWithBackoff;
