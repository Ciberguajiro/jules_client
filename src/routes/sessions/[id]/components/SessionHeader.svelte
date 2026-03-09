<script lang="ts">
  import { cn } from "@/lib/utils";
  import { ArrowLeft, Check, Square, MoreVertical, Trash2, Loader2, GitBranch, Clock } from "lucide-svelte";
  import { Button } from "@/lib/components/ui/button";
  import { Badge } from "@/lib/components/ui/badge";
  import { Separator } from "@/lib/components/ui/separator";
  import * as Dialog from "@/lib/components/ui/dialog";
  import type { SessionById } from "@/types";

  let {
    session,
    isPlanApproved,
    onApprovePlan,
    onDeleteSession
  } = $props<{
    session: SessionById;
    isPlanApproved: boolean;
    onApprovePlan: () => Promise<void>;
    onDeleteSession: () => Promise<void>;
  }>();

  let isApproving = $state(false);
  let isDeleting = $state(false);
  let showDeleteDialog = $state(false);

  async function handleApprove() {
    isApproving = true;
    try {
      await onApprovePlan();
    } finally {
      isApproving = false;
    }
  }

  async function handleDelete() {
    isDeleting = true;
    try {
      await onDeleteSession();
    } finally {
      isDeleting = false;
      showDeleteDialog = false;
    }
  }
</script>

<header
  class="h-14 border-b border-border flex items-center justify-between px-4 shrink-0 bg-card/50 backdrop-blur-md sticky top-0 z-20"
>
  <div class="flex items-center gap-4">
    <a href="/sessions">
      <Button
        variant="ghost"
        size="icon"
        class="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted"
      >
        <ArrowLeft class="h-4 w-4" />
      </Button>
    </a>
    <Separator orientation="vertical" class="h-6" />
    <div class="flex flex-col">
      <div class="flex items-center gap-2">
        <h1 class="font-semibold text-sm truncate max-w-[200px] sm:max-w-md">
          {session.title || "Untitled Session"}
        </h1>
        <Badge
          variant="outline"
          class={cn(
            "text-[10px] py-0 h-4",
            ["AWAITING_PLAN_APPROVAL", "AWAITING_USER_FEEDBACK", "QUEUED"].includes(session.state)
              ? "bg-amber-400/10 text-amber-500 border-amber-400/20"
              : session.state === "COMPLETED"
                ? "bg-emerald-400/10 text-emerald-500 border-emerald-400/20"
                : session.state === "FAILED"
                  ? "bg-rose-400/10 text-rose-500 border-rose-400/20"
                  : "bg-blue-400/10 text-blue-500 border-blue-400/20",
          )}
        >
          {session.state.replace("STATE_", "").replace(/_/g, " ")}
        </Badge>
      </div>
      <div class="flex items-center gap-3 text-xs text-muted-foreground">
        <span class="flex items-center gap-1">
          <GitBranch class="h-3 w-3" />
          {session.sourceContext?.source || "Unknown Repo"}
        </span>
        <span class="flex items-center gap-1">
          <Clock class="h-3 w-3" />
          {new Date(session.createTime).toLocaleString() || "recently"}
        </span>
      </div>
    </div>
  </div>

  <div class="flex items-center gap-2">
    {#if !isPlanApproved}
      <Button
        size="sm"
        class="gap-2 bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm"
        onclick={handleApprove}
        disabled={isApproving}
      >
        {#if isApproving}
          <Loader2 class="h-4 w-4 animate-spin" />
        {:else}
          <Check class="h-4 w-4" />
        {/if}
        Approve Plan
      </Button>
    {/if}

    <Dialog.Root bind:open={showDeleteDialog}>
      <Dialog.Trigger>
        <Button variant="ghost" size="icon" class="h-8 w-8 text-muted-foreground hover:text-destructive">
          <Trash2 class="h-4 w-4" />
        </Button>
      </Dialog.Trigger>
      <Dialog.Content>
        <Dialog.Header>
          <Dialog.Title>Delete Session</Dialog.Title>
          <Dialog.Description>
            Are you sure you want to delete this session? This action cannot be undone.
          </Dialog.Description>
        </Dialog.Header>
        <Dialog.Footer>
          <Button variant="outline" onclick={() => (showDeleteDialog = false)}>Cancel</Button>
          <Button variant="destructive" onclick={handleDelete} disabled={isDeleting}>
            {#if isDeleting}
              <Loader2 class="h-4 w-4 animate-spin mr-2" />
            {/if}
            Delete
          </Button>
        </Dialog.Footer>
      </Dialog.Content>
    </Dialog.Root>

    <Button variant="ghost" size="icon" class="h-8 w-8 text-muted-foreground">
      <MoreVertical class="h-4 w-4" />
    </Button>
  </div>
</header>
