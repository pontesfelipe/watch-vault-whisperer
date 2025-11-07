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
    const { brand, modelReference } = await req.json();
    
    if (!brand || !modelReference) {
      return new Response(
        JSON.stringify({ error: "Brand and model reference are required" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log(`Searching for watch: ${brand} ${modelReference}`);

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
            content: 'You are a watch specification expert. Search for watch information and return ONLY valid JSON without any markdown formatting or explanation.'
          },
          {
            role: 'user',
            content: `Find the specifications for this watch: ${brand} ${modelReference}

Return the information in this exact JSON format:
{
  "model": "full model name",
  "dialColor": "dial color (e.g., Black, Blue, Silver, White, Green)",
  "type": "watch type (e.g., Diver, Chronograph, Pilot, GMT, Dress, Field)",
  "cost": retail price in USD as a number
}

If you cannot find this specific watch, return: {"error": "Watch not found"}

Important: Return ONLY the JSON object, no markdown formatting or explanation.`
          }
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits to your workspace." }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No content in AI response');
    }

    console.log('AI Response:', content);

    // Parse the JSON from the AI response
    // Remove markdown code blocks if present
    let jsonStr = content.trim();
    if (jsonStr.startsWith('```json')) {
      jsonStr = jsonStr.replace(/```json\n?/, '').replace(/\n?```$/, '');
    } else if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/```\n?/, '').replace(/\n?```$/, '');
    }

    const watchData = JSON.parse(jsonStr);

    if (watchData.error) {
      return new Response(
        JSON.stringify({ error: watchData.error }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate the response has required fields
    if (!watchData.model || !watchData.dialColor || !watchData.type || !watchData.cost) {
      throw new Error('Incomplete watch data from AI');
    }

    console.log('Watch data found:', watchData);

    return new Response(
      JSON.stringify(watchData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in search-watch-info:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Failed to search for watch information'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
