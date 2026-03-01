import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { rateLimitResponse } from "../_shared/rate-limiter.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const inputSchema = z.object({
  watchId: z.string().uuid().optional(),
  brand: z.string().min(1).max(100).regex(/^[a-zA-Z0-9\s\-\.&']+$/, 'Invalid brand format'),
  model: z.string().min(1).max(200).regex(/^[a-zA-Z0-9\s\-\.\/&'(),:]+$/, 'Invalid model format'),
  dialColor: z.string().max(50).optional(),
  type: z.string().max(50).optional(),
  caseSize: z.string().max(20).optional(),
  movement: z.string().max(100).optional(),
  bracelet: z.string().max(120).optional(),
  year: z.union([z.string(), z.number()]).optional(),
  edition: z.string().max(200).optional(),
  bezelType: z.string().max(120).optional(),
  strapType: z.string().max(120).optional(),
  specialEditionHint: z.string().max(500).optional(),
  referenceImageBase64: z.string().max(15000000, 'Image too large (max 10MB)').optional(),
  referenceImageUrl: z.string().url().max(2000).optional(),
  customPrompt: z.string().max(2000).optional(),
});

const COMPOSITION_RULES = [
  'SQUARE 1:1 aspect ratio composition',
  'The watch must be PERFECTLY CENTERED in the frame, both horizontally and vertically',
  'CRITICAL SIZE RULE: Regardless of the actual case diameter of the watch, ALL watches must appear the SAME visual size in the image - the watch case (excluding strap) must fill exactly 60% of the image width and 50% of the image height',
  'STRAIGHT-ON front-facing view looking directly at the dial face - absolutely NO side angles',
  'Maximum 3-5 degree tilt for minimal depth perception - the full dial must be completely visible and readable',
  'The watch must be UPRIGHT with 12 o\'clock at the top and strap/bracelet running vertically (top-to-bottom), never horizontal/sideways',
  'For rectangular watches, long axis must be vertical, crown at 3 o\'clock side, no 90° rotation',
  'Show a small portion of the bracelet/strap extending from both lugs (about 1-2 links or 2cm of strap)',
  'DARK background: smooth gradient from charcoal (#2a2a2a) at edges to near-black (#111111) at center',
  'Professional studio lighting: soft diffused main light from upper-left, subtle fill light from right',
  'Sharp focus on entire dial face - every index, hand, subdial, and logo must be crisp',
  'No reflections on crystal, no glare spots',
  'Ultra high resolution, photorealistic, luxury catalog quality',
].join('. ');

type IdentityProfile = {
  officialName: string;
  requiredElements: string;
  forbiddenElements: string;
};

function normalizeYear(year?: string | number): string | undefined {
  if (year === undefined || year === null) return undefined;
  const raw = String(year);
  const match = raw.match(/\b(19|20)\d{2}\b/);
  return match?.[0];
}

function normalizeModelForSearch(model: string): string {
  return model
    .replace(/\(likely[^)]*\)/gi, '')
    .replace(/\(reference[^)]*\)/gi, '')
    .replace(/\([^)]*generation[^)]*\)/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function canonicalizeModelForPrompt(brand: string, model: string): string {
  const normalizedBrand = brand.trim().toLowerCase();
  const cleanedModel = normalizeModelForSearch(model);
  return cleanedModel
    .replace(new RegExp(`^${normalizedBrand}\\s+`, 'i'), '')
    .replace(/\s+/g, ' ')
    .trim();
}

