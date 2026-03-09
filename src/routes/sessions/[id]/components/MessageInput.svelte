<script lang="ts">
  import { Send, Loader2 } from "lucide-svelte";
  import { Button } from "@/lib/components/ui/button";
  import { Textarea } from "@/lib/components/ui/textarea";

  let { onSendMessage } = $props<{
    onSendMessage: (message: string) => Promise<void>;
  }>();

  let inputMessage = $state("");
  let isSending = $state(false);

  async function handleSend() {
    if (!inputMessage.trim() || isSending) return;

    const msg = inputMessage;
    inputMessage = "";
    isSending = true;
    try {
      await onSendMessage(msg);
    } catch (err) {
      console.error("Failed to send message:", err);
      inputMessage = msg; // Restore message on failure
    } finally {
      isSending = false;
    }
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }
</script>

<div class="p-4 border-t border-border bg-card/30 backdrop-blur-md">
  <div class=" mx-auto relative flex items-end gap-3">
    <div class="relative flex-1 group">
      <Textarea
        placeholder="Send a message to the agent..."
        class="min-h-[60px] max-h-[200px] bg-background/80 shadow-inner resize-none pr-12 pb-3 pt-3 font-sans transition-all focus:ring-2 focus:ring-primary/20 border-border/60 hover:border-border"
        bind:value={inputMessage}
        onkeydown={handleKeyDown}
        disabled={isSending}
      />
      <div class="absolute right-3 bottom-3 flex items-center gap-2">
         {#if inputMessage.length > 0}
           <span class="text-[10px] text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded border border-border/50 opacity-0 group-focus-within:opacity-100 transition-opacity">
             Enter to send
           </span>
         {/if}
         <Button
            size="icon"
            class="h-8 w-8 shadow-md transition-all active:scale-90 hover:shadow-lg"
            disabled={!inputMessage.trim() || isSending}
            onclick={handleSend}
          >
            {#if isSending}
              <Loader2 class="h-4 w-4 animate-spin" />
            {:else}
              <Send class="h-4 w-4" />
            {/if}
          </Button>
      </div>
    </div>
  </div>
</div>
