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
  const [selectedWatch, setSelectedWatch] = useState<string>("");

  const watchesWithResale = watches.filter(
    (w) => w.average_resale_price != null && w.average_resale_price > 0
  );

  // Get unique brands and individual watches
  const brands = useMemo(() => {
    const uniqueBrands = Array.from(new Set(watchesWithResale.map(w => w.brand)));
    return uniqueBrands.sort();
  }, [watchesWithResale]);

  const individualWatches = useMemo(() => {
    return watchesWithResale.map(w => ({
      id: `${w.brand}-${w.model}`,
      label: `${w.brand} ${w.model}`,
      brand: w.brand,
      model: w.model
    }));
  }, [watchesWithResale]);

  // Calculate chart data based on filter
  const chartData = useMemo(() => {
    if (filterType === "brand") {
      // Group by brand and sum values
      const brandGroups = watchesWithResale.reduce((acc, watch) => {
        if (!acc[watch.brand]) {
          acc[watch.brand] = {
            invested: 0,
            current: 0,
            count: 0
          };
        }
        acc[watch.brand].invested += watch.cost;
        acc[watch.brand].current += watch.average_resale_price || 0;
        acc[watch.brand].count += 1;
        return acc;
      }, {} as Record<string, { invested: number; current: number; count: number }>);

      return Object.entries(brandGroups)
        .map(([brand, data]) => ({
          name: brand,
          brand,
          model: `${data.count} watches`,
          invested: data.invested,
          current: data.current,
          change: data.current - data.invested,
        }))
        .sort((a, b) => b.change - a.change);
    } else if (filterType === "watch" && selectedWatch) {
      // Show single selected watch
      const watch = watchesWithResale.find(w => `${w.brand}-${w.model}` === selectedWatch);
      if (!watch) return [];
      
      return [{
        name: `${watch.brand}\n${watch.model}`,
        brand: watch.brand,
        model: watch.model,
        invested: watch.cost,
        current: watch.average_resale_price || 0,
        change: (watch.average_resale_price || 0) - watch.cost,
      }];
    } else {
      // Show all watches with abbreviated names
      return watchesWithResale
        .map((watch) => {
          // Create abbreviated name (first 3 letters of brand + first 3 of model)
          const abbrevBrand = watch.brand.substring(0, 3).toUpperCase();
          const abbrevModel = watch.model.split(' ')[0].substring(0, 4);
          return {
            name: `${abbrevBrand}-${abbrevModel}`,
            brand: watch.brand,
            model: watch.model,
            invested: watch.cost,
            current: watch.average_resale_price || 0,
            change: (watch.average_resale_price || 0) - watch.cost,
          };
        })
        .sort((a, b) => b.change - a.change);
    }
  }, [watchesWithResale, filterType, selectedWatch]);

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
            setSelectedWatch("");
          }}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Collection</SelectItem>
              <SelectItem value="brand">By Brand</SelectItem>
              <SelectItem value="watch">By Watch</SelectItem>
            </SelectContent>
          </Select>
          
          {filterType === "watch" && (
            <Select value={selectedWatch} onValueChange={setSelectedWatch}>
              <SelectTrigger className="w-[250px]">
                <SelectValue placeholder="Select watch..." />
              </SelectTrigger>
              <SelectContent>
                {individualWatches.map(watch => (
                  <SelectItem key={watch.id} value={watch.id}>{watch.label}</SelectItem>
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
