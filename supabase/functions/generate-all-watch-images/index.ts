import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ─── STANDARDIZED PROMPT SYSTEM (must match generate-watch-image) ───
const COMPOSITION_RULES = [
  'SQUARE 1:1 aspect ratio composition',
  'The watch must be PERFECTLY CENTERED in the frame, both horizontally and vertically',
  'CRITICAL SIZE RULE: Regardless of the actual case diameter of the watch, ALL watches must appear the SAME visual size in the image - the watch case (excluding strap) must fill exactly 60% of the image width and 50% of the image height. This is a normalized catalog view where a 44mm Panerai and a 40mm IWC must look the same size in the frame',
  'STRAIGHT-ON front-facing view looking directly at the dial face - absolutely NO side angles',
  'Maximum 3-5 degree tilt for minimal depth perception - the full dial must be completely visible and readable',
  'The watch must be UPRIGHT with 12 o\'clock at the top',
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

// ─── EDITION VERIFICATION STEP ───
// Uses AI to verify and enrich the exact edition/reference details before image generation.
// This ensures we generate the RIGHT watch, not a generic version.
interface VerifiedEdition {
  officialName: string;
  dialDescription: string;
  bezelDescription: string;
  braceletOrStrap: string;
  keyDesignElements: string;
  complications: string;
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
            content: `You are a watch identification expert. Given watch metadata from a collector, identify the EXACT edition/reference and describe its visual design elements precisely. You must be specific — not generic. For example, "Omega Seamaster 300" with blue dial is NOT the same as the Planet Ocean or the Seamaster Diver 300M. A "Breitling Navitimer GMT" with ice blue dial is a specific reference, not just any Navitimer. Use the owner's notes as critical clues for the exact edition.

Return ONLY valid JSON with these fields:
{
  "officialName": "The most precise official name for this exact edition (e.g., 'Omega Seamaster Diver 300M Co-Axial Master Chronometer' or 'Breitling Navitimer B04 Chronograph GMT 48 Ice Blue')",
  "dialDescription": "Exact dial appearance: color, texture, indices style, subdial layout, any special markings or patterns",
  "bezelDescription": "Bezel type and appearance: ceramic/steel, uni/bi-directional, markings, color",
  "braceletOrStrap": "Exact bracelet or strap: type, material, clasp style",
  "keyDesignElements": "Unique identifiers that distinguish THIS edition from similar models: crown guards, case shape, hand style, lume color, caseback details",
  "complications": "List of complications: GMT, chronograph, date, moonphase, etc. Be specific about subdial positions"
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

    // Extract JSON from response (handle markdown code blocks)
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
    `Create an ACCURATE photorealistic product photograph of the EXACT ${edition.officialName} wristwatch`,
    `CRITICAL: This is specifically the "${edition.officialName}" — NOT a generic ${watch.brand} watch`,
    `DIAL: ${edition.dialDescription}`,
    `BEZEL: ${edition.bezelDescription}`,
    `BRACELET/STRAP: ${edition.braceletOrStrap}`,
    `KEY DESIGN ELEMENTS: ${edition.keyDesignElements}`,
    `COMPLICATIONS: ${edition.complications}`,
    `Render the exact real-world reference/edition; avoid generic lookalikes`,
    COMPOSITION_RULES,
  ].join('. ');
}

function buildFallbackPrompt(watch: any): string {
  const hints: string[] = [];
  hints.push(`EXACT model/edition: ${watch.brand} ${watch.model}`);
  if (watch.dial_color) hints.push(`Dial color MUST be: ${watch.dial_color}`);
  if (watch.type) hints.push(`Category/complication: ${watch.type}`);
  if (watch.case_size) hints.push(`Case size: ${watch.case_size}`);
  if (watch.movement) hints.push(`Movement: ${watch.movement}`);
  if (watch.what_i_like) hints.push(`Owner notes (use for design cues): ${watch.what_i_like}`);
  if (watch.why_bought) hints.push(`Purchase context (may contain edition info): ${watch.why_bought}`);

  return [
    `Create an ACCURATE photorealistic product photograph of the EXACT ${watch.brand} ${watch.model} wristwatch`,
    `CRITICAL: This is NOT a generic ${watch.brand} watch. It is specifically the "${watch.model}" edition/reference`,
    hints.join('. '),
    `Render the exact real-world reference/edition when identifiable; avoid generic lookalikes`,
    COMPOSITION_RULES,
  ].join('. ');
}

function buildVerifiedReferencePrompt(watch: any, edition: VerifiedEdition): string {
  return [
    `IMPORTANT: Use the reference image ONLY to identify design details (dial layout, hand style, bezel markings, bracelet pattern, crown shape)`,
    `Do NOT copy the framing, zoom level, angle, or proportions from the reference photo`,
    `This is EXACTLY the ${edition.officialName}`,
    `DIAL: ${edition.dialDescription}`,
    `BEZEL: ${edition.bezelDescription}`,
    `BRACELET/STRAP: ${edition.braceletOrStrap}`,
    `KEY DESIGN ELEMENTS: ${edition.keyDesignElements}`,
    `COMPLICATIONS: ${edition.complications}`,
    `Never output a generic or placeholder-style watch`,
    `CRITICAL OVERRIDE - IGNORE THE REFERENCE IMAGE'S FRAMING: ${COMPOSITION_RULES}`,
  ].join('. ');
}

