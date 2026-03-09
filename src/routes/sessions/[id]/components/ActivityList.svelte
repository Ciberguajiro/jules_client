<script lang="ts">
  import { Bot } from "lucide-svelte";
  import ScrollArea from "@/lib/components/ui/scroll-area/scroll-area.svelte";
  import ActivityItem from "./ActivityItem.svelte";
  import type { Activity } from "@/types";

  let { activities } = $props<{
    activities: Activity[];
  }>();

  let scrollRef = $state<HTMLDivElement | null>(null);

  $effect(() => {
    if (activities.length > 0 && scrollRef) {
      const scrollViewport = scrollRef.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollViewport) {
        scrollViewport.scrollTo({
          top: scrollViewport.scrollHeight,
          behavior: 'smooth'
        });
      }
    }
  });
</script>

<div class="w-full h-[calc(100vh-140px)]" bind:this={scrollRef}>
  <ScrollArea orientation="vertical" class="h-full px-4 lg:px-6">
    <div class="mx-auto  space-y-8 pb-10">
      {#each activities as activity}
        <ActivityItem {activity} />
      {/each}

      {#if activities.length === 0}
        <div class="flex flex-col items-center justify-center py-32 text-muted-foreground opacity-40">
          <div class="bg-muted p-6 rounded-full mb-6 ring-1 ring-border shadow-inner">
            <Bot class="h-12 w-12" />
          </div>
          <p class="text-sm font-bold tracking-tight uppercase">
            Start the conversation
          </p>
          <p class="text-[13px] mt-1 text-center ">
            Send a message to start work on this session.
          </p>
        </div>
      {/if}
    </div>
  </ScrollArea>
</div>
