import { ChevronUp, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface VoteButtonsProps {
  score: number;
  userVote: number;
  onUpvote: () => void;
  onDownvote: () => void;
  size?: "sm" | "md";
  orientation?: "vertical" | "horizontal";
}

export function VoteButtons({ 
  score, 
  userVote, 
  onUpvote, 
  onDownvote, 
  size = "md",
  orientation = "vertical" 
}: VoteButtonsProps) {
  const iconSize = size === "sm" ? "h-4 w-4" : "h-5 w-5";
  const buttonSize = size === "sm" ? "h-6 w-6" : "h-8 w-8";
  const textSize = size === "sm" ? "text-xs" : "text-sm";

  return (
    <div className={cn(
      "flex items-center gap-1",
      orientation === "vertical" ? "flex-col" : "flex-row"
    )}>
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          buttonSize,
          "rounded-md transition-colors",
          userVote === 1 
            ? "text-orange-500 bg-orange-500/10 hover:bg-orange-500/20" 
            : "text-textMuted hover:text-orange-500 hover:bg-orange-500/10"
        )}
        onClick={onUpvote}
      >
        <ChevronUp className={iconSize} />
      </Button>
      <span className={cn(
        "font-semibold min-w-[24px] text-center",
        textSize,
        score > 0 ? "text-orange-500" : score < 0 ? "text-blue-500" : "text-textMuted"
      )}>
        {score}
      </span>
      <Button
        variant="ghost"
        size="icon"
        className={cn(
          buttonSize,
          "rounded-md transition-colors",
          userVote === -1 
            ? "text-blue-500 bg-blue-500/10 hover:bg-blue-500/20" 
            : "text-textMuted hover:text-blue-500 hover:bg-blue-500/10"
        )}
        onClick={onDownvote}
      >
        <ChevronDown className={iconSize} />
      </Button>
    </div>
  );
}