function getIdentityProfile(brand: string, model: string, type?: string): IdentityProfile | null {
  const brandLc = brand.toLowerCase();
  const modelLc = normalizeModelForSearch(model).toLowerCase();
  const typeLc = (type || '').toLowerCase();

  if (brandLc.includes('casio') && modelLc.includes('databank')) {
    return {
      officialName: 'Casio Databank',
      requiredElements: 'Rectangular digital LCD face, segmented numerals, utility keypad/button aesthetic, compact resin case and strap',
      forbiddenElements: 'NO analog hands, NO round case, NO dive bezel, NO chronograph subdials, NO smart-watch UI',
    };
  }

  if (brandLc.includes('breitling') && modelLc.includes('navitimer') && (modelLc.includes('gmt') || typeLc.includes('gmt'))) {
    return {
      officialName: 'Breitling Navitimer GMT 41',
      requiredElements: 'Navitimer slide-rule bezel architecture, GMT hand, date window, aviation dial language matching Navitimer GMT edition',
      forbiddenElements: 'NO chronograph pushers, NO tri-compax chronograph subdials, NO diver bezel, NO fantasy oversized case',
    };
  }

  if (brandLc.includes('trafford')) {
    return {
      officialName: `${brand} ${model}`,
      requiredElements: 'Upright portrait orientation, crown aligned at 3 o’clock, dial text/logos readable upright, realistic Trafford case proportions',
      forbiddenElements: 'NO horizontal rotation, NO sideways dial, NO distorted stretched case geometry',
    };
  }

  return null;
}

function buildIdentityConstraint(profile: IdentityProfile | null): string {
  if (!profile) return '';
  return [
    `EXACT IDENTITY: ${profile.officialName}`,
    `MUST INCLUDE: ${profile.requiredElements}`,
    `MUST NOT INCLUDE: ${profile.forbiddenElements}`,
  ].join('. ');
}

function buildDetailCues(opts: { dialColor?: string; type?: string; caseSize?: string; movement?: string; bezelType?: string; strapType?: string; bracelet?: string; edition?: string; specialEditionHint?: string; year?: string | number }): string {
  const normalizedYear = normalizeYear(opts.year);
  return [
    opts.edition ? `Exact edition/reference: ${opts.edition}` : '',
    opts.specialEditionHint ? `Edition hint: ${opts.specialEditionHint}` : '',
    opts.dialColor ? `Dial color/finish MUST match exactly: ${opts.dialColor}` : '',
    opts.type ? `Complication/category cues: ${opts.type}` : '',
    opts.caseSize ? `Case size cue: ${opts.caseSize}` : '',
    opts.bracelet ? `Bracelet/strap cue: ${opts.bracelet}` : '',
    opts.strapType ? `Strap type cue: ${opts.strapType}` : '',
    opts.movement ? `Movement cue: ${opts.movement}` : '',
    opts.bezelType ? `Bezel cue: ${opts.bezelType}` : '',
    normalizedYear ? `Production era/year cue: ${normalizedYear}` : '',
  ].filter(Boolean).join('. ');
}

function buildReferencePrompt(
  brand: string,
  model: string,
  opts: { dialColor?: string; type?: string; caseSize?: string; movement?: string; bezelType?: string; strapType?: string; bracelet?: string; edition?: string; specialEditionHint?: string; year?: string | number },
  identityProfile: IdentityProfile | null
): string {
  const canonicalModel = canonicalizeModelForPrompt(brand, model);
  const cues = buildDetailCues(opts);
  const identity = buildIdentityConstraint(identityProfile);

  return [
    'IMPORTANT: Use reference image(s) ONLY to identify design details (dial layout, hand style, bezel markings, bracelet pattern, crown shape)',
    'Do NOT copy framing, zoom level, angle, or proportions from references',
    `Never output a generic watch; this must be recognizably the exact ${brand} ${canonicalModel}`,
    cues,
    identity,
    `This is a ${brand} ${canonicalModel}`,
    `CRITICAL OVERRIDE - IGNORE REFERENCE IMAGE FRAMING: ${COMPOSITION_RULES}`,
  ].filter(Boolean).join('. ');
}

function buildPureGenerationPrompt(
  brand: string,
  model: string,
  opts: { dialColor?: string; type?: string; caseSize?: string; movement?: string; bezelType?: string; strapType?: string; bracelet?: string; edition?: string; specialEditionHint?: string; year?: string | number },
  identityProfile: IdentityProfile | null
): string {
  const canonicalModel = canonicalizeModelForPrompt(brand, model);
  const cues = buildDetailCues(opts);
  const identity = buildIdentityConstraint(identityProfile);

  return [
    `Create an ACCURATE photorealistic product photograph of the exact ${brand} ${canonicalModel} wristwatch`,
    'Render the exact real-world edition/reference when identifiable; avoid generic lookalikes',
    cues,
    identity,
    COMPOSITION_RULES,
  ].filter(Boolean).join('. ');
}

