/**
 * Debug utilities for development
 */

export class DebugUtils {
  /**
   * Enhanced HTTP response debugging
   */
  static async debugResponse(response: Response, operation: string): Promise<void> {
    if (!import.meta.env.DEV) return;

    console.group(`🔍 HTTP Response Debug [${operation}]`);
    
    try {
      // Log basic response info
      console.log('URL:', response.url);
      console.log('Status:', response.status);
      console.log('Status Text:', response.statusText);
      console.log('Headers:', Object.fromEntries(response.headers.entries()));
      
      // Try to get response body for debugging
      const responseText = await response.text();
      
      console.log('Response Body Length:', responseText.length);
      
      if (responseText.length === 0) {
        console.warn('⚠️ Empty response body detected');
        console.warn('This could cause "error decoding response body"');
        console.warn('Check if the server is returning empty responses for this operation');
      } else if (responseText.trim().startsWith('<')) {
        console.warn('⚠️ HTML response detected instead of JSON');
        console.warn('Server may be returning an error page instead of API response');
        console.log('Response preview:', responseText.substring(0, 200) + '...');
      } else if (responseText.trim().startsWith('{') || responseText.trim().startsWith('[')) {
        console.log('✅ Valid JSON structure detected');
        try {
          const jsonData = JSON.parse(responseText);
          console.log('Parsed JSON:', jsonData);
        } catch (e) {
          console.error('❌ JSON parsing failed despite valid structure');
          console.error('Parse error:', e);
          console.log('Raw response:', responseText);
        }
      } else {
        console.warn('⚠️ Non-JSON response detected');
        console.log('Response preview:', responseText.substring(0, 200) + '...');
        console.warn('This could indicate:');
        console.warn('  - Server error (text/plain error message)');
        console.warn('  - API endpoint changed');
        console.warn('  - Authentication issues');
        console.warn('  - CORS problems');
      }
      
      // Specific debugging for common status codes
      if (response.status === 401) {
        console.error('🔐 Authentication failed - Check API key');
      } else if (response.status === 403) {
        console.error('🚫 Authorization failed - Check permissions');
      } else if (response.status === 404) {
        console.error('🔍 Not found - Check API endpoint URL');
      } else if (response.status >= 500) {
        console.error('🔥 Server error - Check server status');
      }
      
    } catch (error) {
      console.error('Error during debugging:', error);
    }
    
    console.groupEnd();
  }

  /**
   * Debug API call before sending
   */
  static debugRequest(url: string, method: string, headers?: Record<string, string>, body?: any): void {
    if (!import.meta.env.DEV) return;

    console.group(`🚀 HTTP Request Debug [${method} ${url}]`);
    console.log('URL:', url);
    console.log('Method:', method);
    console.log('Headers:', headers);
    
    if (body) {
      console.log('Body:', body);
    }
    
    console.groupEnd();
  }

  /**
   * Debug network errors
   */
  static debugNetworkError(error: Error, operation: string): void {
    if (!import.meta.env.DEV) return;

    console.group(`🌐 Network Error Debug [${operation}]`);
    console.error('Error:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    
    if (error instanceof TypeError) {
      console.warn('🔍 TypeError detected - Common causes:');
      console.warn('  - Network connectivity issues');
      console.warn('  - CORS policy violations');
      console.warn('  - Invalid URL format');
      console.warn('  - Server not responding');
    }
    
    console.groupEnd();
  }

  /**
   * Log performance metrics
   */
  static logPerformance(operation: string, startTime: number, endTime: number): void {
    if (!import.meta.env.DEV) return;

    const duration = endTime - startTime;
    console.log(`⏱️ Performance [${operation}]: ${duration.toFixed(2)}ms`);
    
    if (duration > 5000) {
      console.warn(`⚠️ Slow operation detected: ${operation} took ${duration.toFixed(2)}ms`);
    }
  }

  /**
   * Debug API key issues
   */
  static debugApiKey(apiKey: string | undefined): void {
    if (!import.meta.env.DEV) return;

    console.group('🔑 API Key Debug');
    
    if (!apiKey) {
      console.error('❌ No API key provided');
      console.error('Please set API key in settings');
    } else if (apiKey.length < 10) {
      console.warn('⚠️ API key seems too short');
      console.warn('Expected length: typically 30+ characters');
    } else {
      console.log('✅ API key present');
      console.log('Key length:', apiKey.length);
      console.log('Key format:', apiKey.substring(0, 8) + '...');
    }
    
    console.groupEnd();
  }
}

/**
 * Enhanced fetch wrapper for debugging
 */
export async function debugFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const startTime = performance.now();
  const operation = `${options.method || 'GET'} ${url}`;
  
  DebugUtils.debugRequest(url, options.method || 'GET', options.headers as Record<string, string>, options.body);
  
  try {
    const response = await fetch(url, options);
    const endTime = performance.now();
    
    DebugUtils.logPerformance(operation, startTime, endTime);
    await DebugUtils.debugResponse(response, operation);
    
    return response;
  } catch (error) {
    const endTime = performance.now();
    DebugUtils.logPerformance(operation, startTime, endTime);
    DebugUtils.debugNetworkError(error as Error, operation);
    throw error;
  }
}
