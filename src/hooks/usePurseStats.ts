import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PURSE_SIZES } from "@/types/collection";

// Use a flexible interface for DB results
interface PurseSpecsRow {
  id: string;
  item_id: string;
  user_id: string | null;
  material: string | null;
  hardware_color: string | null;
  size_category: string | null;
  authenticity_verified: boolean | null;
  serial_number: string | null;
  dust_bag_included: boolean | null;
  closure_type: string | null;
  strap_type: string | null;
  box_included: boolean | null;
  authenticity_card_included: boolean | null;
  color: string | null;
  pattern: string | null;
  created_at: string;
  updated_at: string;
}

interface PurseStatsInput {
  itemIds: string[];
  enabled: boolean;
}

interface PurseStats {
  totalWithSpecs: number;
  authenticityVerifiedCount: number;
  authenticityVerifiedPercent: number;
  sizeBreakdown: Record<string, number>;
  mostCommonSize: string | null;
  boxIncludedCount: number;
  boxIncludedPercent: number;
  dustBagIncludedCount: number;
  dustBagIncludedPercent: number;
  authenticityCardCount: number;
  authenticityCardPercent: number;
  topMaterial: string | null;
  materialCount: number;
  topHardwareColor: string | null;
}

export const usePurseStats = ({ itemIds, enabled }: PurseStatsInput) => {
  const [specs, setSpecs] = useState<PurseSpecsRow[]>([]);
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
          .from('purse_specs')
          .select('*')
          .in('item_id', itemIds);

        if (error) throw error;
        setSpecs(data || []);
      } catch (error) {
        console.error("Error fetching purse specs:", error);
        setSpecs([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSpecs();
  }, [itemIds.join(','), enabled]);

  const stats = useMemo((): PurseStats => {
    const totalWithSpecs = specs.length;
    
    if (totalWithSpecs === 0) {
      return {
        totalWithSpecs: 0,
        authenticityVerifiedCount: 0,
        authenticityVerifiedPercent: 0,
        sizeBreakdown: {},
        mostCommonSize: null,
        boxIncludedCount: 0,
        boxIncludedPercent: 0,
        dustBagIncludedCount: 0,
        dustBagIncludedPercent: 0,
        authenticityCardCount: 0,
        authenticityCardPercent: 0,
        topMaterial: null,
        materialCount: 0,
        topHardwareColor: null,
      };
    }

    // Authenticity verified stats
    const authenticityVerifiedCount = specs.filter(s => s.authenticity_verified).length;
    const authenticityVerifiedPercent = (authenticityVerifiedCount / totalWithSpecs) * 100;

    // Size breakdown
    const sizeBreakdown = specs.reduce((acc, spec) => {
      if (spec.size_category) {
        acc[spec.size_category] = (acc[spec.size_category] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    // Most common size
    const mostCommonSize = Object.entries(sizeBreakdown)
      .sort(([, a], [, b]) => b - a)[0]?.[0] || null;

    // Box included stats
    const boxIncludedCount = specs.filter(s => s.box_included).length;
    const boxIncludedPercent = (boxIncludedCount / totalWithSpecs) * 100;

    // Dust bag stats
    const dustBagIncludedCount = specs.filter(s => s.dust_bag_included).length;
    const dustBagIncludedPercent = (dustBagIncludedCount / totalWithSpecs) * 100;

    // Authenticity card stats
    const authenticityCardCount = specs.filter(s => s.authenticity_card_included).length;
    const authenticityCardPercent = (authenticityCardCount / totalWithSpecs) * 100;

    // Material stats
    const materials = specs
      .filter(s => s.material)
      .reduce((acc, spec) => {
        const mat = spec.material!;
        acc[mat] = (acc[mat] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

    const topMaterialEntry = Object.entries(materials)
      .sort(([, a], [, b]) => b - a)[0];
    const topMaterial = topMaterialEntry?.[0] || null;
    const materialCount = Object.keys(materials).length;

    // Hardware color stats
    const hardwareColors = specs
      .filter(s => s.hardware_color)
      .reduce((acc, spec) => {
        const color = spec.hardware_color!;
        acc[color] = (acc[color] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

    const topHardwareColor = Object.entries(hardwareColors)
      .sort(([, a], [, b]) => b - a)[0]?.[0] || null;

    return {
      totalWithSpecs,
      authenticityVerifiedCount,
      authenticityVerifiedPercent,
      sizeBreakdown,
      mostCommonSize,
      boxIncludedCount,
      boxIncludedPercent,
      dustBagIncludedCount,
      dustBagIncludedPercent,
      authenticityCardCount,
      authenticityCardPercent,
      topMaterial,
      materialCount,
      topHardwareColor,
    };
  }, [specs]);

  return { specs, stats, loading };
};
