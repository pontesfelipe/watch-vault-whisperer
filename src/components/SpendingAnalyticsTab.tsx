import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp, Calendar } from "lucide-react";

interface Watch {
  id: string;
  brand: string;
  model: string;
  cost: number;
  when_bought?: string;
  created_at: string;
}

interface SpendingAnalyticsTabProps {
  watches: Watch[];
}

export function SpendingAnalyticsTab({ watches }: SpendingAnalyticsTabProps) {
  // Calculate total spending
  const totalSpent = watches.reduce((sum, watch) => sum + watch.cost, 0);
  
  // Calculate average price
  const averagePrice = watches.length > 0 ? totalSpent / watches.length : 0;
  
  // Group by year
  const spendingByYear = watches.reduce((acc, watch) => {
    const year = new Date(watch.created_at).getFullYear();
    if (!acc[year]) {
      acc[year] = { count: 0, total: 0 };
    }
    acc[year].count++;
    acc[year].total += watch.cost;
    return acc;
  }, {} as Record<number, { count: number; total: number }>);
  
  const yearlyData = Object.entries(spendingByYear)
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([year, data]) => ({
      year: Number(year),
      ...data,
    }));

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalSpent.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Across {watches.length} watches
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Price</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${averagePrice.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
            <p className="text-xs text-muted-foreground">
              Per watch
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Collection Size</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{watches.length}</div>
            <p className="text-xs text-muted-foreground">
              Total watches
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Yearly Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Yearly Breakdown</CardTitle>
          <CardDescription>Spending and acquisitions by year</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {yearlyData.map(({ year, count, total }) => (
              <div key={year} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <p className="font-semibold text-lg">{year}</p>
                  <p className="text-sm text-muted-foreground">
                    {count} {count === 1 ? 'watch' : 'watches'} acquired
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-xl">${total.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">
                    Avg: ${(total / count).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
