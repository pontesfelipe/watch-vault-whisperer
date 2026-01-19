import { Package, ShieldCheck, Ruler, FileText, Sparkles } from "lucide-react";
import { StatsCard } from "@/components/StatsCard";
import { PURSE_SIZES } from "@/types/collection";

interface PurseStatsCardsProps {
  stats: {
    authenticityVerifiedCount: number;
    authenticityVerifiedPercent: number;
    mostCommonSize: string | null;
    boxIncludedCount: number;
    boxIncludedPercent: number;
    dustBagIncludedCount: number;
    dustBagIncludedPercent: number;
    authenticityCardCount: number;
    authenticityCardPercent: number;
    topMaterial: string | null;
    materialCount: number;
    totalWithSpecs: number;
  };
  totalPurses: number;
}

export const PurseStatsCards = ({ stats, totalPurses }: PurseStatsCardsProps) => {
  if (totalPurses === 0) return null;

  const sizeLabel = stats.mostCommonSize
    ? PURSE_SIZES[stats.mostCommonSize]?.label || stats.mostCommonSize
    : "N/A";

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
      <StatsCard
        title="Authenticated"
        value={`${stats.authenticityVerifiedCount}/${totalPurses}`}
        subtitle={`${stats.authenticityVerifiedPercent.toFixed(0)}% verified`}
        icon={ShieldCheck}
        variant="compact"
      />
      <StatsCard
        title="Most Common Size"
        value={sizeLabel}
        subtitle={stats.totalWithSpecs > 0 ? `${stats.totalWithSpecs} with specs` : undefined}
        icon={Ruler}
        variant="compact"
      />
      <StatsCard
        title="With Box"
        value={`${stats.boxIncludedCount}/${totalPurses}`}
        subtitle={`${stats.boxIncludedPercent.toFixed(0)}% complete`}
        icon={Package}
        variant="compact"
      />
      <StatsCard
        title="With Dust Bag"
        value={`${stats.dustBagIncludedCount}/${totalPurses}`}
        subtitle={`${stats.dustBagIncludedPercent.toFixed(0)}% included`}
        icon={Sparkles}
        variant="compact"
      />
      <StatsCard
        title="Top Material"
        value={stats.topMaterial || "N/A"}
        subtitle={stats.materialCount > 0 ? `${stats.materialCount} materials` : undefined}
        icon={FileText}
        variant="compact"
      />
    </div>
  );
};
