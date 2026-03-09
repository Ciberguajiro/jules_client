<script lang="ts">
  import { cn } from "@/lib/utils";
  
  let { path }: { path: string } = $props<{
    path: string;
  }>();

  // Parse diff content into structured format
  function parseDiff(diffContent: string) {
    const lines = diffContent.split('\n');
    const files: Array<{
      header: string;
      hunks: Array<{
        header: string;
        lines: Array<{ type: 'unchanged' | 'added' | 'removed' | 'header', content: string }>;
      }>;
    }> = [];
    
    let currentFile: typeof files[number] | null = null;
    let currentHunk: typeof files[number]['hunks'][number] | null = null;

    for (const line of lines) {
      if (line.startsWith('diff --git')) {
        if (currentFile) files.push(currentFile);
        currentFile = { header: line, hunks: [] };
        currentHunk = null;
      } else if (line.startsWith('+++') || line.startsWith('---')) {
        if (currentFile) {
          currentFile.header += '\n' + line;
        }
      }  else if (line.startsWith('@@')) {
        if (currentFile) {
          currentHunk = { header: line, lines: [] };
          currentFile.hunks.push(currentHunk);
        }
      } else if (currentHunk) {
        const type = line.startsWith('+') ? 'added' : line.startsWith('-') ? 'removed' : line.startsWith(' ') ? 'unchanged' : 'header';
        currentHunk.lines.push({ type, content: line });
      }
    }
    
    if (currentFile) files.push(currentFile);
    return files;
  }

  let diffFiles = $derived(parseDiff(path));
</script>

<div class="space-y-4">
  {#each diffFiles as file}
    <div class="bg-background/50 border border-border/50 rounded-lg overflow-hidden">
      <div class="bg-muted/50 px-3 py-2 border-b border-border/50">
        <div class="text-xs font-mono text-muted-foreground">
          {#each file.header.split('\n') as headerLine}
            <div>{headerLine}</div>
          {/each}
        </div>
      </div>
      
      {#each file.hunks as hunk}
        <div class="border-b border-border/50 last:border-b-0">
          <div class="bg-muted/30 px-3 py-1 border-b border-border/50">
            <span class="text-xs font-mono text-muted-foreground">{hunk.header}</span>
          </div>
          
          <div class="font-mono text-[11px]">
            {#each hunk.lines as line,i}
              <div class={cn(
                'px-3 py-1',
                line.type === 'added' && 'bg-emerald-500/10 border-l-2 border-emerald-500/50',
                line.type === 'removed' && 'bg-rose-500/10 border-l-2 border-rose-500/50',
                line.type === 'unchanged' && 'bg-transparent',
                line.type === 'header' && 'bg-muted/50 text-muted-foreground'
              )}>
                <span class={cn(
                  'mr-2',
                  line.type === 'added' && 'text-emerald-400',
                  line.type === 'removed' && 'text-rose-400',
                  line.type === 'unchanged' && 'text-foreground/70',
                  line.type === 'header' && 'text-muted-foreground'
                )}>
                  {line.content.charAt(0)}
                </span>
                <span>{line.content.slice(1)}</span>
              </div>
            {/each}
          </div>
        </div>
      {/each}
    </div>
  {/each}
</div>



<style>
  .diff-line-added {
    background-color: rgba(34, 197, 94, 0.1);
    border-left: 2px solid rgba(34, 197, 94, 0.3);
  }
  
  .diff-line-removed {
    background-color: rgba(239, 68, 68, 0.1);
    border-left: 2px solid rgba(239, 68, 68, 0.3);
  }
  
  .diff-line-header {
    background-color: rgba(156, 163, 175, 0.1);
  }
</style>
