<script lang="ts">
  import { Button } from "@/lib/components/ui/button";
  import { Input } from "@/lib/components/ui/input";
  import { Label } from "@/lib/components/ui/label";
  import { invoke } from "@tauri-apps/api/core";
  import { Key, Save, CheckCircle2, AlertCircle } from "lucide-svelte";
  import { onMount } from "svelte";

  let apiKey = $state("");
  let saving = $state(false);
  let success = $state(false);
  let error = $state<string | null>(null);
  let isApiKeySet = $state(false);

  onMount(async () => {
    isApiKeySet = await invoke<boolean>("get_api_key_status");
  });

  async function handleSave() {
    if (!apiKey.trim()) return;

    saving = true;
    error = null;
    success = false;

    try {
      await invoke("set_api_key", { key: apiKey.trim() });
      success = true;
      setTimeout(() => { success = false; }, 3000);
    } catch (err) {
      console.error("Error saving API key:", err);
      error = "Failed to save API key. Please try again.";
    } finally {
      saving = false;
    }
  }
</script>

<div class="flex-1 flex flex-col h-full bg-background">
  <div class="h-14 border-b border-border flex items-center px-6 shrink-0">
    <h1 class="font-semibold text-lg">Settings</h1>
  </div>

  <div class="p-6 flex-1 overflow-auto">
    <div class="max-w-2xl mx-auto space-y-8">
      <section class="space-y-4">
        <div>
          <h2 class="text-xl font-medium">Authentication</h2>
          <p class="text-sm text-muted-foreground mt-1">
            Configure your Jules API key to interact with the services.
          </p>
        </div>

        <div class="p-6 rounded-lg border border-border bg-card space-y-4">
          <div class="space-y-4">
            <div class="flex items-center justify-between">
              <Label for="api-key" class="flex items-center gap-2">
                <Key class="w-4 h-4" />
                Jules API Key
              </Label>
              {#if isApiKeySet}
                <div class="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                   <CheckCircle2 class="w-3 h-3" />
                   Configured
                </div>
              {:else}
                <div class="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                   <AlertCircle class="w-3 h-3" />
                   Not Set
                </div>
              {/if}
            </div>
            <div class="flex gap-2">
              <Input
                id="api-key"
                type="password"
                placeholder={isApiKeySet ? "••••••••••••••••" : "Enter your API key..."}
                bind:value={apiKey}
                class="bg-background"
              />
              <Button onclick={handleSave} disabled={saving || !apiKey.trim()} class="shrink-0">
                {#if saving}
                  <span class="animate-spin mr-2">...</span>
                {/if}
                <Save class="w-4 h-4 mr-2" />
                Save Key
              </Button>
            </div>
          </div>

          {#if success}
            <div class="flex items-center gap-2 text-sm text-emerald-500 bg-emerald-500/10 p-3 rounded-md">
              <CheckCircle2 class="w-4 h-4" />
              API key saved successfully!
            </div>
          {/if}

          {#if error}
            <div class="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-md">
              <AlertCircle class="w-4 h-4" />
              {error}
            </div>
          {/if}

          <div class="text-xs text-muted-foreground">
            <p>Your API key is stored locally on your machine and is only used to authenticate requests to the Jules API.</p>
          </div>
        </div>
      </section>

      <section class="space-y-4 opacity-50 pointer-events-none">
        <div>
          <h2 class="text-xl font-medium text-muted-foreground">General Settings</h2>
          <p class="text-sm text-muted-foreground mt-1">
            Other application preferences (Coming soon).
          </p>
        </div>
        <div class="p-6 rounded-lg border border-border bg-card/50">
           <p class="text-sm italic">Additional settings will be available in future updates.</p>
        </div>
      </section>
    </div>
  </div>
</div>
