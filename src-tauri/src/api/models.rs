use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GitHubRepoContext {
    pub starting_branch: String,
}

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SourceContext {
    pub source: String,
    pub github_repo_context: Option<GitHubRepoContext>,
}

#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CreateSessionRequest {
    pub prompt: String,
    pub title: Option<String>,
    pub source_context: Option<SourceContext>,
    pub require_plan_approval: Option<bool>,
    pub automation_mode: Option<String>,
}

#[derive(Serialize, Deserialize)]
pub struct SendMessageRequest {
    pub prompt: String,
}
