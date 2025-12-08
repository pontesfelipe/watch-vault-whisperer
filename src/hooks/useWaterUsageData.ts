import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface LinkedWatch {
  watchId: string;
  brand: string;
  model: string;
  days: number;
}

interface WaterUsage {
  id: string;
  watch_id: string;
  activity_type: string;
  depth_meters: number | null;
  duration_minutes: number | null;
  activity_date: string;
  notes?: string | null;
  linkedWatch?: LinkedWatch;
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
      // Fetch water usage with watch info
      let query = supabase
        .from('water_usage')
        .select('*, watches(id, brand, model)');
      
      if (!isAdmin) {
        query = query.eq('user_id', user.id);
      }
      
      const result = await query.order('activity_date', { ascending: false });

      if (result.data) {
        const usagesWithWatches = result.data.map((entry: any) => ({
          ...entry,
          linkedWatch: entry.watches ? {
            watchId: entry.watches.id,
            brand: entry.watches.brand,
            model: entry.watches.model,
            days: 1,
          } : undefined,
        }));
        setWaterUsages(usagesWithWatches);
      }
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
