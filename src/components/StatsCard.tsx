import { memo } from "react";
import { Card } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  subtitle?: string;
  variant?: "default" | "compact";
  itemId?: string; // Renamed from watchId to be collection-agnostic
  watchId?: string; // Kept for backward compatibility
}

export const StatsCard = memo(({ title, value, icon: Icon, subtitle, variant = "default", itemId, watchId }: StatsCardProps) => {
  const navigate = useNavigate();
  const isCompact = variant === "compact";
  const linkId = itemId || watchId; // Use itemId first, fall back to watchId
  const isClickable = !!linkId;

  const handleClick = () => {
    if (linkId) {
      navigate(`/watch/${linkId}`); // Route stays the same for now
    }
  };

  return (
    <Card
      className={`border-borderSubtle bg-surface ${isCompact ? "p-2 sm:p-3" : "p-3 sm:p-4 md:p-6"} shadow-card hover:shadow-soft transition-all duration-300 ${isClickable ? "cursor-pointer hover:border-accent/50" : ""}`}
      onClick={isClickable ? handleClick : undefined}
    >
      <div className="flex items-start justify-between gap-2 sm:gap-3">
        <div className="flex-1 min-w-0">
          <p className={`${isCompact ? "text-[10px] sm:text-xs" : "text-[10px] sm:text-xs"} font-semibold uppercase tracking-[0.12em] sm:tracking-[0.16em] text-textSoft ${isCompact ? "mb-0.5" : "mb-1 sm:mb-2"}`}>{title}</p>
          <p className={`${isCompact ? "text-sm sm:text-base leading-tight" : "text-lg sm:text-xl md:text-2xl leading-tight"} font-semibold text-textMain line-clamp-2 truncate`}>{value}</p>
          {subtitle && (
            <p className="text-[10px] sm:text-xs text-textMuted mt-0.5 sm:mt-1 truncate">{subtitle}</p>
          )}
        </div>
        <div className={`${isCompact ? "w-7 h-7 sm:w-8 sm:h-8" : "w-9 h-9 sm:w-10 sm:h-10 md:w-12 md:h-12"} rounded-lg sm:rounded-xl bg-accentSubtle flex items-center justify-center flex-shrink-0`}>
          <Icon className={`${isCompact ? "w-3.5 h-3.5 sm:w-4 sm:h-4" : "w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6"} text-accent`} />
        </div>
      </div>
    </Card>
  );
});
