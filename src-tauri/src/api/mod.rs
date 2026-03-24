pub mod models;

use once_cell::sync::Lazy;
use reqwest::Client;
use crate::commands::get_api_base_url;

pub static HTTP_CLIENT: Lazy<Client> = Lazy::new(|| {
    Client::builder()
        .pool_idle_timeout(std::time::Duration::from_secs(30))
        .pool_max_idle_per_host(10)
        .build()
        .expect("Failed to create HTTP client")
});

pub fn url(path: &str) -> String {
    let base = get_api_base_url();
    // Ensure the base URL doesn't end with a slash and the path starts with a slash
    let base = base.trim_end_matches('/');
    let path = if path.starts_with('/') { path } else { &format!("/{path}") };
    format!("{}{}{}", base, path, if path == "/" || path.ends_with('/') { "" } else { "" })
}