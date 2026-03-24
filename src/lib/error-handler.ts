/**
 * Centralized error handling utilities
 */

export enum ErrorType {
  NETWORK = 'network',
  VALIDATION = 'validation',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  NOT_FOUND = 'not_found',
  SERVER_ERROR = 'server_error',
  UNKNOWN = 'unknown'
}

export interface AppError {
  type: ErrorType;
  message: string;
  originalError?: any;
  timestamp: Date;
  context?: Record<string, any>;
}

/**
 * Handles and categorizes errors for better debugging and user experience
 * 
 * @class ErrorHandler
 * @description Centralized error management system with categorization, retry mechanisms, and structured logging
 * 
 * @example
 * ```typescript
 * try {
 *   await riskyOperation();
 * } catch (error) {
 *   const appError = ErrorHandler.handle(error, { userId: '123' });
 *   console.log(appError.message);
 * }
 * ```
 */
export class ErrorHandler {
  private static errors: AppError[] = [];
  private static maxErrors = 100;

  /**
   * Handle and categorize errors
   */
  static handle(error: any, context?: Record<string, any>): AppError {
    const appError: AppError = {
      type: this.categorizeError(error),
      message: this.getErrorMessage(error),
      originalError: error,
      timestamp: new Date(),
      context
    };

    this.logError(appError);
    this.storeError(appError);
    return appError;
  }

  /**
   * Categorize error based on its properties
   */
  private static categorizeError(error: any): ErrorType {
    if (!error) return ErrorType.UNKNOWN;

    // Network errors
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      return ErrorType.NETWORK;
    }
    
    if (error.code === 'NETWORK_ERROR' || error.code === 'ECONNREFUSED') {
      return ErrorType.NETWORK;
    }

    // HTTP status errors
    if (error.status || error.response?.status) {
      const status = error.status || error.response?.status;
      
      if (status === 401) return ErrorType.AUTHENTICATION;
      if (status === 403) return ErrorType.AUTHORIZATION;
      if (status === 404) return ErrorType.NOT_FOUND;
      if (status >= 500) return ErrorType.SERVER_ERROR;
    }

    // Validation errors
    if (error.message?.includes('validation') || 
        error.message?.includes('required') ||
        error.message?.includes('invalid')) {
      return ErrorType.VALIDATION;
    }

    return ErrorType.UNKNOWN;
  }

  /**
   * Extract user-friendly error message
   */
  private static getErrorMessage(error: any): string {
    // If error already has a user-friendly message
    if (error.message && typeof error.message === 'string' && !error.message.includes('Error:')) {
      return error.message;
    }

    // Handle different error types
    const errorType = this.categorizeError(error);
    
    switch (errorType) {
      case ErrorType.NETWORK:
        return 'Network connection failed. Please check your internet connection and try again.';
      
      case ErrorType.AUTHENTICATION:
        return 'Authentication failed. Please check your API key and try again.';
      
      case ErrorType.AUTHORIZATION:
        return 'You don\'t have permission to perform this action.';
      
      case ErrorType.NOT_FOUND:
        return 'The requested resource was not found.';
      
      case ErrorType.SERVER_ERROR:
        return 'Server error occurred. Please try again later.';
      
      case ErrorType.VALIDATION:
        return error.message || 'Invalid input provided.';
      
      default:
        return 'An unexpected error occurred. Please try again.';
    }
  }

  /**
   * Log error to console (in development) or external service (in production)
   */
  private static logError(error: AppError): void {
    const logData = {
      type: error.type,
      message: error.message,
      timestamp: error.timestamp.toISOString(),
      context: error.context,
      stack: error.originalError?.stack,
      originalError: error.originalError
    };

    if (import.meta.env.DEV) {
      console.group(`🚨 App Error [${error.type}]`);
      console.error('Error Details:', logData);
      
      // Enhanced debugging for response body errors
      if (error.message.includes('decode') || error.message.includes('JSON')) {
        console.warn('🔍 This appears to be a response body decoding error');
        console.warn('Common causes:');
        console.warn('  1. Server returned non-JSON response');
        console.warn('  2. Server returned empty response');
        console.warn('  3. Server returned invalid JSON');
        console.warn('  4. Network corruption during transfer');
        console.warn('  5. Server error (500, 404, etc.) with non-JSON body');
        
        if (error.originalError) {
          console.warn('Original error:', error.originalError);
        }
        
        if (error.context) {
          console.warn('Request context:', error.context);
        }
      }
      
      console.groupEnd();
    } else {
      // In production, you might want to send this to a logging service
      console.warn('Error logged:', error.type, error.message);
    }
  }

  /**
   * Store error in memory for debugging
   */
  private static storeError(error: AppError): void {
    this.errors.push(error);
    
    // Keep only the last maxErrors
    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(-this.maxErrors);
    }
  }

  /**
   * Get all stored errors
   */
  static getErrors(): AppError[] {
    return [...this.errors];
  }

  /**
   * Clear stored errors
   */
  static clearErrors(): void {
    this.errors = [];
  }

  /**
   * Get user-friendly message for display
   */
  static getUserMessage(error: AppError): string {
    return error.message;
  }

  /**
   * Check if error is recoverable
   */
  static isRecoverable(error: AppError): boolean {
    return [
      ErrorType.NETWORK,
      ErrorType.SERVER_ERROR,
      ErrorType.UNKNOWN
    ].includes(error.type);
  }

  /**
   * Create a retry strategy for recoverable errors
   */
  static async retry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 1000
  ): Promise<T> {
    let lastError: AppError;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = this.handle(error, { attempt, maxRetries });
        
        if (!this.isRecoverable(lastError) || attempt === maxRetries) {
          throw lastError;
        }

        // Exponential backoff
        const waitTime = delay * Math.pow(2, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }

    throw lastError!;
  }
}

/**
 * HOC for handling async errors in components
 */
export function withErrorHandling<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  onError?: (error: AppError) => void
) {
  return async (...args: T): Promise<R | null> => {
    try {
      return await fn(...args);
    } catch (error) {
      const appError = ErrorHandler.handle(error);
      if (onError) {
        onError(appError);
      }
      return null;
    }
  };
}

/**
 * React-style error boundary for Svelte
 */
export function createErrorBoundary() {
  return {
    error: null as AppError | null,
    
    capture(error: any, context?: Record<string, any>) {
      this.error = ErrorHandler.handle(error, context);
    },
    
    clear() {
      this.error = null;
    },
    
    get message() {
      return this.error?.message || 'An error occurred';
    },
    
    get isRecoverable() {
      return this.error ? ErrorHandler.isRecoverable(this.error) : false;
    }
  };
}
