<script lang="ts">
  import { Plus, Loader, Github } from "lucide-svelte";
  import { Button } from "@/lib/components/ui/button";
  import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
  } from "@/lib/components/ui/dialog";
  import { Label } from "@/lib/components/ui/label";
  import { Textarea } from "@/lib/components/ui/textarea";
  import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
  } from "@/lib/components/ui/select";
  import { Input } from "@/lib/components/ui/input";
  import type { Source } from "@/types";
  import { invoke } from "@tauri-apps/api/core";
  import { Checkbox } from "@/lib/components/ui/checkbox";

  type Props = {
    sources: Source[];
    error: string | null;
    fetchSessions(): Promise<void>;
  };

  let { sources, error, fetchSessions }: Props = $props();

  let isDialogOpen = $state(false);
  let newSessionPrompt = $state("");
  let newSessionTitle = $state("");
  let selectedSource = $state<string>("");
  let requirePlanApproval = $state(false);
  let automation_mode = $state(false);
  let startingBranch = $state("");
  let creating = $state(false);

  async function createSession() {
    if (!newSessionPrompt || !selectedSource) return;

    creating = true;
    try {
      await invoke("post_session", {
        payload: {
          prompt: newSessionPrompt,
          title: newSessionTitle || undefined,
          requirePlanApproval,
          automationMode:"AUTO_CREATE_PR",
          sourceContext: {
            source: selectedSource,
            githubRepoContext: {
              startingBranch,
            },
          },
        },
      });
      onChangeOpen();
      newSessionPrompt = "";
      newSessionTitle = "";
      selectedSource = "";
      await fetchSessions();
    } catch (err) {
      console.error("Error creating session:", err);
      error = "Failed to create session. " + err;
    } finally {
      creating = false;
    }
  }

  function onChangeOpen() {
    isDialogOpen = !isDialogOpen;
    return isDialogOpen;
  }
</script>

<Dialog onOpenChange={onChangeOpen} bind:open={isDialogOpen}>
  <DialogTrigger>
    <Button
      size="sm"
      class="gap-2 shadow-sm"
      data-testid="button-new-session"
      onclick={onChangeOpen}
    >
      <Plus class="w-4 h-4" />
      New Session
    </Button>
  </DialogTrigger>
  <DialogContent class="sm:max-w-125">
    <DialogHeader>
      <DialogTitle>Create AI Session</DialogTitle>
      <DialogDescription>
        Start a new coding session with the Jules agent.
      </DialogDescription>
    </DialogHeader>
    <div class="grid gap-4 py-4">
      <div class="grid gap-2">
        <Label for="title">Session Title (Optional)</Label>
        <Input
          id="title"
          placeholder="e.g., Fix login button bug"
          bind:value={newSessionTitle}
        />
      </div>
      <div class="grid gap-2">
        <Label for="source">Source Repository</Label>
        <Select type="single" bind:value={selectedSource}>
          <SelectTrigger>
            {sources.find((s) => s.name === selectedSource)?.name ||
              "Select a repository"}
          </SelectTrigger>
          <SelectContent>
            {#each sources as source}
              <SelectItem value={source.name}>
                <div class="flex items-center gap-2">
                  <Github class="w-4 h-4" />
                  {source.githubRepo
                    ? `${source.githubRepo.owner}/${source.githubRepo.repo}`
                    : source.name}
                </div>
              </SelectItem>
            {/each}
          </SelectContent>
        </Select>
      </div>
      <div class="grid gap-2">
        <Label for="prompt">Prompt / Objective</Label>
        <Textarea
          id="prompt"
          placeholder="Describe what you want the agent to build or fix..."
          class="h-32 resize-none font-sans"
          bind:value={newSessionPrompt}
        />
      </div>
      <div class="grid gap-2">
        <Label for="require_plan_approval">Require Plan Approval</Label>
        <Checkbox
          id="require_plan_approval"
          bind:checked={requirePlanApproval}
        />
      </div>
      <div class="grid gap-2">
        <Label for="automation_mode">Automation Mode</Label>
        <Checkbox id="automation_mode" bind:checked={automation_mode} />
      </div>
      <div class="grid gap-2">
        <Label for="starting_branch">Starting Branch</Label>
        <Input
          id="starting_branch"
          placeholder="e.g., main, develop"
          bind:value={startingBranch}
        />
      </div>
    </div>
    <DialogFooter>
      <Button variant="outline" onclick={onChangeOpen}
        >Cancel</Button
      >
      <Button
        onclick={createSession}
        disabled={creating || !newSessionPrompt || !selectedSource}
      >
        {#if creating}
          <Loader class="w-4 h-4 animate-spin mr-2" />
          Creating...
        {:else}
          Create Session
        {/if}
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
