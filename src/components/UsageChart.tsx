import { Watch } from "@/types/watch";
import { Card } from "@/components/ui/card";
import { monthNames } from "@/data/watchData";

interface UsageChartProps {
  watches: Watch[];
}

export const UsageChart = ({ watches }: UsageChartProps) => {
  const monthlyTotals = Array(12).fill(0);
  
  watches.forEach(watch => {
    watch.monthlyWear.forEach((days, index) => {
      monthlyTotals[index] += days;
    });
  });

  const maxValue = Math.max(...monthlyTotals);

  return (
    <Card className="border-border bg-card p-6">
      <h3 className="text-xl font-semibold text-foreground mb-6">Monthly Wear Distribution</h3>
      
      <div className="flex items-end justify-between gap-2 h-64">
        {monthlyTotals.map((total, index) => {
          const height = (total / maxValue) * 100;
          
          return (
            <div key={index} className="flex-1 flex flex-col items-center gap-2">
              <div className="w-full flex flex-col items-center justify-end h-full">
                <div className="text-xs text-muted-foreground mb-2 font-medium">
                  {total}
                </div>
                <div
                  className="w-full bg-gradient-to-t from-primary to-primary/50 rounded-t-md transition-all duration-500 hover:from-primary hover:to-primary/70"
                  style={{ height: `${height}%`, minHeight: total > 0 ? '8px' : '0' }}
                />
              </div>
              <span className="text-xs text-muted-foreground font-medium">
                {monthNames[index]}
              </span>
            </div>
          );
        })}
      </div>
    </Card>
  );
};
