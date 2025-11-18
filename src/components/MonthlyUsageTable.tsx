import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
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
  // No props needed - fetches its own data
}

type Quarter = "all" | "q1" | "q2" | "q3" | "q4";

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

const QUARTER_MONTHS: Record<Quarter, number[]> = {
  all: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
  q1: [0, 1, 2],  // Jan, Feb, Mar
  q2: [3, 4, 5],  // Apr, May, Jun
  q3: [6, 7, 8],  // Jul, Aug, Sep
  q4: [9, 10, 11] // Oct, Nov, Dec
};

export const MonthlyUsageTable = ({}: MonthlyUsageTableProps) => {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<string>(currentYear.toString());
  const [selectedQuarter, setSelectedQuarter] = useState<Quarter>("all");
  const [watches, setWatches] = useState<Watch[]>([]);
  const [wearEntries, setWearEntries] = useState<WearEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch all watches and wear entries (no collection filtering)
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch all watches
        const { data: watchesData, error: watchesError } = await supabase
          .from("watches")
          .select("id, brand, model")
          .order("brand", { ascending: true })
          .order("model", { ascending: true });

        if (watchesError) throw watchesError;

        // Fetch all wear entries
        const { data: wearData, error: wearError } = await supabase
          .from("wear_entries")
          .select("id, watch_id, wear_date, days");

        if (wearError) throw wearError;

        setWatches(watchesData || []);
        setWearEntries(wearData || []);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

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
    
    console.log('Processing wear entries for monthly table:', {
      totalEntries: wearEntries.length,
      selectedYear,
      sampleEntries: wearEntries.slice(0, 3)
    });
    
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
    
    console.log('Monthly data calculated:', {
      watchCount: Object.keys(data).length,
      sampleData: Object.entries(data).slice(0, 2).map(([id, months]) => ({
        watchId: id,
        months: months
      }))
    });
    
    return data;
  }, [wearEntries, selectedYear]);

  // Filter months based on quarter
  const visibleMonths = useMemo(() => {
    return QUARTER_MONTHS[selectedQuarter];
  }, [selectedQuarter]);

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
            <Select value={selectedQuarter} onValueChange={(value) => setSelectedQuarter(value as Quarter)}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Quarter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Months</SelectItem>
                <SelectItem value="q1">Q1 (Jan-Mar)</SelectItem>
                <SelectItem value="q2">Q2 (Apr-Jun)</SelectItem>
                <SelectItem value="q3">Q3 (Jul-Sep)</SelectItem>
                <SelectItem value="q4">Q4 (Oct-Dec)</SelectItem>
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
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
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
        )}
      </CardContent>
    </Card>
  );
};
