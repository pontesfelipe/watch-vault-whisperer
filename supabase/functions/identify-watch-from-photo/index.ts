import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { image } = await req.json();
    
    if (!image) {
      return new Response(
        JSON.stringify({ error: 'No image provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    console.log('Identifying watch from photo...');

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: 'You are an expert watch identifier with deep knowledge of luxury watches, microbrands, and vintage timepieces. Analyze watch photos to identify brand, model, and specifications with high accuracy.'
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Identify this watch from the photo. Extract as much detail as possible including brand, model reference, dial color, watch type, case size, movement type, and any other visible specifications. Be specific with model names and references if identifiable. Return the data in JSON format.'
              },
              {
                type: 'image_url',
                image_url: {
                  url: image
                }
              }
            ]
          }
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'identify_watch',
              description: 'Identify watch details from a photo',
              parameters: {
                type: 'object',
                properties: {
                  brand: {
                    type: 'string',
                    description: 'The watch brand name (e.g., Rolex, Omega, Seiko)'
                  },
                  model: {
                    type: 'string',
                    description: 'The complete model name and reference number if visible'
                  },
                  dial_color: {
                    type: 'string',
                    description: 'The color of the watch dial (e.g., Black, Blue, White, Silver)'
                  },
                  type: {
                    type: 'string',
                    description: 'The watch type/category (e.g., Diver, Chronograph, GMT, Dress, Pilot, Field)'
                  },
                  case_size: {
                    type: 'string',
                    description: 'The case diameter if identifiable (e.g., 40mm, 42mm)'
                  },
                  movement: {
                    type: 'string',
                    description: 'Movement type if known (e.g., Automatic, Manual, Quartz)'
                  },
                  case_material: {
                    type: 'string',
                    description: 'Case material if identifiable (e.g., Stainless Steel, Gold, Titanium, Bronze)'
                  },
                  bezel_type: {
                    type: 'string',
                    description: 'Bezel type if visible (e.g., Ceramic, Aluminum, Fixed, Rotating)'
                  },
                  strap_type: {
                    type: 'string',
                    description: 'Strap/bracelet type (e.g., Metal Bracelet, Leather, NATO, Rubber)'
                  },
                  confidence: {
                    type: 'string',
                    enum: ['high', 'medium', 'low'],
                    description: 'Confidence level of the identification'
                  },
                  notes: {
                    type: 'string',
                    description: 'Additional observations, distinguishing features, or uncertainties about the identification'
                  }
                },
                required: ['brand', 'model', 'dial_color', 'type', 'confidence'],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: 'function', function: { name: 'identify_watch' } }
      })
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI usage quota exceeded. Please add credits to your workspace.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    console.log('AI response received');

    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      throw new Error('No tool call in AI response');
    }

    const watchInfo = JSON.parse(toolCall.function.arguments);
    console.log('Identified watch:', watchInfo);

    return new Response(
      JSON.stringify(watchInfo),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error identifying watch:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
