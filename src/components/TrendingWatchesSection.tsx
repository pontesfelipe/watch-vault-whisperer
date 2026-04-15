import { usePlatformMostWorn } from "@/hooks/usePlatformMostWorn";
import { Watch, TrendingUp, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";

export function TrendingWatchesSection() {
  const { platformData, friendsData, loading } = usePlatformMostWorn();

  if (loading) {
    return (
      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-textMuted flex items-center gap-1.5">
          <TrendingUp className="h-3.5 w-3.5" />
          Trending This Week
        </h2>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16 w-full rounded-2xl" />
          ))}
        </div>
      </section>
    );
  }

  if (platformData.length === 0 && friendsData.length === 0) return null;

  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-textMuted flex items-center gap-1.5">
        <TrendingUp className="h-3.5 w-3.5 text-accent" />
        Trending This Week
      </h2>

      <Tabs defaultValue="community" className="w-full">
        <TabsList className="grid w-full grid-cols-2 h-8">
          <TabsTrigger value="community" className="text-xs gap-1">
            <TrendingUp className="h-3 w-3" />
            Community
          </TabsTrigger>
          <TabsTrigger value="friends" className="text-xs gap-1">
            <Users className="h-3 w-3" />
            Friends
          </TabsTrigger>
        </TabsList>

        <TabsContent value="community" className="mt-3 space-y-2">
          {platformData.length === 0 ? (
            <p className="text-xs text-textMuted text-center py-4">No data yet this week</p>
          ) : (
            platformData.slice(0, 5).map((item, i) => (
              <TrendingRow key={`${item.brand}-${item.model}`} item={item} rank={i + 1} />
            ))
          )}
        </TabsContent>

        <TabsContent value="friends" className="mt-3 space-y-2">
          {friendsData.length === 0 ? (
            <p className="text-xs text-textMuted text-center py-4">No friend activity this week</p>
          ) : (
            friendsData.slice(0, 5).map((item, i) => (
              <TrendingRow key={`${item.brand}-${item.model}`} item={item} rank={i + 1} />
            ))
          )}
        </TabsContent>
      </Tabs>
    </section>
  );
}

function TrendingRow({ item, rank }: { item: { brand: string; model: string; ai_image_url: string | null; wear_count: number; user_count: number }; rank: number }) {
  return (
    <Card className="flex items-center gap-3 p-3 border-borderSubtle">
      <span className="text-sm font-bold text-accent w-5 text-center shrink-0">
        {rank}
      </span>
      <div className="h-10 w-10 rounded-xl bg-surfaceMuted overflow-hidden shrink-0">
        {item.ai_image_url ? (
          <img src={item.ai_image_url} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full flex items-center justify-center">
            <Watch className="h-4 w-4 text-textMuted" />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-textMain truncate">{item.brand}</p>
        <p className="text-xs text-textMuted truncate">{item.model}</p>
      </div>
      <div className="text-right shrink-0">
        <p className="text-xs font-semibold text-textMain">{item.wear_count}×</p>
        <p className="text-[10px] text-textMuted">{item.user_count} {item.user_count === 1 ? 'collector' : 'collectors'}</p>
      </div>
    </Card>
  );
}
