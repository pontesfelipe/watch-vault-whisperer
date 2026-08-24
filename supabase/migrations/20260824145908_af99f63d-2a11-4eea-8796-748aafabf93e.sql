CREATE TABLE public.ai_prompt_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  description TEXT,
  placeholders TEXT[] NOT NULL DEFAULT '{}',
  template TEXT NOT NULL,
  default_template TEXT NOT NULL,
  updated_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, UPDATE ON public.ai_prompt_templates TO authenticated;
GRANT ALL ON public.ai_prompt_templates TO service_role;

ALTER TABLE public.ai_prompt_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view prompt templates"
ON public.ai_prompt_templates FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update prompt templates"
ON public.ai_prompt_templates FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER ai_prompt_templates_updated_at
BEFORE UPDATE ON public.ai_prompt_templates
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.ai_prompt_templates (key, label, description, placeholders, template, default_template)
VALUES
(
  'watch_image_system',
  'Identity system instruction',
  'System message used when a known watch identity profile is matched. Sent before the generation prompt.',
  ARRAY['{{official_name}}','{{required_elements}}','{{forbidden_elements}}'],
  'You are a professional luxury watch catalog photographer producing a product photo of EXACTLY {{official_name}}. Accuracy of the watch identity matters more than artistic interpretation. MUST INCLUDE: {{required_elements}}. MUST NOT INCLUDE: {{forbidden_elements}}. If any requested detail conflicts with the real product, follow the real product.',
  'You are a professional luxury watch catalog photographer producing a product photo of EXACTLY {{official_name}}. Accuracy of the watch identity matters more than artistic interpretation. MUST INCLUDE: {{required_elements}}. MUST NOT INCLUDE: {{forbidden_elements}}. If any requested detail conflicts with the real product, follow the real product.'
),
(
  'watch_image_composition_rules',
  'Composition rules',
  'Framing, lighting and orientation rules appended to every watch image prompt. Injected as {{composition_rules}}.',
  ARRAY[]::TEXT[],
  'SQUARE 1:1 aspect ratio composition. Exactly ONE watch in frame, no props, no packaging, no wrist, no hands, no people. The watch must be PERFECTLY CENTERED in the frame, both horizontally and vertically. CRITICAL SIZE RULE: regardless of the real case diameter, ALL watches must appear the SAME visual size - the case (excluding strap) fills exactly 60% of the image width and 50% of the image height. STRAIGHT-ON front-facing view looking directly at the dial face - absolutely NO side angles. Maximum 3-5 degree tilt for minimal depth; the full dial must be completely visible and readable. The watch must be UPRIGHT with 12 o''clock at the top and the strap/bracelet running vertically (top-to-bottom), never horizontal or sideways. For rectangular or tonneau cases the long axis must be vertical, crown at the 3 o''clock side, no 90-degree rotation. Show a small portion of the bracelet/strap extending from both lugs (about 1-2 links or 2 cm of strap), cleanly cropped at the frame edge. Set the hands to 10:10 with the seconds hand at 30 unless the real model dictates otherwise; keep the date window legible and plausible. DARK background: smooth gradient from charcoal (#2a2a2a) at the edges to near-black (#111111) at the center, with a subtle soft shadow under the case. Professional studio lighting: large softbox as key light from the upper-left, gentle fill from the right, thin specular highlight along the polished case edges. Shot like a 100mm macro lens at f/8: sharp focus across the entire dial - every index, hand, subdial, and logo crisp and correctly proportioned. No blown-out glare on the crystal, no mirror reflections of the studio, no rainbow flare. NO watermarks, NO captions, NO added text, NO logos other than the real brand markings, NO borders or frames. Ultra high resolution, photorealistic, luxury catalog quality.',
  'SQUARE 1:1 aspect ratio composition. Exactly ONE watch in frame, no props, no packaging, no wrist, no hands, no people. The watch must be PERFECTLY CENTERED in the frame, both horizontally and vertically. CRITICAL SIZE RULE: regardless of the real case diameter, ALL watches must appear the SAME visual size - the case (excluding strap) fills exactly 60% of the image width and 50% of the image height. STRAIGHT-ON front-facing view looking directly at the dial face - absolutely NO side angles. Maximum 3-5 degree tilt for minimal depth; the full dial must be completely visible and readable. The watch must be UPRIGHT with 12 o''clock at the top and the strap/bracelet running vertically (top-to-bottom), never horizontal or sideways. For rectangular or tonneau cases the long axis must be vertical, crown at the 3 o''clock side, no 90-degree rotation. Show a small portion of the bracelet/strap extending from both lugs (about 1-2 links or 2 cm of strap), cleanly cropped at the frame edge. Set the hands to 10:10 with the seconds hand at 30 unless the real model dictates otherwise; keep the date window legible and plausible. DARK background: smooth gradient from charcoal (#2a2a2a) at the edges to near-black (#111111) at the center, with a subtle soft shadow under the case. Professional studio lighting: large softbox as key light from the upper-left, gentle fill from the right, thin specular highlight along the polished case edges. Shot like a 100mm macro lens at f/8: sharp focus across the entire dial - every index, hand, subdial, and logo crisp and correctly proportioned. No blown-out glare on the crystal, no mirror reflections of the studio, no rainbow flare. NO watermarks, NO captions, NO added text, NO logos other than the real brand markings, NO borders or frames. Ultra high resolution, photorealistic, luxury catalog quality.'
),
(
  'watch_image_pure_generation',
  'Generation prompt (no reference photo)',
  'Used when no reference image is supplied. Placeholders are replaced before sending to the AI.',
  ARRAY['{{brand}}','{{model}}','{{cues}}','{{identity}}','{{composition_rules}}'],
  'Create an ACCURATE photorealistic studio product photograph of the exact {{brand}} {{model}} wristwatch. It must look like a real brand catalog photo taken by a professional product photographer, not an illustration, render, or artistic interpretation. Reproduce the exact real-world edition/reference when identifiable and never invent a generic lookalike, fantasy variant, or altered branding. Get the dial layout, indices, hand shapes, logo placement and typography, bezel architecture, case profile, lug shape, crown and bracelet/strap design exactly right for this reference. Keep proportions true to the real product: bezel-to-dial ratio, subdial sizes and positions, date window position, and text lines on the dial. {{cues}}. {{identity}}. {{composition_rules}}',
  'Create an ACCURATE photorealistic studio product photograph of the exact {{brand}} {{model}} wristwatch. It must look like a real brand catalog photo taken by a professional product photographer, not an illustration, render, or artistic interpretation. Reproduce the exact real-world edition/reference when identifiable and never invent a generic lookalike, fantasy variant, or altered branding. Get the dial layout, indices, hand shapes, logo placement and typography, bezel architecture, case profile, lug shape, crown and bracelet/strap design exactly right for this reference. Keep proportions true to the real product: bezel-to-dial ratio, subdial sizes and positions, date window position, and text lines on the dial. {{cues}}. {{identity}}. {{composition_rules}}'
),
(
  'watch_image_reference_enhanced',
  'Generation prompt (with reference photo)',
  'Used when the user supplies a reference photo or URL. Reference images guide details only, never framing.',
  ARRAY['{{brand}}','{{model}}','{{cues}}','{{identity}}','{{composition_rules}}'],
  'Use the attached reference image(s) ONLY to identify design details: dial layout and text, index and hand shapes, bezel markings, case and lug profile, crown shape, bracelet or strap pattern, and exact colour tones. Do NOT copy the framing, zoom level, camera angle, background, lighting, or crop of the references, and do not reproduce any watermark, text overlay, or retailer badge present in them. Never output a generic watch: the result must be recognizably the exact {{brand}} {{model}}. If the reference is partially obscured, low quality, or shows a different variant, prioritise the known real specification of this model over the reference. {{cues}}. {{identity}}. CRITICAL OVERRIDE - IGNORE REFERENCE IMAGE FRAMING: {{composition_rules}}',
  'Use the attached reference image(s) ONLY to identify design details: dial layout and text, index and hand shapes, bezel markings, case and lug profile, crown shape, bracelet or strap pattern, and exact colour tones. Do NOT copy the framing, zoom level, camera angle, background, lighting, or crop of the references, and do not reproduce any watermark, text overlay, or retailer badge present in them. Never output a generic watch: the result must be recognizably the exact {{brand}} {{model}}. If the reference is partially obscured, low quality, or shows a different variant, prioritise the known real specification of this model over the reference. {{cues}}. {{identity}}. CRITICAL OVERRIDE - IGNORE REFERENCE IMAGE FRAMING: {{composition_rules}}'
);