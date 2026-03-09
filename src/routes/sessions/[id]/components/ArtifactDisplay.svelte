<script lang="ts">
  import { Terminal, GitBranch, ChevronDown, ChevronUp } from "lucide-svelte";
  import { Badge } from "@/lib/components/ui/badge";
  import { Button } from "@/lib/components/ui/button";
  import { cn } from "@/lib/utils";
  import type { Artifact } from "@/types";
  import DiffPatch from "@/lib/components/DiffPatch.svelte";

  let { artifact }: { artifact: Artifact } = $props<{
    artifact: Artifact;
  }>();

  let isExpanded = $state(false);
</script>

{#if artifact.bashOutput}
  <div
    class="rounded-lg overflow-hidden border border-border/50 bg-[#0d1117] my-2"
  >
    <div
      class="flex items-center justify-between px-3 py-1.5 bg-muted/10 border-b border-border/50"
    >
      <div class="flex items-center gap-2 overflow-hidden">
        <Terminal class="h-3.5 w-3.5 text-blue-400 shrink-0" />
        <span
          class="text-[10px] font-mono text-muted-foreground truncate"
          title={artifact.bashOutput.command}
        >
          {artifact.bashOutput.command}
        </span>
      </div>
      <div class="flex items-center gap-2 shrink-0">
        <Badge
          variant="outline"
          class={cn(
            "text-[9px] px-1.5 h-4 font-mono",
            artifact.bashOutput.exitCode === 0
              ? "text-emerald-500 border-emerald-500/20 bg-emerald-500/5"
              : "text-rose-500 border-rose-500/20 bg-rose-500/5",
          )}
        >
          exit {artifact.bashOutput.exitCode}
        </Badge>
        <Button
          variant="ghost"
          size="icon"
          class="h-5 w-5 text-muted-foreground"
          onclick={() => (isExpanded = !isExpanded)}
        >
          {#if isExpanded}
            <ChevronUp class="h-3 w-3" />
          {:else}
            <ChevronDown class="h-3 w-3" />
          {/if}
        </Button>
      </div>
    </div>
    <div
      class={cn(
        "overflow-hidden transition-all",
        isExpanded ? "max-h-125 overflow-y-auto" : "max-h-25",
      )}
    >
      <pre
        class="p-3 text-[11px] font-mono text-slate-300 overflow-x-auto whitespace-pre-wrap"><code
          >{artifact.bashOutput.output}</code
        ></pre>
    </div>
    {#if !isExpanded && artifact.bashOutput.output.split("\n").length > 5}
      <button
        class="w-full py-1 text-[10px] text-center text-muted-foreground bg-muted/5 border-t border-border/50 hover:bg-muted/10 transition-colors"
        onclick={() => (isExpanded = true)}
      >
        Show more...
      </button>
    {/if}
  </div>
{/if}

{#if artifact.changeSet}
  <div
    class="rounded-lg max-w-[60svw] border border-border/50 bg-muted/30 p-3 my-2 shadow-sm"
  >
    <div
      class="flex items-center gap-2 text-xs font-semibold mb-2 text-foreground/80"
    >
      <GitBranch class="h-3.5 w-3.5 text-orange-400" />
      {artifact.changeSet.source}
    </div>
    <div class="relative group">
    <DiffPatch path={artifact.changeSet.gitPatch.unidiffPatch} />
    </div>
  </div>
{/if}
