use tauri::{command, AppHandle, Manager};
use serde_json::Value;
use crate::api::{HTTP_CLIENT, url, models::{CreateSessionRequest, SendMessageRequest}};
use crate::{AppState, CacheEntry};
use std::fs;
use std::time::{SystemTime, Duration};
use tauri::path::BaseDirectory;
use std::env;
use regex::Regex;

type ApiResult<T> = Result<T, String>;

/**
 * Loads cache TTL from environment variables with fallback to default
 * 
 * # Environment Variables
 * - `CACHE_TTL`: Cache time-to-live in seconds (default: 60)
 * 
 * # Returns
 * `Duration` - Configured cache TTL duration
 * 
 * # Examples
 * ```rust
 * let ttl = get_cache_ttl(); // Uses env var or defaults to 60s
 * ```
 */
fn get_cache_ttl() -> Duration {
    match env::var("CACHE_TTL") {
        Ok(ttl_str) => {
            ttl_str.parse::<u64>()
                .map(Duration::from_secs)
                .unwrap_or(Duration::from_secs(60))
        }
        Err(_) => Duration::from_secs(60),
    }
}

/**
 * Gets API base URL from environment with fallback to default
 * 
 * # Environment Variables
 * - `JULES_API_URL`: Base URL for Jules API (default: https://jules.googleapis.com/v1alpha)
 * 
 * # Returns
 * `String` - Configured API base URL
 * 
 * # Examples
 * ```rust
 * let url = get_api_base_url();
 * ```
 */
pub fn get_api_base_url() -> String {
    env::var("JULES_API_URL").unwrap_or_else(|_| "https://jules.googleapis.com/v1alpha".to_string())
}

/**
 * Sanitizes string input to prevent XSS and injection attacks
 * 
 * # Security Features
 * - Removes `<` and `>` characters to prevent HTML injection
 * - Removes `javascript:` patterns (case-insensitive) to prevent script injection
 * - Removes `on*=` event handlers to prevent event injection
 * - Removes control characters (ASCII 0-31, 127) for input sanitization
 * 
 * # Arguments
 * - `input: &str` - Raw input string to sanitize
 * 
 * # Returns
 * `String` - Sanitized string safe for processing
 * 
 * # Examples
 * ```rust
 * let clean = sanitize_string("<script>alert('x')</script>");
 * // Returns: "alert('x')"
 * ```
 */
fn sanitize_string(input: &str) -> String {
    let re = Regex::new(r"[<>]").unwrap();
    let cleaned = re.replace_all(input, "");
    let re_js = Regex::new(r"(?i)javascript:").unwrap();
    let cleaned = re_js.replace_all(&cleaned, "");
    let re_events = Regex::new(r"(?i)on\w+=").unwrap();
    let cleaned = re_events.replace_all(&cleaned, "");
    let re_control = Regex::new(r"[\x00-\x1F\x7F]").unwrap();
    re_control.replace_all(&cleaned, "").trim().to_string()
}

/**
 * Validates and sanitizes session ID format for security and consistency
 * 
 * # Validation Rules
 * - Cannot be empty or whitespace only
 * - Must match regex pattern: `^[a-zA-Z0-9_-]+$`
 * - Applies input sanitization first
 * 
 * # Arguments
 * - `session_id: &str` - Raw session ID to validate
 * 
 * # Returns
 * `Result<String, String>` - Ok(sanitized_id) or Err(error_message)
 * 
 * # Errors
 * - `"Session ID is required"` - When input is empty
 * - `"Invalid session ID format"` - When format doesn't match pattern
 * 
 * # Examples
 * ```rust
 * let valid = validate_session_id("session_123");
 * // Returns: Ok("session_123")
 * 
 * let invalid = validate_session_id("session@123");
 * // Returns: Err("Invalid session ID format")
 * ```
 */
fn validate_session_id(session_id: &str) -> ApiResult<String> {
    if session_id.trim().is_empty() {
        return Err("Session ID is required".to_string());
    }
    
    let sanitized = sanitize_string(session_id);
    let re = Regex::new(r"^[a-zA-Z0-9_-]+$").unwrap();
    if !re.is_match(&sanitized) {
        return Err("Invalid session ID format".to_string());
    }
    
    Ok(sanitized)
}

/**
 * Validates message/prompt content for length and security
 * 
 * # Validation Rules
 * - Cannot be empty or whitespace only
 * - Maximum 50,000 characters to prevent abuse
 * - Applies input sanitization for XSS prevention
 * 
 * # Arguments
 * - `content: &str` - Message content to validate
 * 
 * # Returns
 * `Result<String, String>` - Ok(sanitized_content) or Err(error_message)
 * 
 * # Errors
 * - `"Message content is required"` - When input is empty
 * - `"Message content must be less than 50,000 characters"` - When too long
 * 
 * # Examples
 * ```rust
 * let valid = validate_message_content("Hello world");
 * // Returns: Ok("Hello world")
 * ```
 */
