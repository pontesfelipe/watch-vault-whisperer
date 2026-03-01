import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const COMPOSITION_RULES = [
  'SQUARE 1:1 aspect ratio composition',
  'The watch must be PERFECTLY CENTERED in the frame, both horizontally and vertically',
  'CRITICAL SIZE RULE: Regardless of the actual case diameter of the watch, ALL watches must appear the SAME visual size in the image - the watch case (excluding strap) must fill exactly 60% of the image width and 50% of the image height. This is a normalized catalog view where a 44mm Panerai and a 40mm IWC must look the same size in the frame',
  'STRAIGHT-ON front-facing view looking directly at the dial face - absolutely NO side angles',
  'Maximum 3-5 degree tilt for minimal depth perception - the full dial must be completely visible and readable',
  'The watch must be UPRIGHT with 12 o\'clock at the top and strap/bracelet running vertically (top-to-bottom), never horizontal/sideways',
  'For rectangular watches, long axis must be vertical with crown on the 3 o\'clock side; never rotated 90°',
  'Show a small portion of the bracelet/strap extending from both lugs (about 1-2 links or 2cm of strap)',
  'DARK background: smooth gradient from charcoal (#2a2a2a) at edges to near-black (#111111) at center',
  'Professional studio lighting: soft diffused main light from upper-left, subtle fill light from right',
  'Sharp focus on entire dial face - every index, hand, and subdial must be crisp',
  'No reflections on crystal, no glare spots',
  'Ultra high resolution, photorealistic, luxury catalog quality',
].join('. ');

function normalizeModelForSearch(model: string): string {
  return model
    .replace(/\(likely[^)]*\)/gi, '')
    .replace(/\(reference[^)]*\)/gi, '')
    .replace(/\([^)]*generation[^)]*\)/gi, '')
    .replace(/\(Unsure[^)]*\)/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractYearHint(value?: string | null): string | null {
  if (!value) return null;
  const match = String(value).match(/\b(19|20)\d{2}\b/);
  return match?.[0] ?? null;
}

interface VerifiedEdition {
  officialName: string;
  dialDescription: string;
  bezelDescription: string;
  braceletOrStrap: string;
  keyDesignElements: string;
  complications: string;
  notThisWatch: string;
  negativeElements: string;
}

function getEditionOverride(watch: any): VerifiedEdition | null {
  const brand = (watch.brand || '').toLowerCase();
  const model = normalizeModelForSearch(watch.model || '').toLowerCase();

  if (brand.includes('casio') && model.includes('databank')) {
    return {
      officialName: 'Casio Databank Telememo 30 Ref. DB-36-1AVCF',
      dialDescription: 'Rectangular black/grey LCD digital display with segmented numerals and databank indicators; utilitarian digital face with no analog hands',
      bezelDescription: 'Rectangular resin case with a simple utilitarian bezel/frame, no rotating bezel, no tachymeter, no dive markings',
      braceletOrStrap: 'Black resin strap integrated into the rectangular digital case',
      keyDesignElements: 'Classic 1990s Databank look, rectangular case silhouette, multi-function digital layout, side pushers sized for a compact digital watch',
      complications: 'Digital-multifunction only: telememo/databank memory, alarm, stopwatch, timer, dual time/date display',
      notThisWatch: 'NOT an analog Casio, NOT a G-Shock, NOT a round dive watch, NOT a smartwatch, NOT any watch with mechanical hands',
      negativeElements: 'NO analog hands, NO round case, NO chronograph subdials, NO rotating dive bezel, NO tachymeter ring, NO smart watch UI',
    };
  }

  if (brand.includes('breitling') && model.includes('navitimer') && model.includes('gmt')) {
    return {
      officialName: 'Breitling Navitimer Automatic GMT 41 Ice Blue Ref. A32310171C1A1',
      dialDescription: 'Ice blue dial with central hour/minute/seconds hands plus a distinct GMT hand and a date window, no chronograph subdials',
      bezelDescription: 'Classic Navitimer circular slide-rule bezel architecture with fine markings, non-dive style',
      braceletOrStrap: 'Stainless steel bracelet consistent with catalog product configuration',
      keyDesignElements: 'Aviation Navitimer identity, circular slide-rule bezel, ice-blue dial tone, elegant polished case with no chronograph pushers',
      complications: 'GMT and date only (plus standard time display), no chronograph',
      notThisWatch: 'NOT a Navitimer chronograph (which has multiple subdials and pushers), NOT a diver, NOT a digital/smartwatch',
      negativeElements: 'NO chronograph subdials, NO chronograph pushers, NO dive bezel, NO oversized fantasy lugs/case, NO digital display',
    };
  }

  if (brand.includes('trafford')) {
    return {
      officialName: `${watch.brand} ${watch.model}`,
      dialDescription: `Upright dial matching ${watch.dial_color || 'the specified'} color with clean legible indices and logo orientation`,
      bezelDescription: 'Bezel and case must be upright in portrait orientation, not rotated',
      braceletOrStrap: watch.bracelet_hint || 'Strap/bracelet consistent with official product configuration',
      keyDesignElements: 'Realistic Trafford proportions with crown at 3 o’clock and dial text upright',
      complications: watch.type || 'Time-only configuration matching this specific model',
      notThisWatch: 'NOT sideways, NOT a stretched case, NOT a rotated horizontal render',
      negativeElements: 'NO 90° rotation, NO horizontal orientation, NO distorted case geometry',
    };
  }

  return null;
}

