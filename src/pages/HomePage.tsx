import { useState, useEffect } from "react";
import { NewAppLayout } from "@/components/NewAppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Camera, ChevronRight, Watch, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfWeek, endOfWeek, subDays } from "date-fns";
import { motion } from "framer-motion";
import { UserAvatarById } from "@/components/UserAvatarById";
import { AspectRatio } from "@/components/ui/aspect-ratio";

interface WeeklyWear {
  watchId: string;
  brand: string;
  model: string;
  dialColor: string;
  imageUrl: string | null;
  days: number;
}

interface TrendingWatch {
  brand: string;
  model: string;
  wearCount: number;
  users: string[];
}

export default function HomePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [weeklyWears, setWeeklyWears] = useState<WeeklyWear[]>([]);
  const [trendingWatches, setTrendingWatches] = useState<TrendingWatch[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd");
      const weekEnd = format(endOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd");

      // Fetch user's weekly wear data
      const { data: wearData } = await supabase
        .from("wear_entries")
        .select(`
          watch_id,
          days,
          watches (
            id,
            brand,
            model,
            dial_color,
            ai_image_url
          )
        `)
        .eq("user_id", user?.id)
        .gte("wear_date", weekStart)
        .lte("wear_date", weekEnd);

      if (wearData) {
        const wearMap = new Map<string, WeeklyWear>();
        wearData.forEach((entry: any) => {
          if (entry.watches) {
            const watchId = entry.watches.id;
            const existing = wearMap.get(watchId);
            if (existing) {
              existing.days += entry.days;
            } else {
              wearMap.set(watchId, {
                watchId,
                brand: entry.watches.brand,
                model: entry.watches.model,
                dialColor: entry.watches.dial_color,
                imageUrl: entry.watches.ai_image_url,
                days: entry.days,
              });
            }
          }
        });
        setWeeklyWears(Array.from(wearMap.values()).sort((a, b) => b.days - a.days));
      }

      // Fetch trending watches from all users (shared only)
      const { data: trendingData } = await supabase
        .from("wear_entries")
        .select(`
          watch_id,
          user_id,
          days,
          watches!inner (
            id,
            brand,
            model,
            is_shared
          )
        `)
        .eq("watches.is_shared", true)
        .gte("wear_date", format(subDays(new Date(), 7), "yyyy-MM-dd"));

      if (trendingData) {
        const trendMap = new Map<string, { brand: string; model: string; count: number; users: Set<string> }>();
        trendingData.forEach((entry: any) => {
          if (entry.watches) {
            const key = `${entry.watches.brand}-${entry.watches.model}`;
            const existing = trendMap.get(key);
            if (existing) {
              existing.count += entry.days;
              existing.users.add(entry.user_id);
            } else {
              trendMap.set(key, {
                brand: entry.watches.brand,
                model: entry.watches.model,
                count: entry.days,
                users: new Set([entry.user_id]),
              });
            }
          }
        });
        setTrendingWatches(
          Array.from(trendMap.values())
            .map((t) => ({ brand: t.brand, model: t.model, wearCount: t.count, users: Array.from(t.users) }))
            .sort((a, b) => b.wearCount - a.wearCount)
            .slice(0, 5)
        );
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <NewAppLayout>
      <div className="p-4 space-y-6">
        {/* Quick Log CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-primary/80 p-6 text-primary-foreground"
        >
          <div className="relative z-10">
            <h2 className="text-lg font-semibold mb-2">Wrist Check</h2>
            <p className="text-sm opacity-90 mb-4">What are you wearing today?</p>
            <Button
              onClick={() => navigate("/log")}
              variant="secondary"
              className="gap-2"
            >
              <Camera className="h-4 w-4" />
              Log Now
            </Button>
          </div>
          <Watch className="absolute right-4 bottom-4 h-24 w-24 opacity-20" />
        </motion.div>

        {/* Your Week */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">Your Week</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/profile")}
              className="text-muted-foreground"
            >
              See All <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>

          {isLoading ? (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="w-32 h-40 rounded-xl bg-muted animate-pulse flex-shrink-0" />
              ))}
            </div>
          ) : weeklyWears.length > 0 ? (
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4">
              {weeklyWears.map((wear, index) => (
                <motion.div
                  key={wear.watchId}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex-shrink-0 w-32"
                >
                  <Card
                    className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => navigate(`/watch/${wear.watchId}`)}
                  >
                    <AspectRatio ratio={1}>
                      {wear.imageUrl ? (
                        <img
                          src={wear.imageUrl}
                          alt={`${wear.brand} ${wear.model}`}
                          className="object-cover w-full h-full"
                        />
                      ) : (
                        <div className="w-full h-full bg-muted flex items-center justify-center">
                          <Watch className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}
                    </AspectRatio>
                    <CardContent className="p-3">
                      <p className="text-xs font-medium text-foreground truncate">
                        {wear.brand}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {wear.model}
                      </p>
                      <p className="text-xs text-primary mt-1">
                        {wear.days} {wear.days === 1 ? "day" : "days"}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          ) : (
            <Card className="p-8 text-center">
              <Watch className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">No watches logged this week</p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => navigate("/log")}
              >
                Log Your First Watch
              </Button>
            </Card>
          )}
        </section>

        {/* Most Worn This Week (Community) */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Trending This Week</h2>
          </div>

          {trendingWatches.length > 0 ? (
            <div className="space-y-3">
              {trendingWatches.map((watch, index) => (
                <motion.div
                  key={`${watch.brand}-${watch.model}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-foreground">
                          {watch.brand} {watch.model}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Worn {watch.wearCount} times by {watch.users.length} collectors
                        </p>
                      </div>
                      <div className="flex -space-x-2">
                        {watch.users.slice(0, 3).map((uId) => (
                          <UserAvatarById key={uId} userId={uId} size="sm" />
                        ))}
                        {watch.users.length > 3 && (
                          <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                            +{watch.users.length - 3}
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          ) : (
            <Card className="p-6 text-center">
              <p className="text-muted-foreground text-sm">
                No community wear data yet. Be the first to share!
              </p>
            </Card>
          )}
        </section>

        {/* Sponsored Content Placeholder */}
        <section className="opacity-50">
          <Card className="p-6 border-dashed">
            <p className="text-center text-sm text-muted-foreground">
              Sponsored content space
            </p>
          </Card>
        </section>
      </div>
    </NewAppLayout>
  );
}
