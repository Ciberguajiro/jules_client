export type SessionState =
  | 'STATE_UNSPECIFIED'
  | 'QUEUED'
  | 'PLANNING'
  | 'AWAITING_PLAN_APPROVAL'
  | 'AWAITING_USER_FEEDBACK'
  | 'IN_PROGRESS'
  | 'PAUSED'
  | 'FAILED'
  | 'COMPLETED';

export type AutomationMode = 'AUTOMATION_MODE_UNSPECIFIED' | 'AUTO_CREATE_PR';

export type GitHubRepoContext = {
  startingBranch: string;
};

export interface PullRequest {
  baseRef: string;
  description: string;
  headRef: string;
  title: string;
  url: string;
}

export interface GitPatch {
  baseCommitId: string;
  suggestedCommitMessage: string;
  unidiffPatch: string;
}

export interface ChangeSet {
  gitPatch: GitPatch;
  source: string;
}

export type SessionOutput = {
  pullRequest?: PullRequest;
  changeSet?: ChangeSet;
};

export type Session = {
  name: string;
  id: string;
  prompt: string;
  title?: string;
  state: SessionState;
  url: string;
  sourceContext: SourceContext;
  requirePlanApproval?: boolean;
  automationMode?: AutomationMode;
  outputs?: SessionOutput[];
  createTime: string;
  updateTime: string;
};

export interface SessionById extends Session {}

export type PlanStep = {
  id: string;
  index: number;
  title: string;
  description: string;
};

export type Plan = {
  id: string;
  steps: PlanStep[];
  createTime: string;
};

export type BashOutput = {
  command: string;
  output: string;
  exitCode: number;
};

export type Media = {
  mimeType: string;
  data: string;
};

export type Artifact = {
  changeSet?: ChangeSet;
  bashOutput?: BashOutput;
  media?: Media;
};

export type PlanGenerated = {
  plan: Plan;
};

export type PlanApproved = {
  planId: string;
  plan?:Plan
};

export type UserMessaged = {
  userMessage: string;
};

export type AgentMessaged = {
  agentMessage: string;
};

export type ProgressUpdated = {
  title: string;
  description: string;
};

export type SessionFailed = {
  reason: string;
};

export type Activity = {
  name: string;
  id: string;
  originator: 'user' | 'agent' | 'system';
  description?: string;
  createTime: string;
  artifacts?: Artifact[];
  planGenerated?: PlanGenerated;
  planApproved?: PlanApproved;
  userMessaged?: UserMessaged;
  agentMessaged?: AgentMessaged;
  progressUpdated?: ProgressUpdated;
  sessionCompleted?: Record<string, never>;
  sessionFailed?: SessionFailed;
};

export type ListSessionsResponse = {
  sessions: Session[];
  nextPageToken?: string;
};

export type ListActivitiesResponse = {
  activities: Activity[];
  nextPageToken?: string;
};

export type ListSourcesResponse = {
  sources: Source[];
  nextPageToken?: string;
};

export type GitHubBranch = {
  displayName: string;
};

export type GitHubRepo = {
  owner: string;
  repo: string;
  isPrivate: boolean;
  defaultBranch: GitHubBranch;
  branches: GitHubBranch[];
};

export type Source = {
  name: string;
  id: string;
  githubRepo: GitHubRepo;
};

export interface SourceContext {
  environmentVariablesEnabled?: boolean;
  githubRepoContext?: GitHubRepoContext;
  source: string;
}
