import { useImpersonation } from "@/contexts/ImpersonationContext";
import { Button } from "@/components/ui/button";
import { Eye, X } from "lucide-react";

export function ImpersonationBanner() {
  const { isImpersonating, impersonatedUser, stopImpersonation } = useImpersonation();

  if (!isImpersonating || !impersonatedUser) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] bg-amber-500 text-amber-950 px-4 py-2 flex items-center justify-between gap-2 text-sm font-medium shadow-lg">
      <div className="flex items-center gap-2">
        <Eye className="h-4 w-4 shrink-0" />
        <span className="truncate">
          Demo Mode — Viewing as <strong>{impersonatedUser.full_name || impersonatedUser.email}</strong>
        </span>
      </div>
      <Button
        size="sm"
        variant="ghost"
        onClick={stopImpersonation}
        className="shrink-0 text-amber-950 hover:bg-amber-600 hover:text-amber-950 gap-1 h-7"
      >
        <X className="h-3 w-3" />
        Exit
      </Button>
    </div>
  );
}
