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
    <Card className={`border-border bg-card ${isCompact ? "p-4" : "p-6"} hover:shadow-[var(--shadow-glow)] transition-all duration-300 min-w-[180px]`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className={`text-sm text-muted-foreground ${isCompact ? "mb-1" : "mb-2"}`}>{title}</p>
          <p className={`${isCompact ? "text-2xl" : "text-3xl"} font-bold text-foreground mb-1`}>{value}</p>
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
        </div>
        <div className={`${isCompact ? "w-10 h-10" : "w-12 h-12"} rounded-lg bg-primary/10 flex items-center justify-center`}>
          <Icon className={`${isCompact ? "w-5 h-5" : "w-6 h-6"} text-primary`} />
        </div>
      </div>
    </Card>
  );
};
