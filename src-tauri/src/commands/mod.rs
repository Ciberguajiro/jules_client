use tauri::{command, AppHandle, Manager};
use serde_json::Value;
use crate::api::{HTTP_CLIENT, url, models::{CreateSessionRequest, SendMessageRequest}};
use crate::{AppState, CacheEntry};
use std::fs;
use std::time::{SystemTime, Duration};
use tauri::path::BaseDirectory;

type ApiResult<T> = Result<T, String>;

const CACHE_TTL: Duration = Duration::from_secs(60);

fn get_cached_value(state: &tauri::State<'_, AppState>, key: &str) -> Option<Value> {
    let cache = state.cache.lock().ok()?;
    if let Some(entry) = cache.get(key) {
        if entry.timestamp.elapsed().unwrap_or(CACHE_TTL) < CACHE_TTL {
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
    let res: Value = HTTP_CLIENT
        .get(url(cache_key))
        .header("X-Goog-Api-Key", api_key)
        .send()
        .await
        .map_err(|e| e.to_string())?
        .json()
        .await
        .map_err(|e| e.to_string())?;

    set_cached_value(&state, cache_key.to_string(), res.clone());
    Ok(res)
}

#[command]
pub async fn delete_session(
    state: tauri::State<'_, AppState>,
    session_id: String
) -> ApiResult<Value> {
    let api_key = get_api_key(state.clone()).await?;
    let endpoint = format!("/sessions/{session_id}");

    let res: Value = HTTP_CLIENT
        .delete(url(&endpoint))
        .header("X-Goog-Api-Key", api_key)
        .send()
        .await
        .map_err(|e| e.to_string())?
        .json()
        .await
        .map_err(|e| e.to_string())?;

    invalidate_cache(&state, "/sessions");
    invalidate_cache_prefix(&state, &format!("/sessions/{session_id}"));

    Ok(res)
}

#[command]
pub async fn get_sessions(state: tauri::State<'_, AppState>) -> ApiResult<Value> {
    let cache_key = "/sessions";
    if let Some(cached) = get_cached_value(&state, cache_key) {
        return Ok(cached);
    }

    let api_key = get_api_key(state.clone()).await?;
    let res: Value = HTTP_CLIENT
        .get(url(cache_key))
        .header("X-Goog-Api-Key", api_key)
        .send()
        .await
        .map_err(|e| e.to_string())?
        .json()
        .await
        .map_err(|e| e.to_string())?;

    set_cached_value(&state, cache_key.to_string(), res.clone());
    Ok(res)
}

#[command]
pub async fn get_session_by_id(
    state: tauri::State<'_, AppState>,
    session_id: String
) -> ApiResult<Value> {
    let cache_key = format!("/sessions/{session_id}");
    if let Some(cached) = get_cached_value(&state, &cache_key) {
        return Ok(cached);
    }

    let api_key = get_api_key(state.clone()).await?;
    let res: Value = HTTP_CLIENT
        .get(url(&cache_key))
        .header("X-Goog-Api-Key", api_key)
        .send()
        .await
        .map_err(|e| e.to_string())?
        .json()
        .await
        .map_err(|e| e.to_string())?;

    set_cached_value(&state, cache_key, res.clone());
    Ok(res)
}

#[command]
pub async fn post_session(
    state: tauri::State<'_, AppState>,
    payload: CreateSessionRequest
) -> ApiResult<Value> {
    let api_key = get_api_key(state.clone()).await?;
    let res: Value = HTTP_CLIENT
        .post(url("/sessions"))
        .header("X-Goog-Api-Key", api_key)
        .json(&payload)
        .send()
        .await
        .map_err(|e| e.to_string())?
        .json()
        .await
        .map_err(|e| e.to_string())?;

    invalidate_cache(&state, "/sessions");

    Ok(res)
}

#[command]
pub async fn post_session_send_message(
    state: tauri::State<'_, AppState>,
    session_id: String,
    payload: SendMessageRequest,
) -> ApiResult<Value> {
    let api_key = get_api_key(state.clone()).await?;
    let endpoint = format!("/sessions/{session_id}:sendMessage");

    let res: Value = HTTP_CLIENT
        .post(url(&endpoint))
        .header("X-Goog-Api-Key", api_key)
        .json(&payload)
        .send()
        .await
        .map_err(|e| e.to_string())?
        .json()
        .await
        .map_err(|e| e.to_string())?;

    invalidate_cache(&state, "/sessions");
    invalidate_cache_prefix(&state, &format!("/sessions/{session_id}"));

    Ok(res)
}

#[command]
pub async fn post_session_approve_plan(
    state: tauri::State<'_, AppState>,
    session_id: String
) -> ApiResult<Value> {
    let api_key = get_api_key(state.clone()).await?;
    let endpoint = format!("/sessions/{session_id}:approvePlan");

    let res: Value = HTTP_CLIENT
        .post(url(&endpoint))
        .header("X-Goog-Api-Key", api_key)
        .json(&serde_json::json!({}))
        .send()
        .await
        .map_err(|e| e.to_string())?
        .json()
        .await
        .map_err(|e| e.to_string())?;

    invalidate_cache(&state, "/sessions");
    invalidate_cache_prefix(&state, &format!("/sessions/{session_id}"));

    Ok(res)
}

#[command]
pub async fn get_session_activities(
    state: tauri::State<'_, AppState>,
    session_id: String
) -> ApiResult<Value> {
    let cache_key = format!("/sessions/{session_id}/activities");
    if let Some(cached) = get_cached_value(&state, &cache_key) {
        return Ok(cached);
    }

    let api_key = get_api_key(state.clone()).await?;
    let res: Value = HTTP_CLIENT
        .get(url(&cache_key))
        .header("X-Goog-Api-Key", api_key)
        .send()
        .await
        .map_err(|e| e.to_string())?
        .json()
        .await
        .map_err(|e| e.to_string())?;

    set_cached_value(&state, cache_key, res.clone());
    Ok(res)
}
