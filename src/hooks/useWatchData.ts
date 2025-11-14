import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface Watch {
  id: string;
  brand: string;
  model: string;
  cost: number;
  image_url?: string;
  dial_color: string;
  case_size?: string;
  type: string;
  average_resale_price?: number;
}

interface WearEntry {
  id: string;
  watch_id: string;
  wear_date: string;
  days: number;
}

export const useWatchData = () => {
  const [watches, setWatches] = useState<Watch[]>([]);
  const [wearEntries, setWearEntries] = useState<WearEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, isAdmin } = useAuth();

  const fetchData = async () => {
    if (!user) {
      setWatches([]);
      setWearEntries([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const watchesQuery: any = (supabase.from('watches' as any) as any).select('*');
      const wearEntriesQuery: any = (supabase.from('wear_entries' as any) as any).select('*');
      
      if (!isAdmin) {
        watchesQuery.eq('user_id', user.id);
        wearEntriesQuery.eq('user_id', user.id);
      }
      
      const [watchesResult, wearEntriesResult] = await Promise.all([
        watchesQuery.order("created_at", { ascending: false }),
        wearEntriesQuery,
      ]);

      if (watchesResult.data) setWatches(watchesResult.data);
      if (wearEntriesResult.data) setWearEntries(wearEntriesResult.data);
    } catch (error) {
      console.error("Error fetching watch data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user, isAdmin]);

  return { watches, wearEntries, loading, refetch: fetchData };
};
