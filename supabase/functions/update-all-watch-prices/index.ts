import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Fetch all watches
    const { data: watches, error: fetchError } = await supabaseClient
      .from('watches')
      .select('id, brand, model');

    if (fetchError) {
      console.error('Error fetching watches:', fetchError);
      throw fetchError;
    }

    console.log(`Updating prices for ${watches?.length || 0} watches...`);

    const results = [];
    for (const watch of watches || []) {
      try {
        // Call the fetch-watch-price function
        const { data: priceData, error: priceError } = await supabaseClient.functions.invoke(
          'fetch-watch-price',
          { body: { brand: watch.brand, model: watch.model } }
        );

        if (priceError) {
          console.error(`Error fetching price for ${watch.brand} ${watch.model}:`, priceError);
          results.push({ id: watch.id, success: false, error: priceError.message });
          continue;
        }

        // Update the watch with the new price
        const { error: updateError } = await supabaseClient
          .from('watches')
          .update({ average_resale_price: priceData.price })
          .eq('id', watch.id);

        if (updateError) {
          console.error(`Error updating ${watch.brand} ${watch.model}:`, updateError);
          results.push({ id: watch.id, success: false, error: updateError.message });
        } else {
          console.log(`Updated ${watch.brand} ${watch.model}: $${priceData.price}`);
          results.push({ id: watch.id, success: true, price: priceData.price });
        }

        // Add a small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`Error processing ${watch.brand} ${watch.model}:`, error);
        results.push({ id: watch.id, success: false, error: error instanceof Error ? error.message : 'Unknown error' });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    return new Response(
      JSON.stringify({
        message: `Updated ${successCount} watches successfully, ${failCount} failed`,
        results
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in update-all-watch-prices:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
