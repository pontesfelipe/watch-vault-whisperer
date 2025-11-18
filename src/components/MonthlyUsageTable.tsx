import { useState, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";

interface Watch {
  id: string;
  brand: string;
  model: string;
}

interface WearEntry {
  watch_id: string;
  wear_date: string;
  days: number;
}

interface MonthlyUsageTableProps {
  watches: Watch[];
  wearEntries: WearEntry[];
}

type Season = "all" | "spring" | "summer" | "fall" | "winter";

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

const SEASON_MONTHS: Record<Season, number[]> = {
  all: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
  spring: [2, 3, 4], // Mar, Apr, May
  summer: [5, 6, 7], // Jun, Jul, Aug
  fall: [8, 9, 10],  // Sep, Oct, Nov
  winter: [11, 0, 1] // Dec, Jan, Feb
};

export const MonthlyUsageTable = ({ watches, wearEntries }: MonthlyUsageTableProps) => {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<string>(currentYear.toString());
  const [selectedSeason, setSelectedSeason] = useState<Season>("all");

  // Get available years from wear entries
  const availableYears = useMemo(() => {
    const years = new Set<number>();
    wearEntries.forEach(entry => {
      const year = new Date(entry.wear_date).getFullYear();
      years.add(year);
    });
    const sortedYears = Array.from(years).sort((a, b) => b - a);
    return sortedYears.length > 0 ? sortedYears : [currentYear];
  }, [wearEntries, currentYear]);

  // Calculate monthly usage data
  const monthlyData = useMemo(() => {
    const data: Record<string, Record<number, number>> = {};
    
    wearEntries.forEach(entry => {
      const date = new Date(entry.wear_date);
      const year = date.getFullYear();
      const month = date.getMonth();
      
      if (year.toString() !== selectedYear) return;
      
      const watchKey = entry.watch_id;
      if (!data[watchKey]) {
        data[watchKey] = {};
      }
      if (!data[watchKey][month]) {
        data[watchKey][month] = 0;
      }
      data[watchKey][month] += entry.days;
    });
    
    return data;
  }, [wearEntries, selectedYear]);

  // Filter months based on season
  const visibleMonths = useMemo(() => {
    return SEASON_MONTHS[selectedSeason];
  }, [selectedSeason]);

  // Calculate totals for each month
  const monthlyTotals = useMemo(() => {
    const totals: Record<number, number> = {};
    visibleMonths.forEach(month => {
      totals[month] = 0;
      watches.forEach(watch => {
        totals[month] += monthlyData[watch.id]?.[month] || 0;
      });
    });
    return totals;
  }, [monthlyData, watches, visibleMonths]);

  // Calculate totals for each watch
  const watchTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    watches.forEach(watch => {
      totals[watch.id] = 0;
      visibleMonths.forEach(month => {
        totals[watch.id] += monthlyData[watch.id]?.[month] || 0;
      });
    });
    return totals;
  }, [monthlyData, watches, visibleMonths]);

  // Grand total
  const grandTotal = useMemo(() => {
    return Object.values(watchTotals).reduce((sum, val) => sum + val, 0);
  }, [watchTotals]);

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <CardTitle>Monthly Usage by Watch</CardTitle>
            <CardDescription>Total days worn per watch by month</CardDescription>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Select value={selectedSeason} onValueChange={(value) => setSelectedSeason(value as Season)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Season" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Months</SelectItem>
                <SelectItem value="spring">Spring</SelectItem>
                <SelectItem value="summer">Summer</SelectItem>
                <SelectItem value="fall">Fall</SelectItem>
                <SelectItem value="winter">Winter</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent>
                {availableYears.map(year => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-semibold sticky left-0 bg-background z-10">Brand</TableHead>
                <TableHead className="font-semibold sticky left-[100px] bg-background z-10">Model</TableHead>
                {visibleMonths.map(month => (
                  <TableHead key={month} className="text-center font-semibold min-w-[80px]">
                    {MONTHS[month]}
                  </TableHead>
                ))}
                <TableHead className="text-center font-semibold min-w-[80px]">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {watches.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={visibleMonths.length + 3} className="text-center text-muted-foreground">
                    No watches found
                  </TableCell>
                </TableRow>
              ) : (
                <>
                  {watches.map(watch => (
                    <TableRow key={watch.id}>
                      <TableCell className="font-medium sticky left-0 bg-background">{watch.brand}</TableCell>
                      <TableCell className="sticky left-[100px] bg-background">{watch.model}</TableCell>
                      {visibleMonths.map(month => {
                        const days = monthlyData[watch.id]?.[month] || 0;
                        return (
                          <TableCell key={month} className="text-center">
                            {days > 0 ? days.toFixed(1) : "-"}
                          </TableCell>
                        );
                      })}
                      <TableCell className="text-center font-medium">
                        {watchTotals[watch.id]?.toFixed(1) || "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-muted/50 font-semibold">
                    <TableCell className="sticky left-0 bg-muted/50">Total</TableCell>
                    <TableCell className="sticky left-[100px] bg-muted/50"></TableCell>
                    {visibleMonths.map(month => (
                      <TableCell key={month} className="text-center">
                        {monthlyTotals[month]?.toFixed(1) || "-"}
                      </TableCell>
                    ))}
                    <TableCell className="text-center">
                      {grandTotal.toFixed(1)}
                    </TableCell>
                  </TableRow>
                </>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
