<script lang="ts">
  import {
    Search,
    Loader,
    AlertCircle,
    Github,
    Plus,
    History,
  } from "lucide-svelte";
  import { Input } from "@/lib/components/ui/input";
  import { Button } from "@/lib/components/ui/button";

  import StatusConfig from "@/components/status_config.svelte";
  import type { Session, Source } from "@/types";
  import { invoke } from "@tauri-apps/api/core";
  import { onMount, onDestroy } from "svelte";
  import { fade, slide } from "svelte/transition";
  import { Skeleton } from "@/lib/components/ui/skeleton";
  import { validateSearchText } from "@/lib/validation";
  import { ErrorHandler, withErrorHandling } from "@/lib/error-handler";
  import { log } from "@/lib/logger";
  import NewSession from "@/components/new_session.svelte";

  let NewSessionComponent: any = null;

  async function loadNewSessionComponent() {
    if (!NewSessionComponent) {
      const module = await import("@/components/new_session.svelte");
      NewSessionComponent = module.default;
    }
    return NewSessionComponent;
  }

  let sessions = $state<Session[]>([]);
  let sources = $state<Source[]>([]);
  let loading: boolean = $state(true);
  let error: string | null = $state(null);
  let filter = $state("");
  let refetchTimer: number | null = $state(null);
  let countdown: number = $state(0);
  let searchError = $state<string | null>(null);

  function validateSearch() {
    const validation = validateSearchText(filter);
    if (!validation.valid) {
      searchError = validation.error!;
      return false;
    }
    searchError = null;
    return true;
  }

  function handleSearchInput() {
    log.userAction('search_input', { searchTerm: filter });
    validateSearch();
  }



  async function fetchSessions() {
    const startTime = Date.now();
    
    const safeFetch = withErrorHandling(async () => {
      loading = true;
      error = null;
      log.apiCall('GET', '/sessions');
      
      const data = await invoke<any>("get_sessions");
      sessions = Array.isArray(data) ? data : (data.sessions || []);
      
      const duration = Date.now() - startTime;
      log.apiResponse('GET', '/sessions', 200, duration);
      log.info(`Fetched ${sessions.length} sessions`, { sessionCount: sessions.length });
    }, (appError) => {
      const duration = Date.now() - startTime;
      log.apiResponse('GET', '/sessions', 0, duration);
      log.error('Failed to fetch sessions', appError.originalError, { duration });
      error = ErrorHandler.getUserMessage(appError);
    });

    await safeFetch();
    loading = false;
  }

  async function fetchSources() {
    const startTime = Date.now();
    
    const safeFetch = withErrorHandling(async () => {
      log.apiCall('GET', '/sources');
      
      const data = await invoke<any>("get_sources");
      sources = Array.isArray(data) ? data : (data.sources || []);
      
      const duration = Date.now() - startTime;
      log.apiResponse('GET', '/sources', 200, duration);
      log.info(`Fetched ${sources.length} sources`, { sourceCount: sources.length });
    }, (appError) => {
      const duration = Date.now() - startTime;
      log.apiResponse('GET', '/sources', 0, duration);
      log.error('Failed to fetch sources', appError.originalError, { duration });
    });

    await safeFetch();
  }

  onMount(async () => {
    log.performance('page_mount_start', 0);
    
    // Start parallel data fetching
    const fetchPromises = [fetchSessions(), fetchSources()];
    
    // Prefetch commonly used components
    loadNewSessionComponent();
    
    await Promise.all(fetchPromises);
    
    log.performance('page_mount_complete', Date.now() - performance.now());
  });

  onDestroy(() => {
    if (refetchTimer) {
      clearInterval(refetchTimer);
    }
  });

  $effect(() => {
    const hasInProgressSession = sessions.some(s => s.state === 'IN_PROGRESS');
    
    if (hasInProgressSession) {
      if (!refetchTimer) {
        countdown = 1.5;
        refetchTimer = setInterval(() => {
          countdown -= 0.1;
          if (countdown <= 0) {
            fetchSessions();
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



  const filteredSessions = $derived(
    searchError ? [] : sessions.filter(
      (s) =>
        s.name.toLowerCase().includes(filter.toLowerCase()) ||
        s.sourceContext?.source?.toLowerCase().includes(filter.toLowerCase()),
    ),
  );
</script>

<div class="flex-1 flex flex-col h-full bg-background">
  <div
    class="h-14 border-b border-border flex items-center justify-between px-6 shrink-0 bg-background/50 backdrop-blur-md sticky top-0 z-10"
  >
    <h1 class="font-semibold text-lg flex items-center gap-2">
      Sessions
      {#if loading}
        <Loader class="w-4 h-4 animate-spin text-primary" />
      {/if}
      {#if refetchTimer && countdown > 0}
        <span class="text-xs text-muted-foreground ml-2">
          Refetching in {(countdown).toFixed(1)}s
        </span>
      {/if}
    </h1>

    <NewSession error={error} fetchSessions={fetchSessions} sources={sources}  />
  </div>

  <div class="p-6 flex-1 overflow-auto">
    <div class="mx-auto space-y-6">
      <div class="relative group">
        <Search
          class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground transition-colors group-focus-within:text-primary"
        />
        <Input
          placeholder="Search sessions..."
          bind:value={filter}
          class="pl-9 bg-card shadow-sm border-border/50 transition-all focus:border-primary/50 {searchError ? 'border-destructive' : ''}"
          oninput={handleSearchInput}
        />
        {#if searchError}
          <p class="text-sm text-destructive mt-1 flex items-center gap-1">
            <AlertCircle class="w-3 h-3" />
            {searchError}
          </p>
        {/if}
      </div>

      {#if error}
        <div
          in:slide
          class="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-4 rounded-md border border-destructive/20"
        >
          <AlertCircle class="w-4 h-4" />
          {error}
        </div>
      {:else if loading && filteredSessions.length === 0}
        <div class="grid gap-4">
          {#each Array(3) as _}
            <div class="p-4 rounded-lg border border-border bg-card space-y-3">
              <div class="flex justify-between">
                <Skeleton class="h-5 w-1/3" />
                <Skeleton class="h-5 w-20" />
              </div>
              <div class="flex gap-4">
                <Skeleton class="h-4 w-24" />
                <Skeleton class="h-4 w-24" />
              </div>
            </div>
          {/each}
        </div>
      {:else if !loading && filteredSessions.length === 0}
        <div
          in:fade
          class="text-center py-20 border border-dashed border-border rounded-lg"
        >
          <p class="text-muted-foreground">
            No sessions found matching your criteria.
          </p>
        </div>
      {:else}
        <div class="grid gap-4">
          {#each filteredSessions as session (session.id)}
            <div in:fade={{ duration: 200 }}>
              <a href={`/sessions/${session.id}`} class="group">
                <div
                  class="flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-lg border border-border bg-card hover:bg-accent/50 hover:border-primary/30 transition-all shadow-sm"
                >
                  <div class="flex-1 min-w-0 space-y-1">
                    <div class="flex items-center gap-2">
                      <h3
                        class="font-medium text-foreground truncate group-hover:text-primary transition-colors"
                      >
                        {session.title || "Untitled Session"}
                      </h3>
                    </div>
                    <div
                      class="flex items-center gap-4 text-sm text-muted-foreground"
                    >
                      <div class="flex items-center gap-1.5">
                        <Github class="w-3.5 h-3.5" />
                        <span class="truncate"
                          >{session.sourceContext?.source?.split("/").pop() ||
                            "Unknown Repo"}</span
                        >
                      </div>
                      <div class="flex items-center gap-1.5 truncate">
                        <History class="w-3.5 h-3.5" />
                        <span class="truncate"
                          >{session.sourceContext.githubRepoContext
                            ?.startingBranch || "Main"}</span
                        >
                      </div>
                    </div>
                  </div>

                  <div
                    class="flex items-center gap-4 sm:flex-col sm:items-end sm:gap-1 shrink-0"
                  >
                    <StatusConfig status_param={session.state} />
                    <span class="text-xs text-muted-foreground"
                      >{new Date(session.createTime).toLocaleString()}</span
                    >
                  </div>
                </div>
              </a>
            </div>
          {/each}
        </div>
      {/if}
    </div>
  </div>
</div>
