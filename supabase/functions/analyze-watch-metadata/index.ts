import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { verifyUser, unauthorizedResponse } from "../_shared/auth.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input validation schema
const inputSchema = z.object({
  brand: z.string().min(1).max(100).regex(/^[a-zA-Z0-9\s\-\.&']+$/, 'Invalid brand format'),
  model: z.string().min(1).max(200).regex(/^[a-zA-Z0-9\s\-\.\/&'()]+$/, 'Invalid model format'),
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const auth = await verifyUser(req);
    if (!auth.user) {
      return unauthorizedResponse(corsHeaders, auth.error);
    }

    const body = await req.json();
    
    // Validate input
    const parseResult = inputSchema.safeParse(body);
    if (!parseResult.success) {
      console.error('Validation error:', parseResult.error.errors);
      return new Response(
        JSON.stringify({ error: 'Invalid input: ' + parseResult.error.errors.map(e => e.message).join(', ') }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const { brand, model } = parseResult.data;

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log(`Analyzing watch: ${brand} ${model}`);

    const systemPrompt = `You are a watch expert specializing in luxury timepieces. You classify watches honestly and conservatively. Most watches in production are COMMON — do not inflate rarity just because a watch is expensive, luxury, or well-known. Popularity and desirability are NOT rarity.

Use these strict RARITY definitions:

- "common": Current or recent-production catalog models that are widely available at authorized dealers or on the secondary market with no meaningful waitlist. Examples: standard Rolex Datejust, Omega Seamaster 300M, Tudor Black Bay, most Seiko, TAG Heuer Carrera, Cartier Tank, Longines, Tissot, Hamilton, Breitling Navitimer, IWC Pilot, Panerai Luminor base models, JLC Reverso Classic, JLC Master Control, most Grand Seiko catalog references.
- "uncommon": Regular production but with real supply constraints — multi-month waitlists at ADs, discontinued within the last ~10 years but still findable, or lower-volume references from mainstream brands. Examples: standard Rolex Submariner/GMT (waitlisted but produced in volume), Omega Speedmaster Professional, AP Royal Oak Selfwinding steel base models.
- "rare": Genuinely low production or hard to source: limited editions of a few thousand or less, long-discontinued references (~20+ years) with thin market supply, or independent brands with small annual output (e.g., Moser, Laurent Ferrier, most F.P. Journe catalog).
- "very_rare": Limited editions of a few hundred or fewer, or vintage references that rarely trade. Serious collector pieces.
- "grail": Iconic, historically important, or extremely low-production references that most collectors will never own (e.g., Paul Newman Daytona, original Nautilus 3700, Rolex Daytona 6263 "Big Red", unique pieces, top independents like Philippe Dufour Simplicity).

Default to "common" unless you have specific evidence to justify higher. If unsure between two tiers, pick the lower one.

For HISTORICAL SIGNIFICANCE:
- "regular": Standard catalog piece with no specific historical role.
- "notable": Recognized design icon or long-running important reference in the brand's lineup (e.g., Reverso, Speedmaster, Royal Oak line generally).
- "historically_significant": Directly tied to a specific historical event, first-of-its-kind innovation, or major cultural moment (e.g., Speedmaster on the moon, first automatic chronograph, first dive watch).

Provide detailed reasoning citing production volume, availability, and evidence for the tier chosen.`;

    const userPrompt = `Classify this watch using the strict rarity tiers. Default to "common" unless there is clear evidence of low production or constrained availability. Do NOT confuse "expensive" or "prestigious" with "rare".

Watch: ${brand} ${model}

Answer these before deciding:
1. Is this a current or recent catalog reference from a brand that produces it in volume? If yes → "common".
2. Is there a documented production cap (limited edition number) or is it long-discontinued with thin supply? If not, it is not "rare".
3. What is the approximate annual production or total production run, if known?
4. Is it readily available at ADs or on the secondary market today?

Then classify rarity and historical significance and explain your reasoning with specific evidence.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'classify_watch',
              description: 'Classify a watch based on rarity and historical significance',
              parameters: {
                type: 'object',
                properties: {
                  rarity: {
                    type: 'string',
                    enum: ['common', 'uncommon', 'rare', 'very_rare', 'grail'],
                    description: 'The rarity classification of the watch'
                  },
                  historical_significance: {
                    type: 'string',
                    enum: ['regular', 'notable', 'historically_significant'],
                    description: 'The historical significance of the watch'
                  },
                  reasoning: {
                    type: 'string',
                    description: 'Detailed explanation of the classifications'
                  }
                },
                required: ['rarity', 'historical_significance', 'reasoning'],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: 'function', function: { name: 'classify_watch' } }
      }),
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
          JSON.stringify({ error: 'Payment required. Please add credits to your Lovable workspace.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      throw new Error('Failed to analyze watch metadata');
    }

    const aiResponse = await response.json();
    console.log('AI response:', JSON.stringify(aiResponse, null, 2));

    // Extract tool call result
    const toolCall = aiResponse.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      throw new Error('No tool call in AI response');
    }

    const result = JSON.parse(toolCall.function.arguments);
    
    console.log(`Analysis complete for ${brand} ${model}:`, result);

    return new Response(
      JSON.stringify({
        rarity: result.rarity,
        historical_significance: result.historical_significance,
        reasoning: result.reasoning
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in analyze-watch-metadata:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
