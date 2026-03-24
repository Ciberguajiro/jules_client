/**
 * Environment configuration and constants
 * These values are injected at build time from Vite configuration
 */

// Environment variables injected by Vite
declare const __APP_ENV__: string;
declare const __JULES_API_URL__: string;
declare const __CSP_ENABLED__: boolean;
declare const __LOG_LEVEL__: string;
declare const __CACHE_TTL__: number;
declare const __MAX_CACHE_SIZE__: number;

export interface EnvConfig {
  appEnv: string;
  julesApiUrl: string;
  cspEnabled: boolean;
  logLevel: string;
  cacheTtl: number;
  maxCacheSize: number;
}

/**
 * Get environment configuration
 */
export function getEnvConfig(): EnvConfig {
  return {
    appEnv: typeof __APP_ENV__ !== 'undefined' ? __APP_ENV__ : 'development',
    julesApiUrl: typeof __JULES_API_URL__ !== 'undefined' ? __JULES_API_URL__ : 'https://jules.googleapis.com',
    cspEnabled: typeof __CSP_ENABLED__ !== 'undefined' ? __CSP_ENABLED__ : true,
    logLevel: typeof __LOG_LEVEL__ !== 'undefined' ? __LOG_LEVEL__ : 'info',
    cacheTtl: typeof __CACHE_TTL__ !== 'undefined' ? __CACHE_TTL__ : 60,
    maxCacheSize: typeof __MAX_CACHE_SIZE__ !== 'undefined' ? __MAX_CACHE_SIZE__ : 50,
  };
}

/**
 * Check if running in production mode
 */
export function isProduction(): boolean {
  return getEnvConfig().appEnv === 'production';
}

/**
 * Check if running in development mode
 */
export function isDevelopment(): boolean {
  return getEnvConfig().appEnv === 'development';
}

/**
 * Get API base URL
 */
export function getApiBaseUrl(): string {
  return getEnvConfig().julesApiUrl;
}

/**
 * Get cache TTL in seconds
 */
export function getCacheTtl(): number {
  return getEnvConfig().cacheTtl;
}

/**
 * Get maximum cache size
 */
export function getMaxCacheSize(): number {
  return getEnvConfig().maxCacheSize;
}

/**
 * Get log level
 */
export function getLogLevel(): string {
  return getEnvConfig().logLevel;
}

/**
 * Check if CSP is enabled
 */
export function isCspEnabled(): boolean {
  return getEnvConfig().cspEnabled;
}