fn validate_message_content(content: &str) -> ApiResult<String> {
    if content.trim().is_empty() {
        return Err("Message content is required".to_string());
    }
    
    let sanitized = sanitize_string(content);
    if sanitized.len() > 50000 {
        return Err("Message content must be less than 50,000 characters".to_string());
    }
    
    Ok(sanitized)
}

/**
 * Alias for message content validation with semantic clarity
 * 
 * This function provides the same validation logic as `validate_message_content`
 * but with a more descriptive name for prompt-specific contexts.
 * 
 * # Arguments
 * - `content: &str` - Prompt content to validate
 * 
 * # Returns
 * `Result<String, String>` - Same as validate_message_content
 * 
 * # See Also
 * - `validate_message_content` - Core validation logic
 * 
 * # Examples
 * ```rust
 * let valid = validate_prompt_content("Create a login form");
 * // Returns: Ok("Create a login form")
 * ```
 */
fn validate_prompt_content(content: &str) -> ApiResult<String> {
    validate_message_content(content)
}

// Enhanced error handling for better debugging
fn handle_json_error(operation: &str, error: reqwest::Error, status: reqwest::StatusCode, url: &str) -> String {
    let error_details = format!(
        "JSON parsing error in {}: {}\nURL: {}\nStatus: {}\nError: {}",
        operation,
        error,
        url,
        status,
        error
    );
    
    // Log full error in development
    if is_development() {
        eprintln!("DEBUG - Full error details:\n{}", error_details);
        
        // Log if it's a body error specifically
        if error.is_body() {
            eprintln!("DEBUG - This is a response body decoding error");
            eprintln!("DEBUG - Common causes:");
            eprintln!("  - Response is not valid JSON");
            eprintln!("  - Response is empty");
            eprintln!("  - Response contains invalid UTF-8");
            eprintln!("  - Response size exceeds limits");
        }
        
        if error.is_timeout() {
            eprintln!("DEBUG - Request timed out");
        }
        
        if error.is_connect() {
            eprintln!("DEBUG - Connection failed");
        }
        
        if error.is_request() {
            eprintln!("DEBUG - Invalid request");
        }
    }
    
    // Return user-friendly error with more context
    if error.is_body() {
        format!("Failed to decode {} response - invalid or empty JSON (Status: {})", operation, status)
    } else {
        format!("Failed to process {} response: {} (Status: {})", operation, error, status)
    }
}

fn is_development() -> bool {
    std::env::var("ENVIRONMENT").unwrap_or_else(|_| "development".to_string()) == "development"
}

// Enhanced HTTP client error handler - now used for better error handling
async fn handle_http_request(
    request: reqwest::RequestBuilder,
    operation: &str
) -> ApiResult<reqwest::Response> {
    match request.send().await {
        Ok(response) => Ok(response),
        Err(e) => {
            let error_msg = if e.is_timeout() {
                format!("Request timeout for {}", operation)
            } else if e.is_connect() {
                format!("Connection failed for {}: {}", operation, e)
            } else if e.is_request() {
                format!("Invalid request for {}: {}", operation, e)
            } else {
                format!("Network error for {}: {}", operation, e)
            };
            
            if is_development() {
                eprintln!("DEBUG - HTTP request error: {}", error_msg);
            }
            
            Err(error_msg)
        }
    }
}

// Wrapper function for HTTP requests with enhanced error handling
async fn make_http_request(
    method: reqwest::Method,
    url: &str,
    api_key: &str,
    operation: &str,
    body: Option<Value>,
) -> ApiResult<reqwest::Response> {
    let mut request = HTTP_CLIENT
        .request(method, url)
        .header("X-Goog-Api-Key", api_key);
    
    if let Some(body_json) = body {
        request = request.json(&body_json);
    }
    
    handle_http_request(request, operation).await
}

fn get_cached_value(state: &tauri::State<'_, AppState>, key: &str) -> Option<Value> {
    let cache = state.cache.lock().ok()?;
    if let Some(entry) = cache.get(key) {
        let cache_ttl = get_cache_ttl();
        if entry.timestamp.elapsed().unwrap_or(cache_ttl) < cache_ttl {
            return Some(entry.value.clone());
        }
    }
    None
}

fn set_cached_value(state: &tauri::State<'_, AppState>, key: String, value: Value) {
    if let Ok(mut cache) = state.cache.lock() {
        cache.insert(key, CacheEntry {
            value,
            timestamp: SystemTime::now(),
        });
    }
}

