import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { watchId, notes } = await req.json();
    
    if (!watchId || !notes) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'AI service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Analyze sentiment using Lovable AI
    const prompt = `You are analyzing a watch owner's personal notes about their watch. The notes include several fields: "Why I bought it", "What I like", and "What I don't like".

IMPORTANT INSTRUCTIONS:
1. Compare the "What I like" section against the "What I don't like" section carefully.
2. Count the number and strength of positive points vs negative points.
3. If the positives clearly outweigh the negatives (more positive points, or stronger positive language), the sentiment should be Positive or Highly Positive.
4. If the negatives clearly outweigh the positives, the sentiment should be Negative or Highly Negative.
5. If they are roughly balanced, classify as Neutral.
6. The "Why I bought it" section often adds emotional/positive context — factor that in as well.
7. Minor or cosmetic complaints (e.g., "could be thinner", "water resistance") should NOT outweigh multiple strong positives like "perfect size", "beautiful dial", "comfortable".

Notes:
${notes}

Return ONLY the sentiment category: "Highly Positive", "Positive", "Neutral", "Negative", or "Highly Negative". Nothing else.`;

    console.log('Analyzing sentiment for watch:', watchId);

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'You are a sentiment analysis expert. Respond with only the sentiment category.' },
          { role: 'user', content: prompt }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits depleted. Please add credits to continue.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const sentiment = data.choices[0]?.message?.content?.trim() || 'Neutral';

    // Update the watch with sentiment
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { error: updateError } = await supabase
      .from('watches')
      .update({ 
        sentiment,
        sentiment_analyzed_at: new Date().toISOString()
      })
      .eq('id', watchId);

    if (updateError) {
      console.error('Error updating watch:', updateError);
      throw updateError;
    }

    console.log('Sentiment analyzed successfully:', sentiment);

    return new Response(
      JSON.stringify({ sentiment }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in analyze-sentiment function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
