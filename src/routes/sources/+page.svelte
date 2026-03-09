<script lang="ts">
  import { cn } from "@/lib/utils";
  import { FolderGit2, RefreshCw, Github, ExternalLink, Loader2, AlertCircle } from "lucide-svelte";
  import { Button } from "@/lib/components/ui/button";
  import { Input } from "@/lib/components/ui/input";
  import { invoke } from "@tauri-apps/api/core";
  import { onMount } from "svelte";

  let sources = $state<any[]>([]);
  let loading = $state(true);
  let error = $state<string | null>(null);
  let filter = $state("");

  async function fetchSources() {
    loading = true;
    error = null;
    try {
      const data = await invoke<any>("get_sources");
      // Adjust according to the actual API response structure
      sources = Array.isArray(data) ? data : (data.sources || []);
    } catch (err) {
      console.error("Error fetching sources:", err);
      error = "Failed to load sources. " + err;
    } finally {
      loading = false;
    }
  }

  onMount(fetchSources);

  const filteredSources = $derived(
    sources.filter(s => {
      const name = s.githubRepo ? `${s.githubRepo.owner}/${s.githubRepo.repo}` : (s.name || '');
      return name.toLowerCase().includes(filter.toLowerCase());
    })
  );
</script>

<div class="flex-1 flex flex-col h-full bg-background">
  <div class="h-14 border-b border-border flex items-center justify-between px-6 shrink-0 bg-background">
    <h1 class="font-semibold text-lg">Connected Sources</h1>
    <Button size="sm" class="gap-2">
      <FolderGit2 class="w-4 h-4" />
      Add Repository
    </Button>
  </div>

  <div class="p-6 flex-1 overflow-auto bg-background">
    <div class="mx-auto space-y-6">
      <div class="flex items-center gap-4">
        <Input
          placeholder="Filter repositories..."
          bind:value={filter}
          class="max-w-md bg-card"
        />
        <Button variant="outline" size="icon" title="Sync all" onclick={fetchSources} disabled={loading}>
          <RefreshCw class={cn("h-4 w-4 text-muted-foreground", loading && "animate-spin")} />
        </Button>
      </div>

      {#if loading}
        <div class="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <Loader2 class="h-8 w-8 animate-spin mb-4" />
          <p>Fetching repositories...</p>
        </div>
      {:else if error}
        <div class="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-4 rounded-md border border-destructive/20">
          <AlertCircle class="w-4 h-4" />
          {error}
        </div>
      {:else if filteredSources.length === 0}
        <div class="text-center py-12 border border-dashed border-border rounded-lg">
          <p class="text-muted-foreground">No repositories found.</p>
        </div>
      {:else}
        <div class="grid gap-4">
          {#each filteredSources as source}
            <div class="flex items-center justify-between p-4 rounded-lg border border-border bg-card hover:border-primary/50 transition-colors">
              <div class="flex items-center gap-4">
                <div class="p-2 rounded-md bg-primary/10">
                  <Github class="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 class="font-medium flex items-center gap-2">
                    {source.githubRepo ? `${source.githubRepo.owner}/${source.githubRepo.repo}` : source.name}
                  </h3>
                  <p class="text-sm text-muted-foreground flex items-center gap-2 mt-0.5">
                    Last synced: {source.syncTime || 'Never'}
                  </p>
                </div>
              </div>

              <div class="flex items-center gap-2">
                <Button variant="ghost" size="sm" class="hidden sm:flex">
                  <RefreshCw class="h-4 w-4 mr-2" /> Sync
                </Button>
                <Button variant="ghost" size="icon">
                  <ExternalLink class="h-4 w-4 text-muted-foreground" />
                </Button>
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </div>
  </div>
</div>
