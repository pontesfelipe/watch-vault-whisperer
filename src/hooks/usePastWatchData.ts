import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface PastWatch {
  id: string;
  brand: string;
  model: string;
  dial_color: string;
  type: string;
  cost: number;
  status: string;
  when_bought?: string;
}

interface WearEntry {
  id: string;
  watch_id: string;
  wear_date: string;
  days: number;
}

export const usePastWatchData = () => {
  const [pastWatches, setPastWatches] = useState<PastWatch[]>([]);
  const [wearEntries, setWearEntries] = useState<WearEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchData = async () => {
    if (!user) {
      setPastWatches([]);
      setWearEntries([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // Fetch watches with status 'sold' or 'traded'
      const { data: watchesData, error: watchesError } = await supabase
        .from('watches')
        .select('*')
        .eq('user_id', user.id)
        .in('status', ['sold', 'traded'])
        .order('updated_at', { ascending: false });

      if (watchesError) throw watchesError;

      if (watchesData && watchesData.length > 0) {
        setPastWatches(watchesData);
        
        // Fetch wear entries for these watches
        const watchIds = watchesData.map((w: PastWatch) => w.id);
        const { data: wearData, error: wearError } = await supabase
          .from('wear_entries')
          .select('*')
          .in('watch_id', watchIds);

        if (wearError) throw wearError;
        if (wearData) setWearEntries(wearData);
      } else {
        setPastWatches([]);
        setWearEntries([]);
      }
    } catch (error) {
      console.error("Error fetching past watch data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  return { pastWatches, wearEntries, loading, refetch: fetchData };
};