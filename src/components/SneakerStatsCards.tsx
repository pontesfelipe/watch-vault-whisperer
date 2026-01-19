import { Package, Star, Sparkles, Users, Award } from "lucide-react";
import { StatsCard } from "@/components/StatsCard";
import { SNEAKER_CONDITIONS } from "@/types/collection";

interface SneakerStatsCardsProps {
  stats: {
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
    totalWithSpecs: number;
  };
  totalSneakers: number;
}

export const SneakerStatsCards = ({ stats, totalSneakers }: SneakerStatsCardsProps) => {
  if (totalSneakers === 0) return null;

  const conditionLabel = stats.mostCommonCondition
    ? SNEAKER_CONDITIONS[stats.mostCommonCondition]?.label || stats.mostCommonCondition
    : "N/A";

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
      <StatsCard
        title="With Box"
        value={`${stats.boxIncludedCount}/${totalSneakers}`}
        subtitle={`${stats.boxIncludedPercent.toFixed(0)}% complete`}
        icon={Package}
        variant="compact"
      />
      <StatsCard
        title="OG All"
        value={`${stats.ogAllCount}/${totalSneakers}`}
        subtitle={`${stats.ogAllPercent.toFixed(0)}% complete set`}
        icon={Award}
        variant="compact"
      />
      <StatsCard
        title="Limited Editions"
        value={stats.limitedEditionCount}
        subtitle={`${stats.limitedEditionPercent.toFixed(0)}% of collection`}
        icon={Sparkles}
        variant="compact"
      />
      <StatsCard
        title="Top Collab"
        value={stats.topCollaboration || "None"}
        subtitle={stats.collaborationCount > 0 ? `${stats.collaborationCount} collabs total` : undefined}
        icon={Users}
        variant="compact"
      />
      <StatsCard
        title="Avg Condition"
        value={conditionLabel}
        subtitle={`${stats.deadstockCount} DS pairs`}
        icon={Star}
        variant="compact"
      />
    </div>
  );
};
