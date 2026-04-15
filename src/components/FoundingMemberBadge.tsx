import { Crown } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface FoundingMemberBadgeProps {
  size?: "sm" | "md" | "lg";
}

export function FoundingMemberBadge({ size = "md" }: FoundingMemberBadgeProps) {
  const sizeClasses = {
    sm: "h-4 px-1.5 text-[9px] gap-0.5",
    md: "h-5 px-2 text-[10px] gap-1",
    lg: "h-6 px-2.5 text-xs gap-1",
  };

  const iconSize = {
    sm: "h-2.5 w-2.5",
    md: "h-3 w-3",
    lg: "h-3.5 w-3.5",
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={`inline-flex items-center rounded-full font-semibold tracking-wide uppercase
              bg-gradient-to-r from-[hsl(43,80%,45%)] to-[hsl(35,90%,55%)]
              text-[hsl(43,10%,10%)] shadow-sm shadow-[hsl(43,80%,50%)]/30
              ${sizeClasses[size]}`}
          >
            <Crown className={iconSize[size]} />
            Founder
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs">Founding Member — Among the first to join Sora Vault</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
