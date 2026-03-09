pub mod models;

use once_cell::sync::Lazy;
use reqwest::Client;
static BASE_URL: &str = "https://jules.googleapis.com/v1alpha";

pub static HTTP_CLIENT: Lazy<Client> = Lazy::new(|| {
    Client::builder()
        .pool_idle_timeout(std::time::Duration::from_secs(30))
        .pool_max_idle_per_host(10)
        .build()
        .expect("Failed to create HTTP client")
});

pub fn url(path: &str) -> String {
    format!("{BASE_URL}{path}")
}