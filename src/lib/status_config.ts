import {
  PlayCircle,
  CheckCircle2,
  XCircle,
  Clock,
  Activity,
  PauseCircle,
  AlertCircle,
} from "lucide-svelte";

export const getStatusConfig = (status: string) => {
  switch (status) {
    case "IN_PROGRESS":
    case "PLANNING":
      return {
        icon: PlayCircle,
        color: "text-blue-400",
        bg: "bg-blue-400/10 border-blue-400/20",
        label: status === "PLANNING" ? "Planning" : "Running",
      };
    case "AWAITING_PLAN_APPROVAL":
    case "AWAITING_USER_FEEDBACK":
    case "QUEUED":
      return {
        icon: Clock,
        color: "text-amber-400",
        bg: "bg-amber-400/10 border-amber-400/20",
        label: status === "AWAITING_PLAN_APPROVAL" ? "Needs Approval" :
               status === "AWAITING_USER_FEEDBACK" ? "Waiting for you" : "Queued",
      };
    case "COMPLETED":
      return {
        icon: CheckCircle2,
        color: "text-emerald-400",
        bg: "bg-emerald-400/10 border-emerald-400/20",
        label: "Completed",
      };
    case "FAILED":
      return {
        icon: XCircle,
        color: "text-rose-400",
        bg: "bg-rose-400/10 border-rose-400/20",
        label: "Failed",
      };
    case "PAUSED":
      return {
        icon: PauseCircle,
        color: "text-slate-400",
        bg: "bg-slate-400/10 border-slate-400/20",
        label: "Paused",
      };
    default:
      return {
        icon: Activity,
        color: "text-muted-foreground",
        bg: "bg-muted border-border",
        label: status || "Unknown",
      };
  }
};
