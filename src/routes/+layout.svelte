<script lang="ts">
  import {
    TerminalSquare,
    LayoutList,
    GitBranch,
    Activity,
    Settings,
    LogOut,
    FolderGit2,
  } from "lucide-svelte";
  import { cn } from "@/lib/utils";
  import { Button } from "@/lib/components/ui/button";
  import { page } from "$app/state";
  import { invoke } from "@tauri-apps/api/core";
  import { goto } from "$app/navigation";
  import { onMount } from "svelte";
  import { check } from "@tauri-apps/plugin-updater";
  import { info, error as logError } from "@tauri-apps/plugin-log";

  let { children } = $props();
  let checkedStatus = $state(false);

  onMount(async () => {
    const isApiKeySet = await invoke<boolean>("get_api_key_status");
    if (!isApiKeySet && page.url.pathname !== "/settings") {
      goto("/settings");
    }
    checkedStatus = true;

    // Check for updates
    try {
      const update = await check();
      if (update) {
        info(`Found update ${update.version} from ${update.date} with notes: ${update.body}`);
        // In a real app, you'd show a dialog to the user here.
      } else {
        info("No updates found.");
      }
    } catch (e) {
      logError(`Failed to check for updates: ${e}`);
    }
  });

  const navItems = [
    { name: "Sessions", path: "/sessions", icon: LayoutList, aliases: ["/"] },
    { name: "Sources", path: "/sources", icon: FolderGit2 },
    { name: "Activities", path: "/activities", icon: Activity },
    { name: "Settings", path: "/settings", icon: Settings },
  ];

  const currentPath = $derived(page.url.pathname);
</script>

<div class="flex h-screen overflow-hidden bg-background">
  <aside
    class="w-64 border-r border-border bg-sidebar flex flex-col flex-shrink-0"
  >
    <div class="h-14 flex items-center px-4 border-b border-border">
      <a href="/">
        <div
          class="flex items-center gap-2 font-semibold text-sidebar-foreground cursor-pointer transition-opacity hover:opacity-80"
        >
          <TerminalSquare class="w-5 h-5 text-primary" />
          <span>Jules Client</span>
        </div>
      </a>
    </div>

    <div class="flex-1 overflow-y-auto py-4">
      <nav class="space-y-1 px-2">
        {#each navItems as item}
          {@const Component = item.icon}
          <a href={item.path}>
            <div
              class={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium cursor-pointer transition-colors",
                currentPath === item.path ||
                  (item.aliases && item.aliases.includes(currentPath))
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
              )}
              data-testid={`nav-${item.name.toLowerCase()}`}
            >
              <Component class="w-4 h-4" />
              {item.name}
            </div>
          </a>
        {/each}
      </nav>
    </div>

    <div class="p-4 border-t border-border">
      <div class="flex items-center gap-3 mb-4 px-2">
        <div
          class="w-8 h-8 rounded-full bg-secondary flex items-center justify-center"
        >
          <GitBranch class="w-4 h-4 text-secondary-foreground" />
        </div>
        <div class="flex flex-col">
          <span class="text-xs font-medium leading-none">Developer</span>
          <span class="text-[10px] text-muted-foreground mt-1">Connected</span>
        </div>
      </div>
      <a href="/login">
        <Button
          variant="ghost"
          class="w-full justify-start text-muted-foreground hover:text-foreground"
          size="sm"
        >
          <LogOut class="w-4 h-4 mr-2" />
          Disconnect
        </Button>
      </a>
    </div>
  </aside>

  <main class="flex-1 flex flex-col min-w-0 bg-background">
    {#if checkedStatus}
      {@render children()}
    {:else}
      <div class="flex-1 flex items-center justify-center">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    {/if}
  </main>
</div>
