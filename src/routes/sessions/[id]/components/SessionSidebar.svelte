<script lang="ts">
  import {
    GitBranch,
    Clock,
    Link,
    Terminal,
    CheckCircle2,
  } from "lucide-svelte";
  import { Badge } from "@/lib/components/ui/badge";
  import { Button } from "@/lib/components/ui/button";
  import { Separator } from "@/lib/components/ui/separator";
  import ScrollArea from "@/lib/components/ui/scroll-area/scroll-area.svelte";
  import Markdown from "@/lib/components/Markdown.svelte";
  import type { SessionById } from "@/types";

  let { session }: { session: SessionById } = $props<{
    session: SessionById;
  }>();

  let branch = $derived(
    session.sourceContext.githubRepoContext?.startingBranch || "main",
  );
</script>

<ScrollArea class="h-full">
  <div class="p-4 space-y-6">
    <div class="space-y-4">
      <h3
        class="text-xs font-semibold text-sidebar-foreground uppercase tracking-wider"
      >
        Details
      </h3>
      <div class="grid gap-3 text-sm">
        <div class="flex items-center justify-between">
          <span class="text-muted-foreground">Status</span>
          <span class="font-medium text-primary capitalize">
            {session.state.toLowerCase().replace(/_/g, " ")}
          </span>
        </div>
        <div class="flex items-center justify-between">
          <span class="text-muted-foreground flex items-center gap-1.5">
            <GitBranch class="h-3.5 w-3.5" /> Branch
          </span>
          <span class="font-medium text-foreground">{branch}</span>
        </div>
        <div class="flex items-center justify-between">
          <span class="text-muted-foreground flex items-center gap-1.5">
            <Clock class="h-3.5 w-3.5" /> Created
          </span>
          <span class="font-medium text-foreground">
            {new Date(session.createTime).toLocaleDateString()}
          </span>
        </div>
        {#if session.url}
          <div class="flex items-center justify-between">
            <span class="text-muted-foreground flex items-center gap-1.5">
              <Link class="h-3.5 w-3.5" /> Web Link
            </span>
            <a
              href={session.url}
              target="_blank"
              class="font-medium text-primary hover:underline"
            >
              Open in Jules
            </a>
          </div>
        {/if}
      </div>
    </div>

    <Separator />

    <div class="space-y-3">
      <h3
        class="text-xs font-semibold text-sidebar-foreground uppercase tracking-wider"
      >
        Original Prompt
      </h3>
      <ul
        class="rounded-lg border border-border bg-muted/30 p-3 text-xs leading-relaxed flex flex-col"
      >
        {#each session.prompt.split("\n") as promt}
          <li>
            {promt}
          </li>
        {/each}
      </ul>
    </div>

    <Separator />

    <div class="space-y-4">
      <h3
        class="text-xs font-semibold text-sidebar-foreground uppercase tracking-wider"
      >
        Outputs
      </h3>
      {#if !session.outputs || session.outputs.length === 0}
        <p class="text-xs text-muted-foreground italic px-1">
          No outputs generated yet.
        </p>
      {:else}
        <div class="space-y-3">
          {#each session.outputs as output}
            {#if output.pullRequest}
              <div
                class="rounded-lg border border-border bg-card p-3 space-y-2.5 shadow-sm transition-all hover:border-primary/50"
              >
                <div class="flex items-center justify-between">
                  <h4
                    class="text-[10px] font-bold flex items-center gap-1.5 uppercase tracking-tighter text-muted-foreground"
                  >
                    <GitBranch class="h-3.5 w-3.5" /> Pull Request
                  </h4>
                  <Badge variant="secondary" class="text-[9px] px-1.5 h-4">
                    {output.pullRequest.baseRef}
                  </Badge>
                </div>
                <p class="text-xs font-semibold line-clamp-2 leading-snug">
                  {output.pullRequest.title}
                </p>
                {#if output.pullRequest.description}
                  <Markdown
                    content={output.pullRequest.description}
                    class="text-[11px] line-clamp-2 opacity-70"
                  />
                {/if}
                <a
                  href={output.pullRequest.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  class="block mt-1"
                >
                  <Button
                    variant="outline"
                    size="sm"
                    class="w-full h-8 text-xs font-medium"
                  >
                    View on GitHub
                  </Button>
                </a>
              </div>
            {/if}
            {#if output.changeSet}
              <div
                class="rounded-lg border border-border bg-card p-3 space-y-2.5 shadow-sm"
              >
                <div class="flex items-center gap-1.5">
                  <CheckCircle2 class="h-3.5 w-3.5 text-emerald-500" />
                  <span
                    class="text-[10px] font-bold uppercase tracking-tighter text-muted-foreground"
                    >Changes Ready</span
                  >
                </div>
                <p class="text-[11px] text-muted-foreground">
                  The agent has suggested some changes in <b
                    >{output.changeSet.source}</b
                  >.
                </p>
              </div>
            {/if}
          {/each}
        </div>
      {/if}
    </div>
  </div>
</ScrollArea>