async function verifyEdition(watch: any, LOVABLE_API_KEY: string): Promise<VerifiedEdition | null> {
  try {
    const cleanModel = normalizeModelForSearch(watch.model);
    const contextParts = [
      `Brand: ${watch.brand}`,
      `Model name as entered: ${watch.model}`,
      `Dial color: ${watch.dial_color || 'unknown'}`,
      `Type/category: ${watch.type || 'unknown'}`,
      watch.case_size ? `Case size: ${watch.case_size}` : '',
      watch.bracelet_hint ? `Bracelet/strap hint: ${watch.bracelet_hint}` : '',
      watch.year_hint ? `Year/era hint: ${watch.year_hint}` : '',
      watch.movement ? `Movement: ${watch.movement}` : '',
      watch.what_i_like ? `Owner notes about what they like: ${watch.what_i_like}` : '',
      watch.why_bought ? `Owner notes about why they bought it: ${watch.why_bought}` : '',
    ].filter(Boolean).join('\n');

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `You are a horological identification expert. Given watch metadata from a collector, identify the EXACT edition and describe it with absolute precision.

CRITICAL RULES:
- COMPLICATIONS ARE IDENTITY: A "Navitimer GMT" has a GMT hand and 24-hour rotating bezel — it does NOT have chronograph subdials or chronograph pushers. A "Navitimer Chronograph" has subdials and pushers. These are COMPLETELY DIFFERENT watches. The "type" field is the ground truth for complications.
- DIAL COLOR IS ABSOLUTE: The owner's stated dial color overrides everything.
- DIGITAL = DIGITAL: If type says "Digital" the watch has an LCD/LED screen, NOT an analog dial with hands.
- CASE SIZE + BRACELET + YEAR are strong identity clues. Use them.
- Owner's "what_i_like" and "why_bought" notes contain edition-defining clues. Read them carefully.

Return ONLY valid JSON:
{
  "officialName": "Most precise official name with reference number",
  "dialDescription": "EXACT dial: color, texture, indices, subdials if any, special patterns/markings unique to this edition",
  "bezelDescription": "EXACT bezel: material, type (dive/GMT-24hr/tachymeter/smooth/digital-no-bezel), rotation, colors",
  "braceletOrStrap": "EXACT bracelet/strap: material, color, pattern, clasp",
  "keyDesignElements": "Unique identifiers: hand style, crown shape, case details, special edition marks, lume color",
  "complications": "ONLY the real complications",
  "notThisWatch": "Common models this could be confused with and WHY it's different",
  "negativeElements": "Visual elements that MUST NOT appear"
}`
          },
          { role: "user", content: contextParts }
        ],
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      console.error(`Edition verification failed for ${watch.brand} ${cleanModel}: ${response.status}`);
      return null;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content?.trim();
    if (!content) return null;

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;

    const parsed = JSON.parse(jsonMatch[0]) as VerifiedEdition;
    console.log(`✓ Verified edition: ${parsed.officialName}`);
    return parsed;
  } catch (error) {
    console.error(`Edition verification error for ${watch.brand} ${watch.model}:`, error);
    return null;
  }
}