async function findReferenceImageUrls(
  brand: string,
  model: string,
  opts: { dialColor?: string; type?: string; caseSize?: string; movement?: string; bezelType?: string; strapType?: string; bracelet?: string; edition?: string; specialEditionHint?: string; year?: string | number },
  LOVABLE_API_KEY: string
): Promise<string[]> {
  try {
    const searchModel = normalizeModelForSearch(model);
    const cueText = buildDetailCues(opts);
    console.log(`Searching for reference images: ${brand} ${searchModel}`);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: 'You are a watch reference image hunter. Return ONLY a JSON array of up to 4 URLs. Prioritize official brand product pages and direct catalog images for the EXACT edition. Prefer front-facing product shots. Avoid marketplaces, wrist shots, and lifestyle photos. No markdown, no commentary.'
          },
          {
            role: "user",
            content: `Find reference image URLs for: ${brand} ${searchModel}. ${cueText}. Return only JSON array of URLs.`
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
        return parsed
          .filter((entry) => typeof entry === 'string' && /^https?:\/\//i.test(entry))
          .slice(0, 4);
      }
    }

    const urlMatches = content.match(/https?:\/\/[^\s"'<>]+/gi) || [];
    return urlMatches.slice(0, 4);
  } catch {
    return [];
  }
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
    if (bytes.length < 5000 || bytes.length > 15_000_000) return null;

    let binary = '';
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
    return `data:${ct};base64,${btoa(binary)}`;
  } catch { return null; }
}

async function collectReferenceImages(candidateUrls: string[], maxImages = 3): Promise<string[]> {
  const references: string[] = [];
  for (const url of candidateUrls) {
    if (references.length >= maxImages) break;
    const base64 = await fetchImageAsBase64(url);
    if (base64) references.push(base64);
  }
  return references;
}

