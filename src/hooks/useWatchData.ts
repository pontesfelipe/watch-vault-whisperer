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
  when_bought?: string;
}

interface WearEntry {
  id: string;
  watch_id: string;
  wear_date: string;
  days: number;
}

export const useWatchData = (collectionId?: string | null) => {
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
      
      // Admins can see all watches across all collections
      // Regular users only see their own watches
      if (!isAdmin) {
        watchesQuery.eq('user_id', user.id);
      }
      
      // Filter by collection if provided (both admin and regular users)
      if (collectionId) {
        watchesQuery.eq('collection_id', collectionId);
      }
      
      const watchesResult = await watchesQuery.order("created_at", { ascending: false });

      if (watchesResult.data) {
        setWatches(watchesResult.data);
        
        // Fetch wear entries for the watches in this collection
        const watchIds = watchesResult.data.map((w: Watch) => w.id);
        const wearEntriesQuery: any = (supabase.from('wear_entries' as any) as any)
          .select('*')
          .in('watch_id', watchIds);
        
        if (!isAdmin) {
          wearEntriesQuery.eq('user_id', user.id);
        }
        
        const wearEntriesResult = await wearEntriesQuery;
        if (wearEntriesResult.data) setWearEntries(wearEntriesResult.data);
      } else {
        setWatches([]);
        setWearEntries([]);
      }
    } catch (error) {
      console.error("Error fetching watch data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user, isAdmin, collectionId]);

  return { watches, wearEntries, loading, refetch: fetchData };
};