fn invalidate_cache(state: &tauri::State<'_, AppState>, key: &str) {
    if let Ok(mut cache) = state.cache.lock() {
        cache.remove(key);
    }
}

fn invalidate_cache_prefix(state: &tauri::State<'_, AppState>, prefix: &str) {
    if let Ok(mut cache) = state.cache.lock() {
        cache.retain(|k, _| k != prefix && !k.starts_with(&(prefix.to_owned() + "/")));
    }
}

async fn get_api_key(state: tauri::State<'_, AppState>) -> ApiResult<String> {
    state.api_key.lock().map_err(|e| e.to_string())?
        .clone()
        .ok_or_else(|| "API Key not set. Please go to settings and configure it.".to_string())
}

#[command]
pub async fn get_api_key_status(state: tauri::State<'_, AppState>) -> Result<bool, String> {
    Ok(state.api_key.lock().map_err(|e| e.to_string())?.is_some())
}

#[command]
pub async fn set_api_key(
    state: tauri::State<'_, AppState>,
    handle: AppHandle,
    key: String
) -> ApiResult<()> {
    // 1. Update In-Memory State
    let mut state_key = state.api_key.lock().map_err(|e| e.to_string())?;
    *state_key = Some(key.clone());

    // 2. Persist to App Data Directory
    let path = handle.path().resolve("api_key.txt", BaseDirectory::AppData)
        .map_err(|e| e.to_string())?;

    // Ensure the directory exists
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }

    fs::write(path, key).map_err(|e| e.to_string())?;

    Ok(())
}

pub async fn load_api_key_internal(handle: &AppHandle) -> Option<String> {
    let path = handle.path().resolve("api_key.txt", BaseDirectory::AppData).ok()?;
    fs::read_to_string(path).ok().map(|s| s.trim().to_string())
}

#[command]
pub async fn get_sources(state: tauri::State<'_, AppState>) -> ApiResult<Value> {
    let cache_key = "/sources";
    if let Some(cached) = get_cached_value(&state, cache_key) {
        return Ok(cached);
    }

    let api_key = get_api_key(state.clone()).await?;
    
    let response = HTTP_CLIENT
        .get(url(cache_key))
        .header("X-Goog-Api-Key", api_key)
        .send()
        .await
        .map_err(|e| format!("Network error while fetching sources: {}", e))?;

    let status = response.status();
    let url_str = response.url().to_string();
    
    let res: Value = response
        .json()
        .await
        .map_err(|e| handle_json_error("get_sources", e, status, &url_str))?;

    set_cached_value(&state, cache_key.to_string(), res.clone());
    Ok(res)
}

#[command]
pub async fn delete_session(
    state: tauri::State<'_, AppState>,
    session_id: String
) -> ApiResult<Value> {
    // Validate session ID
    let validated_id = validate_session_id(&session_id)?;
    
    let api_key = get_api_key(state.clone()).await?;
    let endpoint = format!("/sessions/{}", validated_id);

    let response = HTTP_CLIENT
        .delete(url(&endpoint))
        .header("X-Goog-Api-Key", api_key)
        .send()
        .await
        .map_err(|e| format!("Network error while deleting session: {}", e))?;

    let status = response.status();
    let url_str = response.url().to_string();
    
    let res: Value = response
        .json()
        .await
        .map_err(|e| handle_json_error("delete_session", e, status, &url_str))?;

    invalidate_cache(&state, "/sessions");
    invalidate_cache_prefix(&state, &format!("/sessions/{}", validated_id));

    Ok(res)
}

#[command]
pub async fn get_sessions(state: tauri::State<'_, AppState>) -> ApiResult<Value> {
    let cache_key = "/sessions";
    if let Some(cached) = get_cached_value(&state, cache_key) {
        return Ok(cached);
    }

    let api_key = get_api_key(state.clone()).await?;
    
    let response = HTTP_CLIENT
        .get(url(cache_key))
        .header("X-Goog-Api-Key", api_key)
        .send()
        .await
        .map_err(|e| format!("Network error while fetching sessions: {}", e))?;

    let status = response.status();
    let url_str = response.url().to_string();
    
    let res: Value = response
        .json()
        .await
        .map_err(|e| handle_json_error("get_sessions", e, status, &url_str))?;

    set_cached_value(&state, cache_key.to_string(), res.clone());
    Ok(res)
}

