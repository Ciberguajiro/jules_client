<script lang="ts">
  import Badge from "@/lib/components/ui/badge/badge.svelte";
  import { getStatusConfig } from "@/lib/status_config";
  import { cn } from "@/lib/utils";

  type Props = {
    status_param: string;
  };

  let { status_param }: Props = $props();

  const status = $derived(getStatusConfig(status_param));
  const StatusIcon = $derived(status.icon);
</script>

<Badge variant="outline" class={cn("font-medium", status.bg, status.color)}>
  <StatusIcon class="w-3 h-3 mr-1.5" />
  {status.label}
</Badge>
