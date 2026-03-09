<script lang="ts">
  import {
    User,
    Bot,
    Terminal,
    Code2,
    AlertCircle,
    CheckCircle2,
    ChevronsUpDownIcon,
    ChevronsDownIcon,
  } from "lucide-svelte";
  import { cn } from "@/lib/utils";
  import Markdown from "@/lib/components/Markdown.svelte";
  import ArtifactDisplay from "./ArtifactDisplay.svelte";
  import type { Activity } from "@/types";
  import {
    Collapsible,
    CollapsibleTrigger,
    CollapsibleContent,
  } from "@/lib/components/ui/collapsible";

  let { activity }: { activity: Activity } = $props<{
    activity: Activity;
  }>();

  let isUser = $derived(activity.originator === "user");
  let isAgent = $derived(activity.originator === "agent");
  let isSystem = $derived(activity.originator === "system");

  let timeString = $derived(
    new Date(activity.createTime).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    }),
  );
</script>

<div
  class={cn(
    "flex gap-4 group transition-opacity",
    isUser ? "flex-row-reverse" : "flex-row",
  )}
>
  <div
    class={cn(
      "w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-md ring-1 ring-border",
      isUser
        ? "bg-primary text-primary-foreground"
        : isAgent
          ? "bg-secondary text-secondary-foreground"
          : "bg-muted text-muted-foreground",
    )}
  >
    {#if isUser}
      <User class="h-5 w-5" />
    {:else if isAgent}
      <Bot class="h-5 w-5" />
    {:else}
      <Terminal class="h-5 w-5" />
    {/if}
  </div>

  <Collapsible
    class={cn(
      "flex flex-col gap-1.5 w-full",
      isUser ? "items-end" : "items-start",
    )}
  >
    <CollapsibleTrigger
      class="w-full flex flex-row items-center justify-between bg-gray-200 rounded-xl cursor-pointer px-2 py-1 "
    >
      <div class="flex items-center gap-2 px-1 text-xs">
        <span class="font-bold text-foreground/70">
          {isUser ? "You" : isAgent ? "Jules" : "System"}
        </span>
        <span class="text-[10px] text-muted-foreground tabular-nums">
          {timeString}
        </span>
      </div>
      <div>
        <ChevronsDownIcon />
        <span class="sr-only">Toggle</span>
      </div>
    </CollapsibleTrigger>

    <CollapsibleContent
      class={cn(
        "px-4 py-3 rounded-2xl text-[13.5px] shadow-sm ring-1 leading-relaxed",
        isUser
          ? "bg-primary text-primary-foreground ring-primary/20 rounded-tr-none"
          : isAgent
            ? "bg-card text-card-foreground ring-border/50 rounded-tl-none"
            : "bg-muted/50 text-muted-foreground ring-border/30 rounded-tl-none font-medium italic",
      )}
    >
      {#if activity.description && !activity.agentMessaged && !activity.userMessaged && !activity.progressUpdated}
        <Markdown content={activity.description} />
      {/if}

      {#if activity.agentMessaged}
        <Markdown content={activity.agentMessaged.agentMessage} />
      {/if}

      {#if activity.userMessaged}
        <Markdown content={activity.userMessaged.userMessage} />
      {/if}

      {#if activity.planApproved && activity.planApproved.plan}
        <ul class="space-y-2.5">
          {#each activity.planApproved.plan.steps as step}
            <li class="text-[12px] flex gap-3 group/step">
              <span class="text-white/70 font-bold font-mono min-w-[18px]">
                {(step.index ?? 0) + 1}.
              </span>
              <span class="text-white/90 leading-tight">{step.title}</span>
            </li>
          {/each}
        </ul>
      {/if}

      {#if activity.progressUpdated}
        <div class="space-y-2">
          <p class="font-bold text-primary flex items-center gap-2 text-sm">
            <span
              class="h-2 w-2 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(var(--primary),0.5)]"
            ></span>
            {activity.progressUpdated.title}
          </p>
          {#if activity.progressUpdated.description}
            <Markdown
              content={activity.progressUpdated.description}
              class="opacity-90 text-[13px]"
            />
          {/if}
        </div>
      {/if}

      {#if activity.planGenerated}
        <div
          class="mt-3 p-3.5 bg-muted/40 rounded-xl border border-border/40 shadow-inner"
        >
          <p
            class="font-bold text-xs mb-3 flex items-center gap-2 text-foreground/80"
          >
            <Code2 class="h-4 w-4 text-blue-500" /> Generated Plan
          </p>
          <ul class="space-y-2.5">
            {#each activity.planGenerated.plan.steps as step}
              <li class="text-[12px] flex gap-3 group/step">
                <span class="text-primary/70 font-bold font-mono min-w-[18px]">
                  {(step.index ?? 0) + 1}.
                </span>
                <span class="text-foreground/90 leading-tight"
                  >{step.title}</span
                >
              </li>
            {/each}
          </ul>
        </div>
      {/if}

      {#if activity.sessionCompleted}
        <div class="flex items-center gap-2 py-1 text-emerald-500 font-bold">
          <CheckCircle2 class="h-4 w-4" />
          Session Completed Successfully
        </div>
      {/if}

      {#if activity.sessionFailed}
        <div class="space-y-2 py-1">
          <div class="flex items-center gap-2 text-rose-500 font-bold">
            <AlertCircle class="h-4 w-4" />
            Session Failed
          </div>
          <p class="text-xs text-rose-400 font-medium ml-6">
            {activity.sessionFailed.reason}
          </p>
        </div>
      {/if}

      {#if activity.artifacts && activity.artifacts.length > 0}
        <div class="mt-3 space-y-1">
          {#each activity.artifacts as artifact}
            <ArtifactDisplay {artifact} />
          {/each}
        </div>
      {/if}
    </CollapsibleContent>
  </Collapsible>
</div>
