<script lang="ts">
  import { marked } from 'marked';
  import { cn } from '@/lib/utils';

  let { content, class: className = "" } = $props<{
    content: string;
    class?: string;
  }>();

  let html = $derived(marked.parse(content || ''));
</script>

<div class={cn("prose prose-sm dark:prose-invert max-w-none wrap-break-word", className)}>
  {@html html}
</div>

<style>
  :global(.prose pre) {
    background-color: #1a1a1a;
    padding: 1rem;
    border-radius: 0.5rem;
    overflow-x: auto;
  }
  :global(.prose code) {
    background-color: rgba(255, 255, 255, 0.1);
    padding: 0.2rem 0.4rem;
    border-radius: 0.25rem;
    font-size: 0.875em;
  }
  :global(.prose p) {
    margin-top: 0.5rem;
    margin-bottom: 0.5rem;
  }
  :global(.prose ul, .prose ol) {
    margin-top: 0.5rem;
    margin-bottom: 0.5rem;
    padding-left: 1.25rem;
  }
</style>
