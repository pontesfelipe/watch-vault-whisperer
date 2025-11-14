import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface Collection {
  id: string;
  name: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  role?: 'owner' | 'editor' | 'viewer';
}

export const useCollectionData = () => {
  const { user } = useAuth();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCollections = async () => {
    if (!user) return;

    try {
      const { data: userCollections, error: userCollectionsError } = await supabase
        .from('user_collections' as any)
        .select('collection_id, role')
        .eq('user_id', user.id);

      if (userCollectionsError) throw userCollectionsError;

      if (!userCollections || (userCollections as any[]).length === 0) {
        setCollections([]);
        return;
      }

      const userCollectionsArr = (userCollections as any[]) || [];
      const collectionIds = userCollectionsArr.map((uc: any) => uc.collection_id);
      
      const { data: collectionsData, error: collectionsError } = await supabase
        .from('collections' as any)
        .select('*')
        .in('id', collectionIds as any);

      if (collectionsError) throw collectionsError;

      const collectionsArr = (collectionsData as any[]) || [];
      const collectionsWithRoles = collectionsArr.map((collection: any) => ({
        ...collection,
        role: userCollectionsArr.find((uc: any) => uc.collection_id === collection.id)?.role as 'owner' | 'editor' | 'viewer'
      }));

      setCollections(collectionsWithRoles as any);
    } catch (error: any) {
      console.error("Error fetching collections:", error);
      toast.error("Failed to load collections");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCollections();
  }, [user]);

  return {
    collections,
    loading,
    refetch: fetchCollections,
  };
};
