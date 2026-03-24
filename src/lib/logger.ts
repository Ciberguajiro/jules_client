/**
 * Structured logging utilities
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
  error?: Error;
  userId?: string;
  sessionId?: string;
}

/**
 * Structured logging system with performance metrics and environment-aware output
 * 
 * @class Logger
 * @description Comprehensive logging utility with different log levels, performance tracking, and structured output
 * 
 * @example
 * ```typescript
 * logger.info('User logged in', { userId: '123' });
 * logger.performance('API call', duration);
 * logger.error('Request failed', error, { endpoint: '/sessions' });
 * ```
 */
export class Logger {
  private static instance: Logger;
  private logs: LogEntry[] = [];
  private maxLogs = 1000;
  private currentLogLevel: LogLevel = LogLevel.INFO;
  private isDevelopment = import.meta.env.DEV;

  private constructor() {
    this.currentLogLevel = this.getLogLevelFromEnv();
  }

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private getLogLevelFromEnv(): LogLevel {
    const envLevel = import.meta.env.VITE_LOG_LEVEL || 'info';
    switch (envLevel.toLowerCase()) {
      case 'debug': return LogLevel.DEBUG;
      case 'info': return LogLevel.INFO;
      case 'warn': return LogLevel.WARN;
      case 'error': return LogLevel.ERROR;
      default: return LogLevel.INFO;
    }
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.currentLogLevel;
  }

  private formatMessage(entry: LogEntry): string {
    const levelStr = LogLevel[entry.level].padEnd(5);
    const contextStr = entry.context ? ` ${JSON.stringify(entry.context)}` : '';
    const errorStr = entry.error ? ` Error: ${entry.error.message}` : '';
    const sessionStr = entry.sessionId ? ` [Session: ${entry.sessionId}]` : '';
    
    return `[${entry.timestamp}] ${levelStr}${sessionStr} ${entry.message}${contextStr}${errorStr}`;
  }

  private log(level: LogLevel, message: string, context?: Record<string, any>, error?: Error): void {
    if (!this.shouldLog(level)) {
      return;
    }

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      error,
    };

    this.addLog(entry);
    this.outputLog(entry);
  }

  private addLog(entry: LogEntry): void {
    this.logs.push(entry);
    
    // Keep only the last maxLogs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }
  }

  private outputLog(entry: LogEntry): void {
    const formattedMessage = this.formatMessage(entry);
    
    if (this.isDevelopment) {
      // In development, use console methods for better formatting
      switch (entry.level) {
        case LogLevel.DEBUG:
          console.debug(formattedMessage, entry.context);
          break;
        case LogLevel.INFO:
          console.info(formattedMessage, entry.context);
          break;
        case LogLevel.WARN:
          console.warn(formattedMessage, entry.context);
          break;
        case LogLevel.ERROR:
          console.error(formattedMessage, entry.context, entry.error);
          break;
      }
    } else {
      // In production, you might want to send to external logging service
      console.log(formattedMessage);
    }
  }

  // Public logging methods
  debug(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  info(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.INFO, message, context);
  }

  warn(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.WARN, message, context);
  }

  error(message: string, error?: Error, context?: Record<string, any>): void {
    this.log(LogLevel.ERROR, message, context, error);
  }

  // Specialized logging methods
  userAction(action: string, context?: Record<string, any>): void {
    this.info(`User action: ${action}`, { ...context, type: 'user_action' });
  }

  apiCall(method: string, url: string, context?: Record<string, any>): void {
    this.debug(`API call: ${method} ${url}`, { ...context, type: 'api_call' });
  }

  apiResponse(method: string, url: string, status: number, duration: number): void {
    this.debug(`API response: ${method} ${url} - ${status} (${duration}ms)`, {
      type: 'api_response',
      status,
      duration
    });
  }

  sessionEvent(event: string, sessionId: string, context?: Record<string, any>): void {
    this.info(`Session event: ${event}`, { 
      ...context, 
      type: 'session_event',
      sessionId 
    });
  }

  performance(operation: string, duration: number, context?: Record<string, any>): void {
    this.debug(`Performance: ${operation} took ${duration}ms`, {
      ...context,
      type: 'performance',
      duration
    });
  }

  // Log management
  getLogs(level?: LogLevel, limit?: number): LogEntry[] {
    let filteredLogs = this.logs;
    
    if (level !== undefined) {
      filteredLogs = filteredLogs.filter(log => log.level >= level);
    }
    
    if (limit) {
      filteredLogs = filteredLogs.slice(-limit);
    }
    
    return [...filteredLogs];
  }

  clearLogs(): void {
    this.logs = [];
  }

  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  setLogLevel(level: LogLevel): void {
    this.currentLogLevel = level;
  }

  getLogLevel(): LogLevel {
    return this.currentLogLevel;
  }
}

// Export singleton instance
export const logger = Logger.getInstance();

// Export convenience functions
export const log = {
  debug: (message: string, context?: Record<string, any>) => logger.debug(message, context),
  info: (message: string, context?: Record<string, any>) => logger.info(message, context),
  warn: (message: string, context?: Record<string, any>) => logger.warn(message, context),
  error: (message: string, error?: Error, context?: Record<string, any>) => logger.error(message, error, context),
  userAction: (action: string, context?: Record<string, any>) => logger.userAction(action, context),
  apiCall: (method: string, url: string, context?: Record<string, any>) => logger.apiCall(method, url, context),
  apiResponse: (method: string, url: string, status: number, duration: number) => logger.apiResponse(method, url, status, duration),
  sessionEvent: (event: string, sessionId: string, context?: Record<string, any>) => logger.sessionEvent(event, sessionId, context),
  performance: (operation: string, duration: number, context?: Record<string, any>) => logger.performance(operation, duration, context),
};
