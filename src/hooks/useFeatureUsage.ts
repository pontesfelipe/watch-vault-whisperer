import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { CollectionType } from "@/types/collection";

export const useFeatureUsage = () => {
  const { user } = useAuth();

  const trackFeatureUsage = useCallback(
    async (featureKey: string, collectionType: CollectionType) => {
      if (!user) return;

      try {
        await supabase.from('feature_usage_events').insert({
          user_id: user.id,
          feature_key: featureKey,
          collection_type: collectionType,
        });
      } catch (error) {
        // Silently fail - analytics shouldn't break the app
        console.error("Error tracking feature usage:", error);
      }
    },
    [user]
  );

  return { trackFeatureUsage };
};
