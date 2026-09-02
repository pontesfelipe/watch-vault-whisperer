import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { verifyUser, unauthorizedResponse } from "../_shared/auth.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const auth = await verifyUser(req);
    if (!auth.user) {
      return unauthorizedResponse(corsHeaders, auth.error);
    }

    const { watches } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    if (!watches || watches.length < 3) {
      return new Response(
        JSON.stringify({ error: "Need at least 3 watches for analysis" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Analyzing collection of ${watches.length} watches...`);

    const fmt = (w: any) =>
      `${w.brand} ${w.model} (${w.dial_color}, ${w.type}${w.cost ? `, $${w.cost}` : ''})`;

    const owned = watches.filter((w: any) => (w.status ?? 'active') === 'active');
    const past = watches.filter((w: any) => (w.status ?? 'active') !== 'active');

    // Build detailed collection summary (current collection only)
    const collectionSummary = (owned.length ? owned : watches).map(fmt).join('\n');
    const pastSummary = past
      .map((w: any) => `${fmt(w)} - ${w.status === 'traded' ? 'TRADED AWAY' : 'SOLD'}${w.sale_reason ? `, reason: ${w.sale_reason}` : ''}`)
      .join('\n');

    // Get brand frequency
    const brandCount: Record<string, number> = {};
    const typeCount: Record<string, number> = {};
    const colorCount: Record<string, number> = {};
    
    (owned.length ? owned : watches).forEach((w: any) => {
      brandCount[w.brand] = (brandCount[w.brand] || 0) + 1;
      typeCount[w.type] = (typeCount[w.type] || 0) + 1;
      colorCount[w.dial_color] = (colorCount[w.dial_color] || 0) + 1;
    });

    const topBrands = Object.entries(brandCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([brand, count]) => `${brand} (${count})`)
      .join(', ');

    const topTypes = Object.entries(typeCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([type, count]) => `${type} (${count})`)
      .join(', ');

    const topColors = Object.entries(colorCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([color, count]) => `${color} (${count})`)
      .join(', ');

    const prompt = `You are a watch expert and collector analyst. Analyze this watch collection and provide personalized insights about the owner's taste, collecting style, and preferences.

CURRENT COLLECTION - these are owned right now (${(owned.length ? owned : watches).length} watches):
${collectionSummary}
${past.length ? `\nPAST WATCHES - these were SOLD or TRADED and are NO LONGER OWNED. Use them only as background context about how the collector's taste evolved. Never describe them as part of the current collection, and always mark them clearly as former pieces if you mention them:\n${pastSummary}\n` : ''}

Statistics:
- Top Brands: ${topBrands}
- Top Types: ${topTypes}
- Top Dial Colors: ${topColors}

Provide a warm, insightful analysis covering:
1. Overall collecting personality and taste
2. Brand and style preferences
3. Unique patterns or themes in the collection
4. What this collection says about the collector's personality
5. Potential collection strengths or interesting characteristics

Base your description of the collection on the CURRENT COLLECTION only. Past (sold/traded) watches may inform how taste evolved, but must be referred to in the past tense as pieces the collector no longer owns.

Write in second person ("you", "your") as if speaking directly to the collector. Be warm, insightful, and specific. Keep it conversational and engaging.

STRICT LENGTH LIMIT: Your entire response MUST be 480 characters or fewer (including spaces and punctuation), and MUST end with a complete sentence. Never stop mid-sentence. Be concise and prioritize the most meaningful observations.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You are a warm, insightful watch expert who loves helping collectors understand their taste and style." },
          { role: "user", content: prompt }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limits exceeded, please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required, please add funds to your Lovable AI workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    let insights = data.choices[0].message.content ?? "";
    if (insights.length > 500) {
      const cut = insights.slice(0, 500);
      const lastEnd = Math.max(cut.lastIndexOf(". "), cut.lastIndexOf("! "), cut.lastIndexOf("? "), cut.lastIndexOf("."), cut.lastIndexOf("!"), cut.lastIndexOf("?"));
      insights = (lastEnd > 200 ? cut.slice(0, lastEnd + 1) : cut.slice(0, cut.lastIndexOf(" ")) + "...").trim();
    }
    
    console.log("Generated insights successfully");

    return new Response(
      JSON.stringify({ insights }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in analyze-collection function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Failed to analyze collection" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
