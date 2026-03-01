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
  'For rectangular watches, long axis must be vertical, crown at 3 o\'clock side, no 90-degree rotation',
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
      requiredElements: 'Rectangular digital LCD face with segmented numerals, multi-button layout on front face (typical calculator-style keypad), compact resin case, resin or stainless steel strap, Casio branding on dial, classic retro 1980s-1990s digital watch aesthetic, silver-tone or dark resin case',
      forbiddenElements: 'NO analog hands, NO round case, NO dive bezel, NO chronograph subdials, NO smart-watch touchscreen UI, NO large modern smartwatch form factor',
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
    const cleanModel = normalizeModelForSearch(model);
    return {
      officialName: `Trafford ${cleanModel}`,
      requiredElements: 'Trafford Watches brand identity: round stainless steel case, clean minimalist dial with applied indices or printed numerals, small Trafford logo text at 12, slim dauphine or baton hands, date window at 3 or 6 if applicable, thin polished bezel, leather strap or mesh bracelet typical of British microbrand dress watches, upright portrait orientation with crown at 3 position, understated elegant British design aesthetic',
      forbiddenElements: 'NO horizontal or sideways rotation of the watch, NO dive bezel, NO chronograph subdials, NO digital display, NO oversized crown guards, NO sporty or tool watch elements, NO smart-watch features',
    };
  }

  if ((brandLc.includes('swatch') || brandLc.includes('omega')) && modelLc.includes('moonswatch')) {
    const editionMatch = model.match(/[""\u201C\u201D]([^""\u201C\u201D]+)[""\u201C\u201D]/);
    const editionName = editionMatch?.[1] || model.replace(/.*moonswatch\s*/i, '').trim();
    return {
      officialName: `Omega x Swatch MoonSwatch Mission to ${editionName || 'the Planet'}`,
      requiredElements: 'Bioceramic case material (matte plastic-ceramic blend), Speedmaster Moonwatch-inspired round case shape, tachymeter scale on bezel ring, THREE chronograph subdials in tri-compax layout (running seconds at 9, 30-minute counter at 3, 12-hour counter at 6), applied Omega logo on dial, SWATCH text on dial, matching planet-themed colorway for the specific edition, velcro strap or matching bioceramic bracelet',
      forbiddenElements: 'NO polished metal case, NO sapphire crystal, NO exhibition caseback, NO leather strap, NO generic Speedmaster without Swatch co-branding, NO wrong planet color scheme',
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
    'This must look like a real catalog product photo taken by a professional photographer in a studio',
    'Render the exact real-world edition/reference when identifiable; avoid generic lookalikes',
    `The watch MUST be recognizably a ${brand} ${canonicalModel} - get the dial layout, hand style, bezel, case shape, and branding exactly right`,
    cues,
    identity,
    COMPOSITION_RULES,
  ].filter(Boolean).join('. ');
}

async function fetchImageAsBase64(imageUrl: string): Promise<string | null> {
  try {
    let candidateUrl = imageUrl;
    if (!/\.(jpg|jpeg|png|webp)(\?|#|$)/i.test(candidateUrl)) {
      // Try to extract og:image from HTML pages
      try {
        const resp = await fetch(candidateUrl, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; WatchVault/1.0)' } });
        if (resp.ok) {
          const contentType = resp.headers.get('content-type') || '';
          if (contentType.toLowerCase().includes('text/html')) {
            const html = await resp.text();
            const metaMatch = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)
              || html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i);
            if (metaMatch?.[1]) candidateUrl = new URL(metaMatch[1], candidateUrl).toString();
          }
        }
      } catch { /* ignore */ }
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

    // --- Per-user monthly limit: admins unlimited, regular users 1/month ---
    const supabaseClient = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

    const authHeader = req.headers.get('authorization');
    let userId: string | null = null;
    let isAdmin = false;

    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabaseClient.auth.getUser(token);
      if (user) {
        userId = user.id;
        const { data: roleData } = await supabaseClient
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .eq('role', 'admin')
          .maybeSingle();
        isAdmin = !!roleData;
      }
    }

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!isAdmin) {
      // Check monthly usage
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { count } = await supabaseClient
        .from('ai_feature_usage')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('feature_name', 'regenerate-watch-image')
        .gte('used_at', startOfMonth.toISOString());

      if ((count ?? 0) >= 1) {
        return new Response(
          JSON.stringify({ error: 'Monthly limit reached. You can regenerate 1 image per month.', code: 'MONTHLY_LIMIT' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    console.log(`Generating AI image for: ${brand} ${model} (dial: ${dialColor || 'unspecified'})`);

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY is not configured');

    // supabaseClient already created above

    const identityProfile = getIdentityProfile(brand, model, type);

    // Only use user-provided reference images (no LLM URL search - those hallucinate)
    let referenceImages: string[] = [];
    let referenceSource: 'provided-url' | 'uploaded-photo' | 'none' = 'none';

    if (referenceImageBase64) {
      referenceImages = [referenceImageBase64];
      referenceSource = 'uploaded-photo';
      console.log('Using uploaded photo as reference');
    } else if (referenceImageUrl) {
      const fromProvidedUrl = await fetchImageAsBase64(referenceImageUrl);
      if (fromProvidedUrl) {
        referenceImages = [fromProvidedUrl];
        referenceSource = 'provided-url';
      }
    }

    if (referenceImages.length > 0) {
      console.log(`Reference source: ${referenceSource} (${referenceImages.length} image(s))`);
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
        brand, model,
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
        brand, model,
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

    // Skip normalization pass to avoid identity drift (the second AI call was changing watch identity)
    const finalImageData = imageUrl;

    const base64Match = finalImageData.match(/^data:image\/(png|jpeg|webp);base64,(.+)$/);
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

    // Log usage for rate limiting
    await supabaseClient.from('ai_feature_usage').insert({
      user_id: userId,
      feature_name: 'regenerate-watch-image',
    });

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
