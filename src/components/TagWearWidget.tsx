import { useEffect, useState } from "react";
import { Tag as TagIcon, Calendar, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface TagWearWidgetProps {
  tagId: string;
  tagName: string;
}

interface WearStats {
  entryCount: number;
  totalDays: number;
  topItem: { brand: string; model: string; count: number } | null;
  loading: boolean;
}

export const TagWearWidget = ({ tagId, tagName }: TagWearWidgetProps) => {
  const { user } = useAuth();
  const [stats, setStats] = useState<WearStats>({
    entryCount: 0,
    totalDays: 0,
    topItem: null,
    loading: true,
  });

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      setStats((s) => ({ ...s, loading: true }));

      // Fetch wear entries linked to this tag
      const { data: tagRows } = await (supabase.from("wear_entry_tags" as any) as any)
        .select("wear_entry_id")
        .eq("tag_id", tagId);

      const entryIds = (tagRows as Array<{ wear_entry_id: string }> | null)?.map(
        (r) => r.wear_entry_id
      ) ?? [];

      if (entryIds.length === 0) {
        setStats({ entryCount: 0, totalDays: 0, topItem: null, loading: false });
        return;
      }

      const { data: entries } = await supabase
        .from("wear_entries")
        .select("id, days, watch_id")
        .in("id", entryIds)
        .eq("user_id", user.id);

      const safeEntries = entries ?? [];
      const totalDays = safeEntries.reduce((sum, e) => sum + (e.days || 0), 0);

      // Compute top item by count
      const counts = new Map<string, number>();
      for (const e of safeEntries) {
        counts.set(e.watch_id, (counts.get(e.watch_id) ?? 0) + 1);
      }
      let topWatchId: string | null = null;
      let topCount = 0;
      counts.forEach((count, id) => {
        if (count > topCount) {
          topCount = count;
          topWatchId = id;
        }
      });

      let topItem: WearStats["topItem"] = null;
      if (topWatchId) {
        const { data: watch } = await supabase
          .from("watches")
          .select("brand, model")
          .eq("id", topWatchId)
          .maybeSingle();
        if (watch) {
          topItem = { brand: watch.brand, model: watch.model, count: topCount };
        }
      }

      setStats({
        entryCount: safeEntries.length,
        totalDays: Math.round(totalDays * 100) / 100,
        topItem,
        loading: false,
      });
    };

    load();
  }, [tagId, user]);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <TagIcon className="w-4 h-4 text-accent" />
          <span className="truncate">{tagName}</span>
          <Badge variant="secondary" className="ml-auto text-xs">Tag</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {stats.loading ? (
          <p className="text-sm text-textMuted">Loading…</p>
        ) : stats.entryCount === 0 ? (
          <p className="text-sm text-textMuted">
            No wear entries tagged yet. Add this tag when logging wear.
          </p>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="w-3.5 h-3.5 text-textMuted" />
              <span className="text-textMuted">Entries:</span>
              <span className="font-semibold text-textMain">{stats.entryCount}</span>
              <span className="text-textMuted ml-2">·</span>
              <span className="text-textMuted">{stats.totalDays} day{stats.totalDays === 1 ? "" : "s"}</span>
            </div>
            {stats.topItem && (
              <div className="flex items-start gap-2 text-sm">
                <TrendingUp className="w-3.5 h-3.5 text-textMuted mt-0.5" />
                <div className="min-w-0">
                  <p className="text-textMuted text-xs">Most worn with this tag</p>
                  <p className="font-medium text-textMain truncate">
                    {stats.topItem.brand} {stats.topItem.model}
                    <span className="text-textMuted font-normal ml-2">
                      ({stats.topItem.count}×)
                    </span>
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};