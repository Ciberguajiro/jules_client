<script lang="ts">
  import { page } from "$app/state";
  import { goto } from "$app/navigation";
  import { invoke } from "@tauri-apps/api/core";
  import { onDestroy, onMount } from "svelte";
  import { Loader2, AlertCircle } from "lucide-svelte";
  import {
    ResizableHandle,
    ResizablePane,
    ResizablePaneGroup,
  } from "@/lib/components/ui/resizable";
  import { Button } from "@/lib/components/ui/button";

  import SessionHeader from "./components/SessionHeader.svelte";
  import SessionSidebar from "./components/SessionSidebar.svelte";
  import ActivityList from "./components/ActivityList.svelte";
  import MessageInput from "./components/MessageInput.svelte";

  import type { Activity, SessionById, ListActivitiesResponse } from "@/types";

  let session_id = $derived(page.params.id);
  let session = $state<SessionById | null>(null);
  let activities = $state<Activity[]>([]);
  let loading = $state(true);
  let error = $state<string | null>(null);
  let isPlanApproved = $state(false);

  let refetchTimer: number | null = $state(null);
  let countdown: number = $state(0);

  async function fetchSessionData() {
    loading = true;
    error = null;
    try {
      session = await invoke<SessionById>("get_session_by_id", {
        sessionId: session_id,
      });

      if (!session) {
        error = "Session not found.";
        return;
      }

      const activitiesData = await invoke<ListActivitiesResponse | Activity[]>(
        "get_session_activities",
        {
          sessionId: session_id,
        },
      );

      activities = Array.isArray(activitiesData)
        ? activitiesData
        : activitiesData.activities || [];

        activities = activities.map( a => {
          if (a.planApproved) {
            a.planApproved.plan = activities.find(d => d.planGenerated?.plan.id === a.planApproved?.planId)?.planGenerated?.plan
          }
          return a
        })

      isPlanApproved = ![
        "AWAITING_PLAN_APPROVAL",
        "PLANNING",
        "QUEUED",
      ].includes(session.state);
    } catch (err) {
      console.error("Error fetching session data:", err);
      error = "Failed to load session details. " + err;
    } finally {
      loading = false;
    }
  }

  onMount(fetchSessionData);

  async function approvePlan() {
    try {
      await invoke("post_session_approve_plan", { sessionId: session_id });
      await fetchSessionData();
    } catch (err) {
      console.error("Error approving plan:", err);
      throw err;
    }
  }

  async function deleteSession() {
    try {
      await invoke("delete_session", { sessionId: session_id });
      goto("/sessions");
    } catch (err) {
      console.error("Error deleting session:", err);
      throw err;
    }
  }

  async function sendMessage(prompt: string) {
    try {
      await invoke("post_session_send_message", {
        sessionId: session_id,
        payload: { prompt },
      });
      await fetchSessionData();
    } catch (err) {
      console.error("Error sending message:", err);
      throw err;
    }
  }

  onDestroy(() => {
    if (refetchTimer) {
      clearInterval(refetchTimer);
    }
  });

  $effect(() => {
    const hasInProgressSession = session?.state === "IN_PROGRESS";
    
    if (hasInProgressSession) {
      if (!refetchTimer) {
        countdown = 1.5;
        refetchTimer = setInterval(() => {
          countdown -= 0.1;
          if (countdown <= 0) {
            fetchSessionData();
            countdown = 1.5;
          }
        }, 100);
      }
    } else {
      if (refetchTimer) {
        clearInterval(refetchTimer);
        refetchTimer = null;
        countdown = 0;
      }
    }
  });
</script>

<div class="flex flex-col h-full bg-background overflow-hidden">
  {#if loading || !session}
    <div class="flex-1 flex flex-col items-center justify-center space-y-4">
      <div class="relative">
        <Loader2 class="h-12 w-12 animate-spin text-primary" />
        <div class="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse"></div>
      </div>
      <p class="text-muted-foreground font-medium animate-pulse">
        Loading session details...
      </p>
    </div>
  {:else if error}
    <div class="flex-1 flex flex-col items-center justify-center p-6 text-center">
      <div class="bg-destructive/10 p-4 rounded-2xl mb-6 ring-1 ring-destructive/20 shadow-lg shadow-destructive/5">
        <AlertCircle class="h-10 w-10 text-destructive" />
      </div>
      <h2 class="text-xl font-bold mb-2">Oops! Something went wrong</h2>
      <p class="text-muted-foreground max-w-md mb-8 leading-relaxed">{error}</p>
      <a href="/sessions">
        <Button variant="outline" class="px-8">Back to Sessions</Button>
      </a>
    </div>
  {:else if session}
    <SessionHeader
      {session}
      {isPlanApproved}
      onApprovePlan={approvePlan}
      onDeleteSession={deleteSession}
    />

    <ResizablePaneGroup direction="horizontal" class="flex-1 overflow-hidden">
      <ResizablePane
        defaultSize={22}
        minSize={18}
        maxSize={35}
        class="bg-sidebar/30 border-r border-border hidden md:block"
      >
      {#if refetchTimer && countdown > 0}
        <span class="text-xs text-muted-foreground ml-2">
          Refetching in {(countdown).toFixed(1)}s
        </span>
      {/if}
        <SessionSidebar {session} />
      </ResizablePane>

      <ResizableHandle withHandle class="w-1 bg-border/50 hover:bg-primary/30 transition-colors" />

      <ResizablePane defaultSize={78} minSize={40}>
        <div class="flex flex-col h-full bg-background/40">
          <ActivityList {activities} />
          <MessageInput onSendMessage={sendMessage} />
        </div>
      </ResizablePane>
    </ResizablePaneGroup>
  {/if}
</div>
