/**
 * Input validation and sanitization utilities
 */

/**
 * Sanitizes a string by removing potentially dangerous characters
 */
export function sanitizeString(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .replace(/[\x00-\x1F\x7F]/g, ''); // Remove control characters
}

/**
 * Validates and sanitizes session titles for security and consistency
 * 
 * @param {string} title - The session title to validate
 * @returns {ValidationResult} Validation result with sanitized value and error status
 * 
 * @example
 * ```typescript
 * const result = validateSessionTitle("My Coding Session");
 * if (result.valid) {
 *   console.log("Valid title:", result.sanitized);
 * } else {
 *   console.error("Invalid title:", result.error);
 * }
 * ```
 */
export function validateSessionTitle(title: string): { valid: boolean; sanitized?: string; error?: string } {
  if (!title || title.trim().length === 0) {
    return { valid: true }; // Title is optional
  }

  const sanitized = sanitizeString(title);
  
  if (sanitized.length > 100) {
    return { valid: false, error: 'Session title must be less than 100 characters' };
  }

  if (sanitized.length === 0) {
    return { valid: false, error: 'Session title contains only invalid characters' };
  }

  return { valid: true, sanitized };
}

/**
 * Validates and sanitizes session prompts for security and length limits
 * 
 * @param {string} prompt - The session prompt to validate
 * @returns {ValidationResult} Validation result with sanitized value and error status
 * 
 * @example
 * ```typescript
 * const result = validateSessionPrompt("Create a login form with validation");
 * if (result.valid) {
 *   console.log("Valid prompt:", result.sanitized);
 * } else {
 *   console.error("Invalid prompt:", result.error);
 * }
 * ```
 */
export function validateSessionPrompt(prompt: string): { valid: boolean; sanitized?: string; error?: string } {
  if (!prompt || prompt.trim().length === 0) {
    return { valid: false, error: 'Prompt is required' };
  }

  const sanitized = sanitizeString(prompt);
  
  if (sanitized.length < 10) {
    return { valid: false, error: 'Prompt must be at least 10 characters long' };
  }

  if (sanitized.length > 10000) {
    return { valid: false, error: 'Prompt must be less than 10,000 characters' };
  }

  return { valid: true, sanitized };
}

/**
 * Validates and sanitizes a repository name for security and format
 * 
 * @deprecated This function is not currently used in the application but kept for future reference
 * @example
 * ```typescript
 * const result = validateRepositoryName("owner/repo");
 * if (result.valid) {
 *   console.log("Valid repository format");
 * } else {
 *   console.error("Invalid repository format:", result.error);
 * }
 * ```
 */
export function validateRepositoryName(repoName: string): { valid: boolean; sanitized?: string; error?: string } {
  if (!repoName || repoName.trim().length === 0) {
    return { valid: false, error: 'Repository name is required' };
  }

  const sanitized = sanitizeString(repoName);
  
  // Basic repository name validation (owner/repo format)
  const repoRegex = /^[a-zA-Z0-9_.-]+\/[a-zA-Z0-9_.-]+$/;
  if (!repoRegex.test(sanitized)) {
    return { valid: false, error: 'Invalid repository format. Expected: owner/repository' };
  }

  return { valid: true, sanitized };
}

/**
 * Validates and sanitizes a branch name
 */
export function validateBranchName(branchName: string): { valid: boolean; sanitized?: string; error?: string } {
  if (!branchName || branchName.trim().length === 0) {
    return { valid: true, sanitized: 'main' }; // Default to main
  }

  const sanitized = sanitizeString(branchName);
  
  // Git branch name validation
  const branchRegex = /^[a-zA-Z0-9._-]+$/;
  if (!branchRegex.test(sanitized)) {
    return { valid: false, error: 'Invalid branch name. Only alphanumeric characters, dots, hyphens, and underscores are allowed' };
  }

  if (sanitized.length > 255) {
    return { valid: false, error: 'Branch name must be less than 255 characters' };
  }

  return { valid: true, sanitized };
}

/**
 * Validates and sanitizes a session ID
 */
export function validateSessionId(sessionId: string): { valid: boolean; sanitized?: string; error?: string } {
  if (!sessionId || sessionId.trim().length === 0) {
    return { valid: false, error: 'Session ID is required' };
  }

  const sanitized = sanitizeString(sessionId);
  
  // Basic session ID validation (alphanumeric with some special characters)
  const sessionIdRegex = /^[a-zA-Z0-9_-]+$/;
  if (!sessionIdRegex.test(sanitized)) {
    return { valid: false, error: 'Invalid session ID format' };
  }

  return { valid: true, sanitized };
}

/**
 * Validates and sanitizes search/filter text
 */
export function validateSearchText(searchText: string): { valid: boolean; sanitized?: string; error?: string } {
  const sanitized = sanitizeString(searchText);
  
  if (sanitized.length > 100) {
    return { valid: false, error: 'Search text must be less than 100 characters' };
  }

  return { valid: true, sanitized };
}

/**
 * Validates API key format (basic validation)
 * 
 * @deprecated This function is not currently used in the application but kept for future reference
 */
export function validateApiKey(apiKey: string): { valid: boolean; error?: string } {
  if (!apiKey || apiKey.trim().length === 0) {
    return { valid: false, error: 'API key is required' };
  }

  // Basic API key validation - should be at least 20 characters
  if (apiKey.length < 20) {
    return { valid: false, error: 'Invalid API key format' };
  }

  return { valid: true };
}

/**
 * Sanitizes and validates a message content
 */
export function validateMessageContent(content: string): { valid: boolean; sanitized?: string; error?: string } {
  if (!content || content.trim().length === 0) {
    return { valid: false, error: 'Message content is required' };
  }

  const sanitized = sanitizeString(content);
  
  if (sanitized.length > 50000) {
    return { valid: false, error: 'Message content must be less than 50,000 characters' };
  }

  return { valid: true, sanitized };
}
