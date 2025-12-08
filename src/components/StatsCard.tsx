import { Card } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  subtitle?: string;
  variant?: "default" | "compact";
}

export const StatsCard = ({ title, value, icon: Icon, subtitle, variant = "default" }: StatsCardProps) => {
  const isCompact = variant === "compact";
  return (
    <Card className={`border-borderSubtle bg-surface ${isCompact ? "p-3" : "p-6"} shadow-card hover:shadow-soft transition-all duration-300`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className={`${isCompact ? "text-xs" : "text-xs"} font-semibold uppercase tracking-[0.16em] text-textSoft ${isCompact ? "mb-0.5" : "mb-2"}`}>{title}</p>
          <p className={`${isCompact ? "text-base leading-tight" : "text-2xl leading-tight"} font-semibold text-textMain line-clamp-2`}>{value}</p>
          {subtitle && (
            <p className="text-xs text-textMuted mt-1">{subtitle}</p>
          )}
        </div>
        <div className={`${isCompact ? "w-8 h-8" : "w-12 h-12"} rounded-xl bg-accentSubtle flex items-center justify-center flex-shrink-0`}>
          <Icon className={`${isCompact ? "w-4 h-4" : "w-6 h-6"} text-accent`} />
        </div>
      </div>
    </Card>
  );
};
