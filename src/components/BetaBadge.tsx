import { Badge } from "@/components/ui/badge";
import { AlertCircle } from "lucide-react";

export const BetaBadge = () => {
  return (
    <Badge variant="outline" className="gap-1 border-amber-500/50 bg-amber-500/10 text-amber-600 dark:text-amber-400">
      <AlertCircle className="h-3 w-3" />
      Beta
    </Badge>
  );
};
