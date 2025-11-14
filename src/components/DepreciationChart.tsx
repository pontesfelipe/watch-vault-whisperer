import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useMemo } from "react";

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
  const [filterType, setFilterType] = useState<string>("all");
  const [filterValue, setFilterValue] = useState<string>("all");

  const watchesWithResale = watches.filter(
    (w) => w.average_resale_price != null && w.average_resale_price > 0
  );

  // Get unique brands and models
  const brands = useMemo(() => {
    const uniqueBrands = Array.from(new Set(watchesWithResale.map(w => w.brand)));
    return uniqueBrands.sort();
  }, [watchesWithResale]);

  const models = useMemo(() => {
    const uniqueModels = Array.from(new Set(watchesWithResale.map(w => w.model)));
    return uniqueModels.sort();
  }, [watchesWithResale]);

  // Filter watches based on selection
  const filteredWatches = useMemo(() => {
    if (filterType === "all") return watchesWithResale;
    if (filterType === "brand") {
      return watchesWithResale.filter(w => w.brand === filterValue);
    }
    if (filterType === "model") {
      return watchesWithResale.filter(w => w.model === filterValue);
    }
    return watchesWithResale;
  }, [watchesWithResale, filterType, filterValue]);

  const chartData = filteredWatches
    .map((watch, index) => ({
      name: `Watch ${index + 1}`,
      brand: watch.brand,
      model: watch.model,
      invested: watch.cost,
      current: watch.average_resale_price || 0,
      change: (watch.average_resale_price || 0) - watch.cost,
    }))
    .sort((a, b) => b.change - a.change);

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
        <div className="flex gap-2 mt-4">
          <Select value={filterType} onValueChange={(value) => {
            setFilterType(value);
            setFilterValue("all");
          }}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Collection</SelectItem>
              <SelectItem value="brand">By Brand</SelectItem>
              <SelectItem value="model">By Model</SelectItem>
            </SelectContent>
          </Select>
          
          {filterType === "brand" && (
            <Select value={filterValue} onValueChange={setFilterValue}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select brand..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Brands</SelectItem>
                {brands.map(brand => (
                  <SelectItem key={brand} value={brand}>{brand}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          
          {filterType === "model" && (
            <Select value={filterValue} onValueChange={setFilterValue}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select model..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Models</SelectItem>
                {models.map(model => (
                  <SelectItem key={model} value={model}>{model}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
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
              labelFormatter={(label, payload) => {
                if (payload && payload.length > 0) {
                  const data = payload[0].payload;
                  return `${data.brand} ${data.model}`;
                }
                return label;
              }}
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
