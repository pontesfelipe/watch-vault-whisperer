import { supabase } from "@/integrations/supabase/client";

// Canonical capitalization for well-known brands. Keys are lowercased.
const CANONICAL_BRANDS: Record<string, string> = {
  "tag heuer": "TAG Heuer",
  "iwc": "IWC",
  "iwc schaffhausen": "IWC Schaffhausen",
  "oris": "ORIS",
  "a. lange & sohne": "A. Lange & Söhne",
  "a. lange & söhne": "A. Lange & Söhne",
  "f.p. journe": "F.P. Journe",
  "h. moser & cie": "H. Moser & Cie.",
  "mb&f": "MB&F",
  "bvlgari": "Bvlgari",
  "iwc mark": "IWC",
  "omega": "Omega",
  "rolex": "Rolex",
  "patek philippe": "Patek Philippe",
  "audemars piguet": "Audemars Piguet",
  "vacheron constantin": "Vacheron Constantin",
  "jaeger-lecoultre": "Jaeger-LeCoultre",
  "jaeger lecoultre": "Jaeger-LeCoultre",
  "breitling": "Breitling",
  "longines": "Longines",
  "panerai": "Panerai",
  "tudor": "Tudor",
  "cartier": "Cartier",
  "hublot": "Hublot",
  "zenith": "Zenith",
  "grand seiko": "Grand Seiko",
  "seiko": "Seiko",
  "citizen": "Citizen",
  "casio": "Casio",
  "g-shock": "G-Shock",
  "swatch": "Swatch",
  "tissot": "Tissot",
  "hamilton": "Hamilton",
  "bell & ross": "Bell & Ross",
  "richard mille": "Richard Mille",
  "ulysse nardin": "Ulysse Nardin",
  "blancpain": "Blancpain",
  "chopard": "Chopard",
  "montblanc": "Montblanc",
  "nomos": "NOMOS Glashütte",
  "nomos glashutte": "NOMOS Glashütte",
  "nomos glashütte": "NOMOS Glashütte",
  "glashutte original": "Glashütte Original",
  "glashütte original": "Glashütte Original",
};

function titleCase(input: string): string {
  return input
    .split(/\s+/)
    .map((w) =>
      w.length === 0
        ? w
        : w[0].toUpperCase() + w.slice(1).toLowerCase()
    )
    .join(" ");
}

/**
 * Normalize a brand string to a consistent capitalization, so the same brand
 * doesn't appear multiple times with different casing in charts/filters.
 *
 * Order of preference:
 *   1. Match an existing brand the user already has (case-insensitive) — reuse it.
 *   2. Match a known canonical brand mapping.
 *   3. Fall back to Title Case.
 */
export async function normalizeBrand(raw: string, userId?: string): Promise<string> {
  const cleaned = (raw || "").replace(/\s+/g, " ").trim();
  if (!cleaned) return cleaned;
  const key = cleaned.toLowerCase();

  if (userId) {
    try {
      const { data } = await supabase
        .from("watches")
        .select("brand")
        .eq("user_id", userId)
        .ilike("brand", cleaned)
        .limit(1)
        .maybeSingle();
      if (data?.brand) return data.brand;
    } catch {
      // ignore, fall through
    }
  }

  if (CANONICAL_BRANDS[key]) return CANONICAL_BRANDS[key];
  return titleCase(cleaned);
}

/** Synchronous variant — canonical map then Title Case. */
export function normalizeBrandSync(raw: string): string {
  const cleaned = (raw || "").replace(/\s+/g, " ").trim();
  if (!cleaned) return cleaned;
  const key = cleaned.toLowerCase();
  if (CANONICAL_BRANDS[key]) return CANONICAL_BRANDS[key];
  return titleCase(cleaned);
}

/** Normalize free-text fields like model / dial color — trim + collapse spaces. */
export function normalizeText(raw: string | null | undefined): string {
  return (raw || "").replace(/\s+/g, " ").trim();
}
