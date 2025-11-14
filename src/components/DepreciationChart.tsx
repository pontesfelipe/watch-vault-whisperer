import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from "recharts";

interface Watch {
  brand: string;
  model: string;
  cost: number;
  average_resale_price?: number;
}

interface DepreciationChartProps {
  watches: Watch[];
}

export const DepreciationChart = ({ watches }: DepreciationChartProps) => {
  const watchesWithResale = watches.filter(
    (w) => w.average_resale_price != null && w.average_resale_price > 0
  );

  const chartData = watchesWithResale
    .map((watch) => ({
      name: `${watch.brand} ${watch.model}`,
      invested: watch.cost,
      current: watch.average_resale_price || 0,
      change: (watch.average_resale_price || 0) - watch.cost,
    }))
    .sort((a, b) => b.change - a.change)
    .slice(0, 10); // Show top 10

  if (chartData.length === 0) {
    return (
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-xl">Value Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            No resale data available. Add average resale prices to your watches to see value analysis.
          </p>
        </CardContent>
      </Card>
    );
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle className="text-xl">Investment vs Market Value</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="name"
              angle={-45}
              textAnchor="end"
              height={120}
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
            />
            <YAxis
              tick={{ fill: "hsl(var(--muted-foreground))" }}
              tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip
              formatter={(value: number) => formatCurrency(value)}
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "var(--radius)",
                color: "hsl(var(--foreground))",
              }}
            />
            <Legend
              wrapperStyle={{ color: "hsl(var(--foreground))" }}
            />
            <Bar dataKey="invested" fill="hsl(var(--primary))" name="Invested" radius={[8, 8, 0, 0]} />
            <Bar dataKey="current" name="Current Value" radius={[8, 8, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.change >= 0 ? "hsl(142 76% 36%)" : "hsl(0 84% 60%)"}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