function buildVerifiedPrompt(watch: any, edition: VerifiedEdition): string {
  return [
    `⚠️ ABSOLUTE RESTRICTIONS — READ BEFORE GENERATING: ${edition.negativeElements}`,
    `⚠️ THIS IS NOT: ${edition.notThisWatch}`,
    `Generate a photorealistic product photo of EXACTLY the ${edition.officialName}`,
    `COMPLICATIONS — ONLY THESE, nothing else: ${edition.complications}`,
    `DIAL: ${edition.dialDescription}`,
    `BEZEL: ${edition.bezelDescription}`,
    `BRACELET/STRAP: ${edition.braceletOrStrap}`,
    watch.case_size ? `CASE SIZE cue: ${watch.case_size}` : '',
    watch.year_hint ? `YEAR cue: ${watch.year_hint}` : '',
    `DISTINGUISHING FEATURES: ${edition.keyDesignElements}`,
    COMPOSITION_RULES,
  ].filter(Boolean).join('. ');
}

function buildFallbackPrompt(watch: any): string {
  const hints: string[] = [];
  hints.push(`EXACT model/edition: ${watch.brand} ${watch.model}`);
  if (watch.dial_color) hints.push(`Dial color MUST be: ${watch.dial_color}`);
  if (watch.type) hints.push(`Category/complication: ${watch.type}`);
  if (watch.case_size) hints.push(`Case size: ${watch.case_size}`);
  if (watch.bracelet_hint) hints.push(`Bracelet/strap cue: ${watch.bracelet_hint}`);
  if (watch.year_hint) hints.push(`Year/era cue: ${watch.year_hint}`);
  if (watch.movement) hints.push(`Movement: ${watch.movement}`);
  if (watch.what_i_like) hints.push(`Owner notes (use for design cues): ${watch.what_i_like}`);
  if (watch.why_bought) hints.push(`Purchase context (may contain edition info): ${watch.why_bought}`);

  return [
    `Create an ACCURATE photorealistic product photograph of the EXACT ${watch.brand} ${watch.model} wristwatch`,
    `CRITICAL: This is NOT a generic ${watch.brand} watch. It is specifically the "${watch.model}" edition/reference`,
    hints.join('. '),
    'Render the exact real-world reference/edition when identifiable; avoid generic lookalikes',
    COMPOSITION_RULES,
  ].join('. ');
}

function buildVerifiedReferencePrompt(watch: any, edition: VerifiedEdition): string {
  return [
    `⚠️ ABSOLUTE RESTRICTIONS — READ BEFORE GENERATING: ${edition.negativeElements}`,
    `⚠️ THIS IS NOT: ${edition.notThisWatch}`,
    'Use the reference image(s) ONLY to identify design details (dial layout, hand style, bezel markings)',
    'Do NOT copy framing or angle',
    `This is EXACTLY the ${edition.officialName}`,
    `COMPLICATIONS — ONLY THESE, nothing else: ${edition.complications}`,
    `DIAL: ${edition.dialDescription}`,
    `BEZEL: ${edition.bezelDescription}`,
    `BRACELET/STRAP: ${edition.braceletOrStrap}`,
    watch.case_size ? `CASE SIZE cue: ${watch.case_size}` : '',
    watch.year_hint ? `YEAR cue: ${watch.year_hint}` : '',
    `DISTINGUISHING FEATURES: ${edition.keyDesignElements}`,
    `CRITICAL OVERRIDE — IGNORE REFERENCE IMAGE FRAMING: ${COMPOSITION_RULES}`,
  ].filter(Boolean).join('. ');
}

