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
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Build edition-specific context from all available watch metadata.
 * This ensures the AI knows the EXACT edition, not a generic version.
 */
function buildEditionContext(watch: any): string {
  const hints: string[] = [];

  // The model name itself is the primary edition identifier
  hints.push(`EXACT model/edition: ${watch.brand} ${watch.model}`);

  if (watch.dial_color) hints.push(`Dial color MUST be: ${watch.dial_color}`);
  if (watch.type) hints.push(`Category/complication: ${watch.type}`);
  if (watch.case_size) hints.push(`Case size: ${watch.case_size}`);
  if (watch.movement) hints.push(`Movement: ${watch.movement}`);

  // what_i_like and why_bought often contain critical edition details
  if (watch.what_i_like) hints.push(`Owner notes (use for design cues): ${watch.what_i_like}`);
  if (watch.why_bought) hints.push(`Purchase context (may contain edition info): ${watch.why_bought}`);

  return hints.join('. ');
}

function buildReferencePrompt(watch: any): string {
  const editionContext = buildEditionContext(watch);
  return `IMPORTANT: Use the reference image ONLY to identify design details (dial layout, hand style, bezel markings, bracelet pattern, crown shape). Do NOT copy the framing, zoom level, angle, or proportions from the reference photo. Never output a generic or placeholder-style watch; it must be recognizably the EXACT ${watch.brand} ${watch.model} edition with accurate dial layout, bezel markings, hand set, indices, crown, and bracelet/strap architecture. Generate a completely new studio product shot following these STRICT composition rules. ${editionContext}. CRITICAL OVERRIDE - IGNORE THE REFERENCE IMAGE'S FRAMING: ${COMPOSITION_RULES}`;
}

function buildPureGenerationPrompt(watch: any): string {
  const editionContext = buildEditionContext(watch);
  const details = [
    `Create an ACCURATE photorealistic product photograph of the EXACT ${watch.brand} ${watch.model} wristwatch`,
    `CRITICAL: This is NOT a generic ${watch.brand} watch. It is specifically the "${watch.model}" edition/reference. Research and depict the EXACT model with its unique design elements`,
    editionContext,
    `Render the exact real-world reference/edition when identifiable; avoid generic lookalikes`,
    COMPOSITION_RULES,
  ];
  return details.join('. ');
}

async function findReferenceImageUrl(brand: string, model: string, LOVABLE_API_KEY: string): Promise<string | null> {
  try {
    const searchModel = normalizeModelForSearch(model);
    console.log(`Searching reference for: ${brand} ${searchModel}`);
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "You are a watch reference image hunter. Return ONLY ONE URL. Prioritize official brand product pages or direct official studio product image URLs for the EXACT reference/edition requested. Strongly prefer front-facing catalog shots that clearly show dial layout, bezel text, and bracelet architecture. Avoid marketplace listings, user photos, wrist shots, and lifestyle/editorial images. If possible return a direct image URL; otherwise return the official product page URL containing hero images. No markdown, no commentary, no extra text. If not found, return NONE." },
          { role: "user", content: `Find the best official reference image for the EXACT watch edition: ${brand} ${searchModel}. Must match dial color, bezel style, bracelet type, and complications; prioritize a straight-on product shot.` }
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
): Promise<{ watchId: string; success: boolean; error?: string }> {
  try {
    console.log(`Generating image for: ${watch.brand} ${watch.model} (dial: ${watch.dial_color || 'unspecified'})`);

    // Search for reference image using the full model name
    let referenceBase64: string | null = null;
    const foundUrl = await findReferenceImageUrl(watch.brand, watch.model, LOVABLE_API_KEY);
    if (foundUrl) referenceBase64 = await fetchImageAsBase64(foundUrl);

    let messages: any[];
    if (referenceBase64) {
      console.log(`Using reference image for ${watch.brand} ${watch.model}`);
      messages = [{ role: "user", content: [
        { type: "text", text: buildReferencePrompt(watch) },
        { type: "image_url", image_url: { url: referenceBase64 } }
      ]}];
    } else {
      console.log(`No reference found for ${watch.brand} ${watch.model}, using pure generation`);
      messages = [{ role: "user", content: buildPureGenerationPrompt(watch) }];
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

    console.log(`✓ Generated image for ${watch.brand} ${watch.model}`);
    return { watchId: watch.id, success: true };
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
    } catch { /* no body = process all missing */ }

    let query = supabaseClient
      .from('watches')
      .select('id, brand, model, dial_color, type, case_size, movement, what_i_like, why_bought')
      .order('brand', { ascending: true });

    if (targetWatchIds && targetWatchIds.length > 0) {
      // Regenerate specific watches (clear their URLs first)
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

    console.log(`Processing ${watches.length} watches...`);
    const results: { watchId: string; success: boolean; error?: string }[] = [];

    for (const watch of watches) {
      const result = await generateImageForWatch(supabaseClient, watch, LOVABLE_API_KEY);
      results.push(result);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success);

    return new Response(
      JSON.stringify({ success: true, message: `Generated ${successful} images`, processed: watches.length, successful, failed: failed.length, failures: failed }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