async function findReferenceImageUrl(brand: string, model: string, edition: VerifiedEdition | null, LOVABLE_API_KEY: string): Promise<string | null> {
  try {
    const searchName = edition?.officialName || `${brand} ${normalizeModelForSearch(model)}`;
    console.log(`Searching reference for: ${searchName}`);
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "You are a watch reference image hunter. Return ONLY ONE URL. Prioritize official brand product pages or direct official studio product image URLs for the EXACT reference/edition requested. Strongly prefer front-facing catalog shots that clearly show dial layout, bezel text, and bracelet architecture. Avoid marketplace listings, user photos, wrist shots, and lifestyle/editorial images. If possible return a direct image URL; otherwise return the official product page URL containing hero images. No markdown, no commentary, no extra text. If not found, return NONE." },
          { role: "user", content: `Find the best official reference image for the EXACT watch edition: ${searchName}. Must match dial color, bezel style, bracelet type, and complications; prioritize a straight-on product shot.` }
        ],
        temperature: 0.2,
      }),
    });
    if (!response.ok) return null;
    const data = await response.json();
    const content = data.choices?.[0]?.message?.content?.trim();
    if (!content || content === 'NONE' || content.length > 2000) return null;
    const urlMatch = content.match(/https?:\/\/[^\s"'<>]+/i);
    return urlMatch ? urlMatch[0] : null;
  } catch { return null; }
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

async function generateImageForWatch(
  supabaseClient: any, watch: any, LOVABLE_API_KEY: string
): Promise<{ watchId: string; success: boolean; error?: string; officialName?: string }> {
  try {
    console.log(`\n━━━ Processing: ${watch.brand} ${watch.model} (dial: ${watch.dial_color || 'unspecified'}) ━━━`);

    // STEP 1: Verify the exact edition using AI
    const edition = await verifyEdition(watch, LOVABLE_API_KEY);
    
    // STEP 2: Search for reference image using verified edition name
    let referenceBase64: string | null = null;
    const foundUrl = await findReferenceImageUrl(watch.brand, watch.model, edition, LOVABLE_API_KEY);
    if (foundUrl) referenceBase64 = await fetchImageAsBase64(foundUrl);

    // STEP 3: Build prompt using verified edition details
    let messages: any[];
    if (referenceBase64 && edition) {
      console.log(`Using reference image + verified edition for ${edition.officialName}`);
      messages = [{ role: "user", content: [
        { type: "text", text: buildVerifiedReferencePrompt(watch, edition) },
        { type: "image_url", image_url: { url: referenceBase64 } }
      ]}];
    } else if (referenceBase64) {
      console.log(`Using reference image (no verification) for ${watch.brand} ${watch.model}`);
      const fallbackHints = buildFallbackPrompt(watch);
      messages = [{ role: "user", content: [
        { type: "text", text: `IMPORTANT: Use the reference image ONLY to identify design details. ${fallbackHints}` },
        { type: "image_url", image_url: { url: referenceBase64 } }
      ]}];
    } else if (edition) {
      console.log(`No reference found, using verified edition: ${edition.officialName}`);
      messages = [{ role: "user", content: buildVerifiedPrompt(watch, edition) }];
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

    const base64Match = imageUrl.match(/^data:image\/(png|jpeg|webp);base64,(.+)$/);
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

    // Parse optional watchIds from body to regenerate specific watches
    let targetWatchIds: string[] | null = null;
    try {
      const body = await req.json();
      if (body?.watchIds && Array.isArray(body.watchIds)) {
        targetWatchIds = body.watchIds;
      }
    } catch { /* no body = process all */ }

    let query = supabaseClient
      .from('watches')
      .select('id, brand, model, dial_color, type, case_size, movement, what_i_like, why_bought')
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

    console.log(`Processing ${watches.length} watches with edition verification...`);
    const results: { watchId: string; success: boolean; error?: string; officialName?: string }[] = [];

    for (const watch of watches) {
      const result = await generateImageForWatch(supabaseClient, watch, LOVABLE_API_KEY);
      results.push(result);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success);

    return new Response(
      JSON.stringify({ success: true, message: `Generated ${successful} images`, processed: watches.length, successful, failed: failed.length, failures: failed, editions: results.filter(r => r.officialName).map(r => ({ id: r.watchId, name: r.officialName })) }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
