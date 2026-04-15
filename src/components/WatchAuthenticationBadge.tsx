import { ShieldCheck, ShieldAlert, Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface WatchAuthenticationBadgeProps {
  status?: string;
  method?: string;
  authenticatedAt?: string;
}

export function WatchAuthenticationBadge({ status, method, authenticatedAt }: WatchAuthenticationBadgeProps) {
  if (!status || status === "unverified") return null;

  const config = {
    authenticated: {
      icon: ShieldCheck,
      label: "Authenticated",
      variant: "default" as const,
      className: "bg-green-600 hover:bg-green-700 text-white",
      tooltip: `Verified ${method === "manual" ? "by expert" : "via AI"}${authenticatedAt ? ` on ${new Date(authenticatedAt).toLocaleDateString()}` : ""}`,
    },
    partial: {
      icon: ShieldAlert,
      label: "Partially Verified",
      variant: "secondary" as const,
      className: "bg-amber-500/20 text-amber-700 dark:text-amber-400 border-amber-500/30",
      tooltip: "Authenticated with replaced parts noted",
    },
    rejected: {
      icon: Shield,
      label: "Not Authenticated",
      variant: "destructive" as const,
      className: "",
      tooltip: "Authentication failed — item could not be verified",
    },
  };

  const cfg = config[status as keyof typeof config];
  if (!cfg) return null;

  const Icon = cfg.icon;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant={cfg.variant} className={`gap-1 text-xs ${cfg.className}`}>
            <Icon className="h-3 w-3" />
            {cfg.label}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs">{cfg.tooltip}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
