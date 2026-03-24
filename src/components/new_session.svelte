<script lang="ts">
  import { Plus, Loader, Github, AlertCircle } from "lucide-svelte";
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
  import { 
    validateSessionTitle, 
    validateSessionPrompt, 
    validateBranchName 
  } from "@/lib/validation";
  import { ErrorHandler, withErrorHandling } from "@/lib/error-handler";
  import { log } from "@/lib/logger";

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
  let validationErrors = $state<Record<string, string>>({});

  function validateForm(): boolean {
    const errors: Record<string, string> = {};
    
    // Validate prompt
    const promptValidation = validateSessionPrompt(newSessionPrompt);
    if (!promptValidation.valid) {
      errors.prompt = promptValidation.error!;
    }
    
    // Validate title
    const titleValidation = validateSessionTitle(newSessionTitle);
    if (!titleValidation.valid) {
      errors.title = titleValidation.error!;
    }
    
    // Validate branch
    const branchValidation = validateBranchName(startingBranch);
    if (!branchValidation.valid) {
      errors.branch = branchValidation.error!;
    }
    
    // Check if source is selected
    if (!selectedSource) {
      errors.source = "Please select a repository";
    }
    
    validationErrors = errors;
    return Object.keys(errors).length === 0;
  }

  async function createSession() {
    if (!validateForm()) {
      log.warn('Form validation failed', { validationErrors });
      return;
    }

    creating = true;
    const startTime = Date.now();
    
    const safeCreate = withErrorHandling(async () => {
      log.userAction('create_session_attempt', {
        hasTitle: !!newSessionTitle,
        hasPrompt: !!newSessionPrompt,
        selectedSource,
        requirePlanApproval,
        automation_mode
      });
      
      const promptValidation = validateSessionPrompt(newSessionPrompt);
      const titleValidation = validateSessionTitle(newSessionTitle);
      const branchValidation = validateBranchName(startingBranch);
      
      log.apiCall('POST', '/sessions');
      
      await invoke("post_session", {
        payload: {
          prompt: promptValidation.sanitized || newSessionPrompt,
          title: titleValidation.sanitized || newSessionTitle,
          requirePlanApproval,
          automationMode: automation_mode ? "AUTO_CREATE_PR" : undefined,
          sourceContext: {
            source: selectedSource,
            githubRepoContext: {
              startingBranch: branchValidation.sanitized || startingBranch || "main",
            },
          },
        },
      });
      
      const duration = Date.now() - startTime;
      log.apiResponse('POST', '/sessions', 200, duration);
      log.sessionEvent('created', 'new', { duration, source: selectedSource });
      
      onChangeOpen();
      resetForm();
      await fetchSessions();
    }, (appError) => {
      const duration = Date.now() - startTime;
      log.apiResponse('POST', '/sessions', 0, duration);
      log.error('Failed to create session', appError.originalError, { duration });
      error = ErrorHandler.getUserMessage(appError);
    });

    await safeCreate();
    creating = false;
  }

  function resetForm() {
    newSessionPrompt = "";
    newSessionTitle = "";
    selectedSource = "";
    startingBranch = "";
    requirePlanApproval = false;
    automation_mode = false;
    validationErrors = {};
  }

  function onChangeOpen() {
    isDialogOpen = !isDialogOpen;
    if (!isDialogOpen) {
      resetForm();
    }
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
          class={validationErrors.title ? 'border-destructive' : ''}
        />
        {#if validationErrors.title}
          <p class="text-sm text-destructive flex items-center gap-1">
            <AlertCircle class="w-3 h-3" />
            {validationErrors.title}
          </p>
        {/if}
      </div>
      <div class="grid gap-2">
        <Label for="source">Source Repository</Label>
        <Select type="single" bind:value={selectedSource}>
          <SelectTrigger class={validationErrors.source ? 'border-destructive' : ''}>
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
        {#if validationErrors.source}
          <p class="text-sm text-destructive flex items-center gap-1">
            <AlertCircle class="w-3 h-3" />
            {validationErrors.source}
          </p>
        {/if}
      </div>
      <div class="grid gap-2">
        <Label for="prompt">Prompt / Objective</Label>
        <Textarea
          id="prompt"
          placeholder="Describe what you want the agent to build or fix..."
          class="h-32 resize-none font-sans {validationErrors.prompt ? 'border-destructive' : ''}"
          bind:value={newSessionPrompt}
        />
        {#if validationErrors.prompt}
          <p class="text-sm text-destructive flex items-center gap-1">
            <AlertCircle class="w-3 h-3" />
            {validationErrors.prompt}
          </p>
        {/if}
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
          class={validationErrors.branch ? 'border-destructive' : ''}
        />
        {#if validationErrors.branch}
          <p class="text-sm text-destructive flex items-center gap-1">
            <AlertCircle class="w-3 h-3" />
            {validationErrors.branch}
          </p>
        {/if}
      </div>
    </div>
    <DialogFooter>
      <Button variant="outline" onclick={onChangeOpen}
        >Cancel</Button
      >
      <Button
        onclick={createSession}
        disabled={creating || Object.keys(validationErrors).length > 0}
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
