import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Watch, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWatchData } from "@/hooks/useWatchData";
import { useCollection } from "@/contexts/CollectionContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfWeek, endOfWeek, isWithinInterval, parseISO } from "date-fns";
import { enUS, es, fr, pt, ja, zhCN, type Locale } from "date-fns/locale";
import { motion } from "framer-motion";
import { QuickLogSheet } from "@/components/QuickLogSheet";
import { QuickAddWearDialog } from "@/components/QuickAddWearDialog";
import { WristCheckDialog } from "@/components/WristCheckDialog";
import { TrendingWatchesSection } from "@/components/TrendingWatchesSection";
import { WearCalendar } from "@/components/WearCalendar";
import { CollectionSwitcher } from "@/components/CollectionSwitcher";
import { getCollectionConfig } from "@/types/collection";
import { useTranslation } from "react-i18next";

const Home = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { selectedCollectionId, currentCollectionType } = useCollection();
  const { watches, wearEntries, loading, refetch } = useWatchData(selectedCollectionId);
  const [quickLogWatch, setQuickLogWatch] = useState<any>(null);
  const [quickLogOpen, setQuickLogOpen] = useState(false);
  const [wristCheckOpen, setWristCheckOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [username, setUsername] = useState<string | undefined>();
  const { t, i18n } = useTranslation();

  useEffect(() => {
    if (!user) return;
    supabase.from('profiles').select('username').eq('id', user.id).maybeSingle()
      .then(({ data }) => { if (data?.username) setUsername(data.username); });
  }, [user]);

  const config = currentCollectionType ? getCollectionConfig(currentCollectionType) : getCollectionConfig('watches');

  const dateLocale = useMemo(() => {
    const localeMap: Record<string, Locale> = { en: enUS, es, fr, pt, ja, zh: zhCN };
    return localeMap[i18n.language] || enUS;
  }, [i18n.language]);

  const handleWatchCardTap = (watch: any) => {
    setQuickLogWatch(watch);
    setQuickLogOpen(true);
  };

  // Filter most worn to current week only
  const weekMostWorn = useMemo(() => {
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

    const weekEntries = wearEntries.filter((e: any) => {
      try {
        const d = parseISO(e.wear_date);
        return isWithinInterval(d, { start: weekStart, end: weekEnd });
      } catch {
        return false;
      }
    });

    const counts: Record<string, number> = {};
    weekEntries.forEach((e: any) => {
      counts[e.watch_id] = (counts[e.watch_id] || 0) + e.days;
    });

    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([id, count]) => ({
        watch: watches.find((w: any) => w.id === id),
        count,
      }))
      .filter((item) => item.watch);
  }, [watches, wearEntries]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent" />
      </div>
    );
  }

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t("home.goodMorning");
    if (hour < 17) return t("home.goodAfternoon");
    return t("home.goodEvening");
  };

  return (
    <div className="space-y-6 pb-4">
      {/* Greeting + Collection Switcher */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-textMain">
            {getGreeting()}
          </h1>
          <p className="text-sm text-textMuted mt-0.5">
            {format(new Date(), "EEEE, MMMM d", { locale: dateLocale })}
          </p>
        </div>
        <CollectionSwitcher />
      </div>

      {/* Wrist Check CTA */}
      <div className="flex gap-2">
        <motion.div whileTap={{ scale: 0.98 }} className="flex-1">
          <Button
            onClick={() => setWristCheckOpen(true)}
            className="w-full h-14 rounded-2xl text-base font-semibold gap-3 shadow-lg active:scale-[0.98] transition-transform"
            size="lg"
          >
            <Plus className="h-5 w-5" />
            {t("home.wristCheck")}
          </Button>
        </motion.div>
        <motion.div whileTap={{ scale: 0.98 }}>
          <Button
            onClick={() => setShareDialogOpen(true)}
            variant="outline"
            className="h-14 w-14 rounded-2xl shadow-lg"
            size="icon"
            disabled={watches.length === 0}
          >
            <Share2 className="h-5 w-5" />
          </Button>
        </motion.div>
      </div>

      {/* Wear Calendar */}
      <section>
        <WearCalendar
          watches={watches}
          wearEntries={wearEntries}
          onWatchTap={handleWatchCardTap}
        />
      </section>

      {/* Most Worn This Week */}
      {watches.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-textMuted">
              {t("home.yourMostWornThisWeek")}
            </h2>
            <button
              onClick={() => navigate("/collection")}
              className="text-xs text-accent font-medium"
            >
              {t("home.viewAll")}
            </button>
          </div>

          {weekMostWorn.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-borderSubtle p-6 text-center">
              <Watch className="h-8 w-8 text-textMuted mx-auto mb-2" />
              <p className="text-sm text-textMuted">{t("home.noWearsThisWeek")}</p>
            </div>
          ) : (
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
              {weekMostWorn.slice(0, 6).map(({ watch, count }) => (
                <motion.div
                  key={watch.id}
                  className="shrink-0 w-28 cursor-pointer"
                  whileTap={{ scale: 0.96 }}
                  onClick={() => navigate(`/watch/${watch.id}`)}
                >
                  <div className="h-28 w-28 rounded-2xl bg-muted overflow-hidden mb-2">
                    {watch.ai_image_url ? (
                      <img
                        src={watch.ai_image_url}
                        alt={`${watch.brand} ${watch.model}`}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center">
                        <Watch className="h-8 w-8 text-textMuted" />
                      </div>
                    )}
                  </div>
                  <p className="text-xs font-medium text-textMain truncate">{watch.brand}</p>
                  <p className="text-[11px] text-textMuted truncate">{watch.model}</p>
                  <p className="text-[10px] text-accent font-medium">{t("home.days", { count })}</p>
                </motion.div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Trending This Week */}
      <TrendingWatchesSection />

      <QuickAddWearDialog
        watches={watches}
        onSuccess={() => refetch?.()}
        collectionType={currentCollectionType || 'watches'}
        externalOpen={wristCheckOpen}
        onExternalOpenChange={setWristCheckOpen}
      />

      <WristCheckDialog
        open={shareDialogOpen}
        onOpenChange={setShareDialogOpen}
        watches={watches.filter((w: any) => w.status === 'current')}
        username={username}
      />

      <QuickLogSheet
        open={quickLogOpen}
        onOpenChange={setQuickLogOpen}
        watch={quickLogWatch}
        onSuccess={() => refetch?.()}
      />
    </div>
  );
};

export default Home;
