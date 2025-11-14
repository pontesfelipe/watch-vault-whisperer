import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

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
  const { user, isAdmin } = useAuth();

  const fetchData = async () => {
    if (!user) {
      setWaterUsages([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const query = supabase.from("water_usage").select("*");
      
      if (!isAdmin) {
        query.eq("user_id", user.id);
      }
      
      const result = await query.order("activity_date", { ascending: false });

      if (result.data) setWaterUsages(result.data);
    } catch (error) {
      console.error("Error fetching water usage data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user, isAdmin]);

  return { waterUsages, loading, refetch: fetchData };
};
