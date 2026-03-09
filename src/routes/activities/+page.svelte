<script lang="ts">
  import { invoke } from "@tauri-apps/api/core";
  import { onMount } from "svelte";
  import {
    Activity,
    Code2,
    PlayCircle,
    GitCommit,
    GitPullRequest,
    Loader2,
    AlertCircle
  } from "lucide-svelte";

  let activities = $state<any[]>([]);
  let loading = $state(true);
  let error = $state<string | null>(null);

  const icons: Record<string, any> = {
    session_start: PlayCircle,
    code_change: Code2,
    commit: GitCommit,
    pr: GitPullRequest,
    session_end: Activity,
  };

  const colors: Record<string, string> = {
    session_start: "text-blue-400",
    code_change: "text-emerald-400",
    commit: "text-purple-400",
    pr: "text-amber-400",
    session_end: "text-muted-foreground",
  };

  onMount(async () => {
    loading = true;
    error = null;
    try {
      const data = await invoke<any>("get_sessions");
      const sessions = Array.isArray(data) ? data : (data.sessions || []);

      let allActivities: any[] = [];
      for (const session of sessions) {
        if (session && session.id) {
          try {
            const activitiesData = await invoke<any>("get_session_activities", { sessionId: session.id });
              const sessionActivities = Array.isArray(activitiesData) ? activitiesData : (activitiesData.activities || []);
              allActivities = [...allActivities, ...sessionActivities.map((a: any) => ({ ...a, sessionId: session.id, sessionTitle: session.title }))];
            } catch (e) {
              console.error(`Error fetching activities for session ${session.id}:`, e);
            }
          }
      }

      activities = allActivities.sort((a, b) => new Date(b.createTime).getTime() - new Date(a.createTime).getTime());
    } catch (err) {
      console.error("Error fetching activities:", err);
      error = "Failed to load activities. " + err;
    } finally {
      loading = false;
    }
  });
</script>

<div class="flex-1 flex flex-col h-full bg-background">
  <div class="h-14 border-b border-border flex items-center px-6 shrink-0">
    <h1 class="font-semibold text-lg">Activity Log</h1>
  </div>

  <div class="p-6 flex-1 overflow-auto">
    <div class="mx-auto">
      {#if loading}
        <div class="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Loader2 class="h-8 w-8 animate-spin mb-4" />
          <p>Loading activities...</p>
        </div>
      {:else if error}
        <div class="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-4 rounded-md border border-destructive/20">
          <AlertCircle class="w-4 h-4" />
          {error}
        </div>
      {:else if activities.length === 0}
        <div class="text-center py-20 border border-dashed border-border rounded-lg">
          <p class="text-muted-foreground">No recent activity recorded.</p>
        </div>
      {:else}
        <div class="relative border-l border-border/50 ml-3 pl-8 space-y-8 py-4">
          {#each activities as activity}
            {@const Icon = icons[activity.type] || Activity}
            {@const Color = colors[activity.type] || "text-muted-foreground"}
            <div class="relative group">
              <div class={`absolute -left-10.25 p-1.5 rounded-full bg-background border border-border ${Color} group-hover:scale-110 transition-transform`}>
                <Icon class="h-4 w-4" />
              </div>
              <div class="flex flex-col gap-1">
                <div class="flex items-center gap-3">
                  <span class="font-medium text-sm text-foreground">{activity.title || activity.name || 'Activity'}</span>
                  <span class="text-xs text-muted-foreground">{new Date(activity.createTime).toLocaleString()}</span>
                </div>
                {#if activity.sessionTitle}
                   <a href="/sessions/{activity.sessionId}" class="text-[10px] uppercase tracking-wider text-primary hover:underline">
                     {activity.sessionTitle}
                   </a>
                {/if}
                {#if activity.description || activity.progressUpdated?.description}
                  <span class="text-sm text-muted-foreground">{activity.description || activity.progressUpdated?.description}</span>
                {/if}
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </div>
  </div>
</div>
