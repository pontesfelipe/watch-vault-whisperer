import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SNEAKER_CONDITIONS } from "@/types/collection";

// Use a flexible interface for DB results
interface SneakerSpecsRow {
  id: string;
  item_id: string;
  user_id: string | null;
  colorway: string | null;
  shoe_size: string | null;
  size_type: string | null;
  sku: string | null;
  style_code: string | null;
  condition: string | null;
  box_included: boolean | null;
  og_all: boolean | null;
  collaboration: string | null;
  limited_edition: boolean | null;
  release_date: string | null;
  silhouette: string | null;
  created_at: string;
  updated_at: string;
}

interface SneakerStatsInput {
  itemIds: string[];
  enabled: boolean;
}

interface SneakerStats {
  totalWithSpecs: number;
  conditionBreakdown: Record<string, number>;
  boxIncludedCount: number;
  boxIncludedPercent: number;
  ogAllCount: number;
  ogAllPercent: number;
  limitedEditionCount: number;
  limitedEditionPercent: number;
  topCollaboration: string | null;
  collaborationCount: number;
  mostCommonCondition: string | null;
  deadstockCount: number;
}

export const useSneakerStats = ({ itemIds, enabled }: SneakerStatsInput) => {
  const [specs, setSpecs] = useState<SneakerSpecsRow[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!enabled || itemIds.length === 0) {
      setSpecs([]);
      return;
    }

    const fetchSpecs = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('sneaker_specs')
          .select('*')
          .in('item_id', itemIds);

        if (error) throw error;
        setSpecs(data || []);
      } catch (error) {
        console.error("Error fetching sneaker specs:", error);
        setSpecs([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSpecs();
  }, [itemIds.join(','), enabled]);

  const stats = useMemo((): SneakerStats => {
    const totalWithSpecs = specs.length;
    
    if (totalWithSpecs === 0) {
      return {
        totalWithSpecs: 0,
        conditionBreakdown: {},
        boxIncludedCount: 0,
        boxIncludedPercent: 0,
        ogAllCount: 0,
        ogAllPercent: 0,
        limitedEditionCount: 0,
        limitedEditionPercent: 0,
        topCollaboration: null,
        collaborationCount: 0,
        mostCommonCondition: null,
        deadstockCount: 0,
      };
    }

    // Condition breakdown
    const conditionBreakdown = specs.reduce((acc, spec) => {
      if (spec.condition) {
        acc[spec.condition] = (acc[spec.condition] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    // Most common condition
    const mostCommonCondition = Object.entries(conditionBreakdown)
      .sort(([, a], [, b]) => b - a)[0]?.[0] || null;

    // Box included stats
    const boxIncludedCount = specs.filter(s => s.box_included).length;
    const boxIncludedPercent = (boxIncludedCount / totalWithSpecs) * 100;

    // OG All stats
    const ogAllCount = specs.filter(s => s.og_all).length;
    const ogAllPercent = (ogAllCount / totalWithSpecs) * 100;

    // Limited edition stats
    const limitedEditionCount = specs.filter(s => s.limited_edition).length;
    const limitedEditionPercent = (limitedEditionCount / totalWithSpecs) * 100;

    // Collaboration stats
    const collaborations = specs
      .filter(s => s.collaboration)
      .reduce((acc, spec) => {
        const collab = spec.collaboration!;
        acc[collab] = (acc[collab] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

    const topCollabEntry = Object.entries(collaborations)
      .sort(([, a], [, b]) => b - a)[0];
    const topCollaboration = topCollabEntry?.[0] || null;
    const collaborationCount = Object.keys(collaborations).length;

    // Deadstock count
    const deadstockCount = conditionBreakdown['deadstock'] || 0;

    return {
      totalWithSpecs,
      conditionBreakdown,
      boxIncludedCount,
      boxIncludedPercent,
      ogAllCount,
      ogAllPercent,
      limitedEditionCount,
      limitedEditionPercent,
      topCollaboration,
      collaborationCount,
      mostCommonCondition,
      deadstockCount,
    };
  }, [specs]);

  return { specs, stats, loading };
};