async function normalizeImageComposition(
  brand: string,
  model: string,
  edition: string | undefined,
  imageDataUrl: string,
  LOVABLE_API_KEY: string
): Promise<string | null> {
  try {
    const identity = edition || `${brand} ${model}`;
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-pro-image-preview",
        messages: [
          {
            role: "system",
            content: "You are a luxury watch catalog retoucher. Never redesign or change watch identity. You may ONLY reframe, recenter, and rescale the existing watch photo to strict composition standards."
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
              { type: "image_url", image_url: { url: imageDataUrl } }
            ]
          }
        ],
        modalities: ["image", "text"],
      }),
    });

    if (!response.ok) return null;
    const data = await response.json();
    return data.choices?.[0]?.message?.images?.[0]?.image_url?.url || null;
  } catch {
    return null;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const parseResult = inputSchema.safeParse(body);
    if (!parseResult.success) {
      return new Response(
        JSON.stringify({ error: 'Invalid input: ' + parseResult.error.errors.map(e => e.message).join(', ') }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const {
      watchId, brand, model, dialColor, type, caseSize, movement, bracelet, year, edition,
      bezelType, strapType, specialEditionHint,
      referenceImageBase64, referenceImageUrl, customPrompt,
    } = parseResult.data;

    const clientIp = req.headers.get("x-forwarded-for") || "unknown";
    const rlResponse = rateLimitResponse(clientIp, "generate-watch-image", corsHeaders, 5, 60_000);
    if (rlResponse) return rlResponse;

    console.log(`Generating AI image for: ${brand} ${model} (dial: ${dialColor || 'unspecified'})`);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY is not configured');

    const supabaseClient = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

    const identityProfile = getIdentityProfile(brand, model, type);

    let referenceImages: string[] = [];
    let referenceSource: 'provided-url' | 'official-search' | 'uploaded-photo' | 'none' = 'none';

    if (referenceImageBase64) {
      referenceImages = [referenceImageBase64];
      referenceSource = 'uploaded-photo';
      console.log('Using uploaded photo as reference (skipping reference search)');
    } else if (referenceImageUrl) {
      const fromProvidedUrl = await fetchImageAsBase64(referenceImageUrl);
      if (fromProvidedUrl) {
        referenceImages = [fromProvidedUrl];
        referenceSource = 'provided-url';
      }
    }

    if (referenceImages.length === 0) {
      const foundUrls = await findReferenceImageUrls(
        brand,
        model,
        { dialColor, type, caseSize, movement, bracelet, year, edition, bezelType, strapType, specialEditionHint },
        LOVABLE_API_KEY
      );
      referenceImages = await collectReferenceImages(foundUrls, 3);
      if (referenceImages.length > 0) {
        referenceSource = 'official-search';
      }
    }

    if (referenceImages.length > 0) {
      console.log(`Reference source selected: ${referenceSource} (${referenceImages.length} image(s))`);
    }

    const identitySystemMessage = identityProfile
      ? {
          role: "system",
          content: `You are generating a product photo of EXACTLY ${identityProfile.officialName}. MUST INCLUDE: ${identityProfile.requiredElements}. MUST NOT INCLUDE: ${identityProfile.forbiddenElements}.`
        }
      : null;

    let messages: any[];
    let generationMethod: string;

    if (referenceImages.length > 0) {
      generationMethod = 'reference-enhanced';
      const prompt = customPrompt || buildReferencePrompt(
        brand,
        model,
        { dialColor, type, caseSize, movement, bracelet, year, edition, bezelType, strapType, specialEditionHint },
        identityProfile
      );
      messages = [
        ...(identitySystemMessage ? [identitySystemMessage] : []),
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            ...referenceImages.map((url) => ({ type: "image_url", image_url: { url } })),
          ],
        },
      ];
    } else {
      generationMethod = 'pure-generation';
      const prompt = customPrompt || buildPureGenerationPrompt(
        brand,
        model,
        { dialColor, type, caseSize, movement, bracelet, year, edition, bezelType, strapType, specialEditionHint },
        identityProfile
      );
      messages = [
        ...(identitySystemMessage ? [identitySystemMessage] : []),
        { role: "user", content: prompt },
      ];
    }

    console.log(`Calling AI (method: ${generationMethod})...`);
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: "google/gemini-3-pro-image-preview", messages, modalities: ["image", "text"] }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      if (response.status === 429) return new Response(JSON.stringify({ error: 'Rate limit exceeded.' }), { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      if (response.status === 402) return new Response(JSON.stringify({ error: 'AI credits required.' }), { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    if (!imageUrl) throw new Error('No image generated');

    const normalizedImageUrl = await normalizeImageComposition(brand, model, edition, imageUrl, LOVABLE_API_KEY);
    const finalImageData = normalizedImageUrl || imageUrl;

    let base64Match = finalImageData.match(/^data:image\/(png|jpeg|webp);base64,(.+)$/);
    if (!base64Match) {
      base64Match = imageUrl.match(/^data:image\/(png|jpeg|webp);base64,(.+)$/);
    }
    if (!base64Match) throw new Error('Invalid image format from AI');

    const imageFormat = base64Match[1];
    const binaryData = Uint8Array.from(atob(base64Match[2]), c => c.charCodeAt(0));
    const fileName = `${watchId || crypto.randomUUID()}_ai.${imageFormat}`;

    const { error: uploadError } = await supabaseClient.storage
      .from('watch-images').upload(fileName, binaryData, { contentType: `image/${imageFormat}`, upsert: true });
    if (uploadError) throw new Error(`Failed to upload image: ${uploadError.message}`);

    const { data: publicUrlData } = supabaseClient.storage.from('watch-images').getPublicUrl(fileName);
    const publicUrl = publicUrlData.publicUrl;

    if (watchId) {
      await supabaseClient.from('watches').update({ ai_image_url: publicUrl }).eq('id', watchId);
      console.log('Watch record updated with AI image URL');
    }

    return new Response(
      JSON.stringify({ success: true, imageUrl: publicUrl, generationMethod, referenceCount: referenceImages.length, message: 'AI image generated successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error generating watch image:', errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
