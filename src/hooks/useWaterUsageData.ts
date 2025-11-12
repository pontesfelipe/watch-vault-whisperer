import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface WaterUsage {
  id: string;
  watch_id: string;
  activity_type: string;
  depth_meters: number;
  duration_minutes: number;
  activity_date: string;
}

export const useWaterUsageData = () => {
  const [waterUsages, setWaterUsages] = useState<WaterUsage[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const result = await supabase
        .from("water_usage")
        .select("*")
        .order("activity_date", { ascending: false });

      if (result.data) setWaterUsages(result.data);
    } catch (error) {
      console.error("Error fetching water usage data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return { waterUsages, loading, refetch: fetchData };
};
