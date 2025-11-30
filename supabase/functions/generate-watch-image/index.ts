import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { watchId, brand, model, dialColor, type, caseSize, movement, referenceImageBase64 } = await req.json();
    
    console.log(`Generating AI image for: ${brand} ${model}`);
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

    // Build a detailed prompt for the watch image
    const watchDescription = [
      `A photorealistic, high-quality product photograph of a ${brand} ${model} luxury wristwatch`,
      dialColor ? `with a ${dialColor} dial` : '',
      type ? `${type} style watch` : '',
      caseSize ? `${caseSize} case size` : '',
      movement ? `featuring ${movement} movement` : '',
      'Professional studio lighting, white background, sharp focus, high detail',
      'The watch should be displayed at a slight angle to show the dial and case details',
      'Ultra high resolution, 4K quality product photography',
    ].filter(Boolean).join('. ');

    let messages: any[];

    // If we have a reference image, use it to enhance the generation
    if (referenceImageBase64) {
      console.log('Using reference image for enhanced generation');
      messages = [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Based on this watch photo, create a professional studio product photograph. Keep the watch design accurate to the reference but render it as a clean, professional product shot with: white background, professional studio lighting, sharp focus showing all dial details and text, slight angle to show depth. The watch is a ${brand} ${model}${dialColor ? ` with ${dialColor} dial` : ''}. Make it look like a high-end catalog photo. Ultra high resolution.`
            },
            {
              type: "image_url",
              image_url: {
                url: referenceImageBase64
              }
            }
          ]
        }
      ];
    } else {
      messages = [
        {
          role: "user",
          content: watchDescription
        }
      ];
    }

    console.log('Calling Lovable AI for image generation...');
    
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image-preview",
        messages,
        modalities: ["image", "text"]
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits required. Please add funds.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    console.log('AI response received');
    
    const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    
    if (!imageUrl) {
      console.error('No image in response:', JSON.stringify(data).substring(0, 500));
      throw new Error('No image generated');
    }

    // Extract base64 data and upload to storage
    const base64Match = imageUrl.match(/^data:image\/(png|jpeg|webp);base64,(.+)$/);
    if (!base64Match) {
      throw new Error('Invalid image format from AI');
    }

    const imageFormat = base64Match[1];
    const base64Data = base64Match[2];
    const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

    const fileName = `${watchId || crypto.randomUUID()}_ai.${imageFormat}`;
    
    console.log(`Uploading image to storage: ${fileName}`);
    
    const { error: uploadError } = await supabaseClient.storage
      .from('watch-images')
      .upload(fileName, binaryData, {
        contentType: `image/${imageFormat}`,
        upsert: true
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw new Error(`Failed to upload image: ${uploadError.message}`);
    }

    const { data: publicUrlData } = supabaseClient.storage
      .from('watch-images')
      .getPublicUrl(fileName);

    const publicUrl = publicUrlData.publicUrl;
    console.log(`Image uploaded successfully: ${publicUrl}`);

    // Update the watch record with the AI image URL if watchId provided
    if (watchId) {
      const { error: updateError } = await supabaseClient
        .from('watches')
        .update({ ai_image_url: publicUrl })
        .eq('id', watchId);

      if (updateError) {
        console.error('Failed to update watch record:', updateError);
      } else {
        console.log('Watch record updated with AI image URL');
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        imageUrl: publicUrl,
        message: 'AI image generated successfully' 
      }),
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
