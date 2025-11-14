import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { brand, model, watchId } = await req.json();

    if (!brand || !model) {
      return new Response(
        JSON.stringify({ error: "Brand and model are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Fetching price for ${brand} ${model}`);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    // Use Lovable AI to search for current market prices
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: "You are a watch market analyst. Search for current resale prices from multiple sources (Chrono24, WatchCharts, eBay, etc.) and provide an average market price in USD. Be precise and only return numerical data."
          },
          {
            role: "user",
            content: `What is the current average resale price for a ${brand} ${model} watch in USD? Search multiple marketplaces and provide a single average price. Only respond with the number, no currency symbols or text.`
          }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_price",
              description: "Extract the average resale price from market research",
              parameters: {
                type: "object",
                properties: {
                  price: {
                    type: "number",
                    description: "The average resale price in USD"
                  },
                  confidence: {
                    type: "string",
                    enum: ["high", "medium", "low"],
                    description: "Confidence level in the price estimate"
                  },
                  sources: {
                    type: "string",
                    description: "Brief note about data sources used"
                  }
                },
                required: ["price", "confidence"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "extract_price" } }
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    console.log("AI response:", JSON.stringify(aiData));

    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) {
      throw new Error("No price data extracted");
    }

    const priceData = JSON.parse(toolCall.function.arguments);
    const averagePrice = priceData.price;

    if (!averagePrice || averagePrice <= 0) {
      return new Response(
        JSON.stringify({ 
          error: "Could not determine a valid price",
          confidence: priceData.confidence 
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update the watch if watchId is provided
    if (watchId) {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      const { error: updateError } = await supabase
        .from("watches")
        .update({ average_resale_price: averagePrice })
        .eq("id", watchId);

      if (updateError) {
        console.error("Error updating watch:", updateError);
        throw updateError;
      }

      console.log(`Updated watch ${watchId} with price ${averagePrice}`);
    }

    return new Response(
      JSON.stringify({ 
        price: averagePrice,
        confidence: priceData.confidence,
        sources: priceData.sources,
        brand,
        model
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error fetching watch price:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Failed to fetch watch price" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});