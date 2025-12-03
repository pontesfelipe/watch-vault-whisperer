import { Tables } from "@/integrations/supabase/types";

type Watch = Tables<"watches">;

export function getTotalCost(watches: Watch[]) {
  return watches.reduce((sum, w) => sum + (w.cost ?? 0), 0);
}

export function getTotalMarketValue(watches: Watch[]) {
  return watches.reduce(
    (sum, w) => sum + (w.average_resale_price ?? w.cost ?? 0),
    0
  );
}

export function getDepreciationStats(watches: Watch[]) {
  return watches.map((w) => {
    const market = w.average_resale_price ?? w.cost ?? 0;
    const delta = market - (w.cost ?? 0);
    const deltaPct = (delta / (w.cost || 1)) * 100;
    return { watchId: w.id, delta, deltaPct };
  });
}

export function getTotalMSRP(watches: Watch[]) {
  return watches.reduce((sum, w) => sum + (w.msrp ?? w.cost ?? 0), 0);
}

export function getAverageWearPerWatch(watches: Watch[], wearEntries: { watch_id: string }[]) {
  if (watches.length === 0) return 0;
  const totalWears = wearEntries.length;
  return totalWears / watches.length;
}
