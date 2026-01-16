import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface SportWatch {
  watchId: string;
  brand: string;
  model: string;
  days: number;
}

interface Sport {
  id: string;
  activity_date: string;
  sport_type: string;
  location: string | null;
  duration_minutes: number | null;
  notes: string | null;
  linkedWatches: SportWatch[];
}

export const useSportData = () => {
  const [sports, setSports] = useState<Sport[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, isAdmin } = useAuth();

  const fetchData = async () => {
    if (!user) {
      setSports([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // Fetch sports
      let sportQuery = supabase.from('sports').select('*');
      if (!isAdmin) {
        sportQuery = sportQuery.eq('user_id', user.id);
      }
      const sportResult = await sportQuery.order('activity_date', { ascending: false });
      
      if (!sportResult.data) {
        setSports([]);
        setLoading(false);
        return;
      }

      // Fetch wear entries with watch info for all sports
      const sportIds = sportResult.data.map(s => s.id);
      const { data: wearData } = await supabase
        .from('wear_entries')
        .select('sport_id, watch_id, days, watches(id, brand, model)')
        .in('sport_id', sportIds);

      // Group wear entries by sport
      const wearBySport: Record<string, SportWatch[]> = {};
      wearData?.forEach((entry: any) => {
        if (entry.sport_id && entry.watches) {
          if (!wearBySport[entry.sport_id]) {
            wearBySport[entry.sport_id] = [];
          }
          wearBySport[entry.sport_id].push({
            watchId: entry.watches.id,
            brand: entry.watches.brand,
            model: entry.watches.model,
            days: entry.days,
          });
        }
      });

      // Combine sports with their linked watches
      const sportsWithWatches: Sport[] = sportResult.data.map(sport => ({
        id: sport.id,
        activity_date: sport.activity_date,
        sport_type: sport.sport_type,
        location: sport.location,
        duration_minutes: sport.duration_minutes,
        notes: sport.notes,
        linkedWatches: wearBySport[sport.id] || [],
      }));

      setSports(sportsWithWatches);
    } catch (error) {
      console.error("Error fetching sport data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user, isAdmin]);

  return { sports, loading, refetch: fetchData };
};