async function normalizeImageComposition(
  watch: any,
  edition: VerifiedEdition | null,
  imageDataUrl: string,
  LOVABLE_API_KEY: string
): Promise<string | null> {
  try {
    const identity = edition?.officialName || `${watch.brand} ${watch.model}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-pro-image-preview",
        messages: [
          {
            role: "system",
            content: "You are a luxury watch catalog retoucher. Never redesign or change watch identity. You may ONLY reframe, recenter, and rescale the existing watch photo to match strict composition standards."
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: [
                  `Retouch this image of ${identity} without changing model identity or design details`,
                  'DO NOT alter dial layout, hand style, bezel architecture, markers, case shape, bracelet type, or color palette',
                  'ONLY normalize composition and orientation',
                  COMPOSITION_RULES,
                  'Absolute target: watch case (excluding strap) must occupy exactly 60% of image width and 50% of image height, perfectly centered',
                ].join('. ')
              },
              {
                type: "image_url",
                image_url: { url: imageDataUrl }
              }
            ]
          }
        ],
        modalities: ["image", "text"],
      }),
    });

    if (!response.ok) {
      console.warn(`Composition normalization failed for ${identity}: ${response.status}`);
      return null;
    }

    const data = await response.json();
    const normalizedImageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    return normalizedImageUrl || null;
  } catch (error) {
    console.warn(`Composition normalization error for ${watch.brand} ${watch.model}:`, error);
    return null;
  }
}

async function findReferenceImageUrls(watch: any, edition: VerifiedEdition | null, LOVABLE_API_KEY: string): Promise<string[]> {
  try {
    const searchName = edition?.officialName || `${watch.brand} ${normalizeModelForSearch(watch.model)}`;
    const cueText = [
      watch.dial_color ? `Dial color: ${watch.dial_color}` : '',
      watch.type ? `Complication type: ${watch.type}` : '',
      watch.case_size ? `Case size: ${watch.case_size}` : '',
      watch.bracelet_hint ? `Bracelet/strap: ${watch.bracelet_hint}` : '',
      watch.year_hint ? `Year: ${watch.year_hint}` : '',
    ].filter(Boolean).join('. ');

    console.log(`Searching references for: ${searchName}`);
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: "You are a watch reference image hunter. Return ONLY a JSON array of up to 4 URLs. Prioritize official brand product pages or direct official studio product image URLs for the EXACT reference/edition requested. Strongly prefer front-facing catalog shots that clearly show dial layout, bezel text, and bracelet architecture. Avoid marketplace listings, user photos, wrist shots, and lifestyle/editorial images."
          },
          {
            role: "user",
            content: `Find the best official reference image URLs for the EXACT watch edition: ${searchName}. ${cueText}. Return only JSON array.`
          }
        ],
        temperature: 0.2,
      }),
    });

    if (!response.ok) return [];
    const data = await response.json();
    const content = data.choices?.[0]?.message?.content?.trim();
    if (!content || content.length > 8000) return [];

    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (Array.isArray(parsed)) {
        return parsed.filter((url) => typeof url === 'string' && /^https?:\/\//i.test(url)).slice(0, 4);
      }
    }

    const urlMatches = content.match(/https?:\/\/[^\s"'<>]+/gi) || [];
    return urlMatches.slice(0, 4);
  } catch { return []; }
}

async function resolveImageUrlFromHtmlPage(pageUrl: string): Promise<string | null> {
  try {
    const resp = await fetch(pageUrl, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; WatchVault/1.0)' } });
    if (!resp.ok) return null;
    const contentType = resp.headers.get('content-type') || '';
    if (!contentType.toLowerCase().includes('text/html')) return null;
    const html = await resp.text();
    const metaMatch = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)
      || html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i);
    if (!metaMatch?.[1]) return null;
    return new URL(metaMatch[1], pageUrl).toString();
  } catch { return null; }
}

async function fetchImageAsBase64(imageUrl: string): Promise<string | null> {
  try {
    let candidateUrl = imageUrl;
    if (!/\.(jpg|jpeg|png|webp)(\?|#|$)/i.test(candidateUrl)) {
      const extracted = await resolveImageUrlFromHtmlPage(candidateUrl);
      if (extracted) candidateUrl = extracted;
    }

    const resp = await fetch(candidateUrl, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; WatchVault/1.0)' } });
    if (!resp.ok) return null;
    const ct = (resp.headers.get('content-type') || '').toLowerCase();
    if (!ct.startsWith('image/')) return null;
    const buf = await resp.arrayBuffer();
    const bytes = new Uint8Array(buf);
    if (bytes.length < 5000) return null;
    let binary = '';
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
    return `data:${ct};base64,${btoa(binary)}`;
  } catch { return null; }
}

async function collectReferenceImages(urls: string[], maxImages = 3): Promise<string[]> {
  const refs: string[] = [];
  for (const url of urls) {
    if (refs.length >= maxImages) break;
    const base64 = await fetchImageAsBase64(url);
    if (base64) refs.push(base64);
  }
  return refs;
}

async function generateImageForWatch(
  supabaseClient: any,
  watch: any,
  LOVABLE_API_KEY: string
): Promise<{ watchId: string; success: boolean; error?: string; officialName?: string }> {
  try {
    console.log(`\n━━━ Processing: ${watch.brand} ${watch.model} (dial: ${watch.dial_color || 'unspecified'}) ━━━`);

    const overrideEdition = getEditionOverride(watch);
    const edition = overrideEdition || await verifyEdition(watch, LOVABLE_API_KEY);
    if (overrideEdition) console.log(`  Using hard override edition: ${overrideEdition.officialName}`);
    if (edition) {
      console.log(`  Verified: ${edition.officialName}`);
      console.log(`  Negative: ${edition.negativeElements}`);
      console.log(`  Complications: ${edition.complications}`);
    }

    const foundUrls = await findReferenceImageUrls(watch, edition, LOVABLE_API_KEY);
    const referenceImages = await collectReferenceImages(foundUrls, 3);

    const systemMsg = edition ? {
      role: "system",
      content: `You are generating a product photo of EXACTLY the ${edition.officialName}. ABSOLUTE RULES you MUST follow:\n1. ${edition.negativeElements}\n2. This watch is NOT: ${edition.notThisWatch}\n3. Only these complications exist: ${edition.complications}\nViolating these rules means the image is wrong.`
    } : null;

    let messages: any[];
    if (referenceImages.length > 0 && edition) {
      console.log(`Using ${referenceImages.length} reference image(s) + verified edition for ${edition.officialName}`);
      messages = [
        ...(systemMsg ? [systemMsg] : []),
        {
          role: "user",
          content: [
            { type: "text", text: buildVerifiedReferencePrompt(watch, edition) },
            ...referenceImages.map((url) => ({ type: "image_url", image_url: { url } }))
          ]
        }
      ];
    } else if (referenceImages.length > 0) {
      console.log(`Using ${referenceImages.length} reference image(s) (no verification) for ${watch.brand} ${watch.model}`);
      const fallbackHints = buildFallbackPrompt(watch);
      messages = [{
        role: "user",
        content: [
          { type: "text", text: `IMPORTANT: Use reference image(s) ONLY to identify design details. ${fallbackHints}` },
          ...referenceImages.map((url) => ({ type: "image_url", image_url: { url } }))
        ]
      }];
    } else if (edition) {
      console.log(`No reference found, using verified edition: ${edition.officialName}`);
      messages = [
        ...(systemMsg ? [systemMsg] : []),
        { role: "user", content: buildVerifiedPrompt(watch, edition) }
      ];
    } else {
      console.log(`No reference or verification, using fallback for ${watch.brand} ${watch.model}`);
      messages = [{ role: "user", content: buildFallbackPrompt(watch) }];
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "google/gemini-3-pro-image-preview", messages, modalities: ["image", "text"] }),
    });

    if (!response.ok) return { watchId: watch.id, success: false, error: `AI error: ${response.status}` };

    const data = await response.json();
    const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    if (!imageUrl) return { watchId: watch.id, success: false, error: 'No image generated' };

    const normalizedImageUrl = await normalizeImageComposition(watch, edition, imageUrl, LOVABLE_API_KEY);
    const finalImageUrl = normalizedImageUrl || imageUrl;

    let base64Match = finalImageUrl.match(/^data:image\/(png|jpeg|webp);base64,(.+)$/);
    if (!base64Match) base64Match = imageUrl.match(/^data:image\/(png|jpeg|webp);base64,(.+)$/);
    if (!base64Match) return { watchId: watch.id, success: false, error: 'Invalid image format' };

    const imageFormat = base64Match[1];
    const binaryData = Uint8Array.from(atob(base64Match[2]), c => c.charCodeAt(0));
    const fileName = `${watch.id}_ai.${imageFormat}`;

    const { error: uploadError } = await supabaseClient.storage
      .from('watch-images').upload(fileName, binaryData, { contentType: `image/${imageFormat}`, upsert: true });
    if (uploadError) return { watchId: watch.id, success: false, error: uploadError.message };

    const { data: publicUrlData } = supabaseClient.storage.from('watch-images').getPublicUrl(fileName);
    await supabaseClient.from('watches').update({ ai_image_url: publicUrlData.publicUrl }).eq('id', watch.id);

    console.log(`✓ Generated image for ${edition?.officialName || `${watch.brand} ${watch.model}`}`);
    return { watchId: watch.id, success: true, officialName: edition?.officialName };
  } catch (error) {
    return { watchId: watch.id, success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY is not configured');

    const supabaseClient = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

    let targetWatchIds: string[] | null = null;
    try {
      const body = await req.json();
      if (body?.watchIds && Array.isArray(body.watchIds)) targetWatchIds = body.watchIds;
    } catch { /* no body = process all */ }

    let query = supabaseClient
      .from('watches')
      .select('id, brand, model, dial_color, type, case_size, movement, what_i_like, why_bought, when_bought')
      .order('brand', { ascending: true });

    if (targetWatchIds && targetWatchIds.length > 0) {
      await supabaseClient.from('watches').update({ ai_image_url: null }).in('id', targetWatchIds);
      query = query.in('id', targetWatchIds);
    } else {
      query = query.is('ai_image_url', null);
    }

    const { data: watches, error: fetchError } = await query;
    if (fetchError) throw fetchError;

    if (!watches || watches.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: 'No watches need image generation', processed: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const watchIds = watches.map((w: any) => w.id);
    const { data: specs } = await supabaseClient
      .from('watch_specs')
      .select('watch_id, band')
      .in('watch_id', watchIds);

    const braceletByWatchId = new Map<string, string>();
    for (const spec of specs || []) {
      if (spec?.watch_id && spec?.band && !braceletByWatchId.has(spec.watch_id)) {
        braceletByWatchId.set(spec.watch_id, spec.band);
      }
    }

    const enrichedWatches = watches.map((watch: any) => ({
      ...watch,
      bracelet_hint: braceletByWatchId.get(watch.id) || null,
      year_hint: extractYearHint(watch.when_bought),
    }));

    console.log(`Processing ${enrichedWatches.length} watches with edition verification...`);
    const results: { watchId: string; success: boolean; error?: string; officialName?: string }[] = [];

    for (const watch of enrichedWatches) {
      const result = await generateImageForWatch(supabaseClient, watch, LOVABLE_API_KEY);
      results.push(result);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Generated ${successful} images`,
        processed: enrichedWatches.length,
        successful,
        failed: failed.length,
        failures: failed,
        editions: results.filter(r => r.officialName).map(r => ({ id: r.watchId, name: r.officialName }))
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
