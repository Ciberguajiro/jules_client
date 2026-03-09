use crate::commands::*;
use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use std::time::SystemTime;
use tauri::Manager;
use serde_json::Value;

mod api;
mod commands;

pub struct CacheEntry {
    pub value: Value,
    pub timestamp: SystemTime,
}

pub struct AppState {
    pub api_key: Mutex<Option<String>>,
    pub cache: Mutex<HashMap<String, CacheEntry>>,
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_log::Builder::default().build())
        .plugin({
            #[cfg(desktop)]
            {
                tauri_plugin_updater::Builder::new().build()
            }
            #[cfg(not(desktop))]
            {
                tauri::plugin::TauriPlugin::new("updater", |_app, _api| Ok(()))
            }
        })
        .plugin(tauri_plugin_opener::init())
        .manage(AppState {
            api_key: Mutex::new(None),
            cache: Mutex::new(HashMap::new()),
        })
        .setup(|app| {
            let app_handle = Arc::new(app.handle().clone());
            tauri::async_runtime::spawn(async move {
                let key = commands::load_api_key_internal(&app_handle).await;
                let state = app_handle.state::<AppState>();
                if let Ok(mut api_key) = state.inner().api_key.lock() {
                    *api_key = key;
                }
            });
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_sources,
            get_sessions,
            get_session_by_id,
            delete_session,
            post_session,
            post_session_send_message,
            post_session_approve_plan,
            get_session_activities,
            set_api_key,
            get_api_key_status
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