#[command]
pub async fn get_session_by_id(
    state: tauri::State<'_, AppState>,
    session_id: String
) -> ApiResult<Value> {
    // Validate session ID
    let validated_id = validate_session_id(&session_id)?;
    
    let cache_key = format!("/sessions/{}", validated_id);
    if let Some(cached) = get_cached_value(&state, &cache_key) {
        return Ok(cached);
    }

    let api_key = get_api_key(state.clone()).await?;
    
    let response = HTTP_CLIENT
        .get(url(&cache_key))
        .header("X-Goog-Api-Key", api_key)
        .send()
        .await
        .map_err(|e| format!("Network error while fetching session: {}", e))?;

    let status = response.status();
    let url_str = response.url().to_string();
    
    let res: Value = response
        .json()
        .await
        .map_err(|e| handle_json_error("get_session_by_id", e, status, &url_str))?;

    set_cached_value(&state, cache_key.to_string(), res.clone());
    Ok(res)
}

#[command]
pub async fn post_session(
    state: tauri::State<'_, AppState>,
    payload: CreateSessionRequest,
) -> ApiResult<Value> {
    let api_key = get_api_key(state.clone()).await?;
    
    let response = make_http_request(
        reqwest::Method::POST,
        &url("/sessions"),
        &api_key,
        "post_session",
        Some(serde_json::to_value(payload).map_err(|e| format!("Failed to serialize payload: {}", e))?),
    ).await?;

    let status = response.status();
    let url_str = response.url().to_string();
    
    let res: Value = response
        .json()
        .await
        .map_err(|e| handle_json_error("post_session", e, status, &url_str))?;

    invalidate_cache(&state, "/sessions");
    Ok(res)
}

#[command]
pub async fn send_message(
    state: tauri::State<'_, AppState>,
    session_id: String,
    payload: SendMessageRequest,
) -> ApiResult<Value> {
    // Validate session ID
    let validated_id = validate_session_id(&session_id)?;
    
    // Validate prompt content
    let validated_content = validate_prompt_content(&payload.prompt)?;
    let mut validated_payload = payload;
    validated_payload.prompt = validated_content;
    
    let api_key = get_api_key(state.clone()).await?;
    let endpoint = format!("/sessions/{}/messages", validated_id);
    
    let response = HTTP_CLIENT
        .post(url(&endpoint))
        .header("X-Goog-Api-Key", api_key)
        .json(&validated_payload)
        .send()
        .await
        .map_err(|e| format!("Network error while sending message: {}", e))?;

    let status = response.status();
    let url_str = response.url().to_string();
    
    let res: Value = response
        .json()
        .await
        .map_err(|e| handle_json_error("send_message", e, status, &url_str))?;

    invalidate_cache(&state, &format!("/sessions/{}", validated_id));
    invalidate_cache_prefix(&state, &format!("/sessions/{}/activities", validated_id));
    Ok(res)
}

#[command]
pub async fn post_session_approve_plan(
    state: tauri::State<'_, AppState>,
    session_id: String
) -> ApiResult<Value> {
    // Validate session ID
    let validated_id = validate_session_id(&session_id)?;
    
    let api_key = get_api_key(state.clone()).await?;
    let endpoint = format!("/sessions/{}:approvePlan", validated_id);
    
    let response = HTTP_CLIENT
        .post(url(&endpoint))
        .header("X-Goog-Api-Key", api_key)
        .json(&serde_json::json!({}))
        .send()
        .await
        .map_err(|e| format!("Network error while approving plan: {}", e))?;

    let status = response.status();
    let url_str = response.url().to_string();
    
    let res: Value = response
        .json()
        .await
        .map_err(|e| handle_json_error("post_session_approve_plan", e, status, &url_str))?;

    invalidate_cache(&state, "/sessions");
    invalidate_cache_prefix(&state, &format!("/sessions/{}", validated_id));
    Ok(res)
}

#[command]
pub async fn get_session_activities(
    state: tauri::State<'_, AppState>,
    session_id: String,
) -> ApiResult<Value> {
    // Validate session ID
    let validated_id = validate_session_id(&session_id)?;
    
    let cache_key = format!("/sessions/{}/activities", validated_id);
    if let Some(cached) = get_cached_value(&state, &cache_key) {
        return Ok(cached);
    }

    let api_key = get_api_key(state.clone()).await?;
    
    let response = HTTP_CLIENT
        .get(url(&cache_key))
        .header("X-Goog-Api-Key", api_key)
        .send()
        .await
        .map_err(|e| format!("Network error while fetching activities: {}", e))?;

    let status = response.status();
    let url_str = response.url().to_string();
    
    let res: Value = response
        .json()
        .await
        .map_err(|e| handle_json_error("get_session_activities", e, status, &url_str))?;

    set_cached_value(&state, cache_key, res.clone());
    Ok(res)
}
