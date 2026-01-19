import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CollectionType } from "@/types/collection";

export interface FeatureToggle {
  id: string;
  collection_type: CollectionType;
  feature_key: string;
  feature_name: string;
  is_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface FeatureMatrix {
  [featureKey: string]: {
    name: string;
    watches: boolean;
    sneakers: boolean;
    purses: boolean;
  };
}

export const useFeatureToggles = () => {
  const [toggles, setToggles] = useState<FeatureToggle[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchToggles = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('collection_feature_toggles')
        .select('*')
        .order('feature_key');

      if (error) throw error;
      setToggles((data as FeatureToggle[]) || []);
    } catch (error) {
      console.error("Error fetching feature toggles:", error);
      toast.error("Failed to load feature toggles");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchToggles();
  }, [fetchToggles]);

  const updateToggle = async (id: string, isEnabled: boolean) => {
    try {
      const { error } = await supabase
        .from('collection_feature_toggles')
        .update({ is_enabled: isEnabled })
        .eq('id', id);

      if (error) throw error;

      setToggles(prev =>
        prev.map(toggle =>
          toggle.id === id ? { ...toggle, is_enabled: isEnabled } : toggle
        )
      );

      toast.success("Feature toggle updated");
    } catch (error) {
      console.error("Error updating feature toggle:", error);
      toast.error("Failed to update feature toggle");
    }
  };

  const isFeatureEnabled = useCallback(
    (collectionType: CollectionType, featureKey: string): boolean => {
      const toggle = toggles.find(
        t => t.collection_type === collectionType && t.feature_key === featureKey
      );
      return toggle?.is_enabled ?? true;
    },
    [toggles]
  );

  // Build a matrix structure for display
  const getFeatureMatrix = useCallback((): FeatureMatrix => {
    const matrix: FeatureMatrix = {};

    // Get all unique feature keys
    const allFeatureKeys = [...new Set(toggles.map(t => t.feature_key))];

    for (const featureKey of allFeatureKeys) {
      const watchToggle = toggles.find(t => t.collection_type === 'watches' && t.feature_key === featureKey);
      const sneakerToggle = toggles.find(t => t.collection_type === 'sneakers' && t.feature_key === featureKey);
      const purseToggle = toggles.find(t => t.collection_type === 'purses' && t.feature_key === featureKey);

      // Use the feature name from any toggle that has this key
      const featureName = watchToggle?.feature_name || sneakerToggle?.feature_name || purseToggle?.feature_name || featureKey;

      matrix[featureKey] = {
        name: featureName,
        watches: watchToggle?.is_enabled ?? false,
        sneakers: sneakerToggle?.is_enabled ?? false,
        purses: purseToggle?.is_enabled ?? false,
      };
    }

    return matrix;
  }, [toggles]);

  const getToggleId = useCallback(
    (collectionType: CollectionType, featureKey: string): string | null => {
      const toggle = toggles.find(
        t => t.collection_type === collectionType && t.feature_key === featureKey
      );
      return toggle?.id ?? null;
    },
    [toggles]
  );

  return {
    toggles,
    loading,
    refetch: fetchToggles,
    updateToggle,
    isFeatureEnabled,
    getFeatureMatrix,
    getToggleId,
  };
};
