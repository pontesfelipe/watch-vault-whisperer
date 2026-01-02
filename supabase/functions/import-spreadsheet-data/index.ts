import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.80.0";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input validation schema for spreadsheet data
const watchDataSchema = z.object({
  brand: z.string().max(100).optional(),
  model: z.string().max(200).optional(),
}).passthrough();

const spreadsheetSchema = z.object({
  page1: z.array(watchDataSchema).max(1000).optional(),
  page3: z.array(watchDataSchema).max(1000).optional(),
  page4: z.array(watchDataSchema).max(1000).optional(),
  page5: z.array(watchDataSchema).max(1000).optional(),
});

const inputSchema = z.object({
  spreadsheetData: spreadsheetSchema,
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    
    // Validate input
    const parseResult = inputSchema.safeParse(body);
    if (!parseResult.success) {
      console.error('Validation error:', parseResult.error.errors);
      return new Response(
        JSON.stringify({ error: 'Invalid input: spreadsheet data exceeds limits or has invalid format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    const { spreadsheetData } = parseResult.data;
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabase.auth.getUser(token);

    if (!user) {
      throw new Error('Not authenticated');
    }

    console.log('Starting data import for user:', user.id);
    const results = {
      phase1: { status: 'pending', message: '' },
      phase2: { status: 'pending', message: '' },
      phase3: { status: 'pending', message: '' },
      phase4: { status: 'pending', message: '' },
      phase5: { status: 'pending', message: '' },
    };

    // Phase 1: Clear and repopulate wear entries
    try {
      console.log('Phase 1: Clearing wear entries...');
      const { error: deleteError } = await supabase
        .from('wear_entries')
        .delete()
        .eq('user_id', user.id);

      if (deleteError) throw deleteError;

      // Parse wear data from spreadsheet
      const wearData = spreadsheetData.page1 || [];
      const wearEntries: any[] = [];

      for (const watch of wearData) {
        const { data: watchRecord } = await supabase
          .from('watches')
          .select('id')
          .eq('brand', watch.brand)
          .eq('model', watch.model)
          .eq('user_id', user.id)
          .single();

        if (!watchRecord) {
          console.log(`Watch not found: ${watch.brand} ${watch.model}`);
          continue;
        }

        // Distribute days across months
        const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
        const year = 2025;

        for (let i = 0; i < months.length; i++) {
          const monthKey = months[i];
          const watchAny = watch as any;
          const days = parseFloat(String(watchAny[monthKey] || 0));
          
          if (days > 0) {
            const monthNum = i + 1;
            const daysInMonth = new Date(year, monthNum, 0).getDate();
            
            // Distribute days evenly throughout the month
            const daysToAdd = Math.floor(days);
            const hasHalfDay = days % 1 !== 0;
            
            for (let d = 0; d < daysToAdd; d++) {
              const dayOfMonth = Math.floor((d + 1) * (daysInMonth / (daysToAdd + (hasHalfDay ? 1 : 0))));
              const wearDate = `${year}-${String(monthNum).padStart(2, '0')}-${String(dayOfMonth).padStart(2, '0')}`;
              
              wearEntries.push({
                watch_id: watchRecord.id,
                user_id: user.id,
                wear_date: wearDate,
                days: 1,
              });
            }
            
            if (hasHalfDay) {
              const dayOfMonth = Math.floor((daysToAdd + 0.5) * (daysInMonth / (daysToAdd + 1)));
              const wearDate = `${year}-${String(monthNum).padStart(2, '0')}-${String(dayOfMonth).padStart(2, '0')}`;
              
              wearEntries.push({
                watch_id: watchRecord.id,
                user_id: user.id,
                wear_date: wearDate,
                days: 0.5,
              });
            }
          }
        }
      }

      if (wearEntries.length > 0) {
        const { error: insertError } = await supabase
          .from('wear_entries')
          .insert(wearEntries);

        if (insertError) throw insertError;
      }

      results.phase1 = { status: 'success', message: `Imported ${wearEntries.length} wear entries` };
      console.log('Phase 1 complete:', results.phase1.message);
    } catch (error) {
      results.phase1 = { status: 'error', message: error instanceof Error ? error.message : 'Unknown error' };
      console.error('Phase 1 error:', error);
    }

    // Phase 2: Update watch specifications
    try {
      console.log('Phase 2: Updating watch specifications...');
      const specsData = spreadsheetData.page3 || [];
      let updatedCount = 0;

      for (const spec of specsData) {
        const specAny = spec as any;
        const { data: watchRecord } = await supabase
          .from('watches')
          .select('id')
          .eq('brand', specAny.brand)
          .eq('model', specAny.model)
          .eq('user_id', user.id)
          .single();

        if (!watchRecord) continue;

        const { error: updateError } = await supabase
          .from('watches')
          .update({
            case_size: specAny.caseSize,
            lug_to_lug_size: specAny.lugToLug,
            caseback_material: specAny.caseback,
            movement: specAny.movement,
            cost: parseFloat(String(specAny.price || '0').replace(/[$,]/g, '')),
          })
          .eq('id', watchRecord.id);

        if (updateError) {
          console.error(`Error updating watch ${spec.brand} ${spec.model}:`, updateError);
        } else {
          updatedCount++;
        }
      }

      results.phase2 = { status: 'success', message: `Updated ${updatedCount} watches with specifications` };
      console.log('Phase 2 complete:', results.phase2.message);
    } catch (error) {
      results.phase2 = { status: 'error', message: error instanceof Error ? error.message : 'Unknown error' };
      console.error('Phase 2 error:', error);
    }

    // Phase 3: Update personal notes
    try {
      console.log('Phase 3: Updating personal notes...');
      const notesData = spreadsheetData.page4 || [];
      let updatedCount = 0;

      for (const note of notesData) {
        const noteAny = note as any;
        const { data: watchRecord } = await supabase
          .from('watches')
          .select('id')
          .eq('brand', noteAny.brand)
          .eq('model', noteAny.model)
          .eq('user_id', user.id)
          .single();

        if (!watchRecord) continue;

        const { error: updateError } = await supabase
          .from('watches')
          .update({
            why_bought: noteAny.whyBought,
            when_bought: noteAny.whenBought,
            what_i_like: noteAny.whatILike,
            what_i_dont_like: noteAny.whatIDontLike,
          })
          .eq('id', watchRecord.id);

        if (updateError) {
          console.error(`Error updating notes for ${note.brand} ${note.model}:`, updateError);
        } else {
          updatedCount++;
        }
      }

      results.phase3 = { status: 'success', message: `Updated ${updatedCount} watches with personal notes` };
      console.log('Phase 3 complete:', results.phase3.message);
    } catch (error) {
      results.phase3 = { status: 'error', message: error instanceof Error ? error.message : 'Unknown error' };
      console.error('Phase 3 error:', error);
    }

    // Phase 4: Sync wishlist
    try {
      console.log('Phase 4: Syncing wishlist...');
      
      const { error: deleteError } = await supabase
        .from('wishlist')
        .delete()
        .eq('user_id', user.id);

      if (deleteError) throw deleteError;

      const wishlistData = spreadsheetData.page5 || [];
      const wishlistEntries = wishlistData.map((item: any) => ({
        brand: item.brand,
        model: item.model,
        dial_colors: item.dialColors,
        rank: item.rank,
        user_id: user.id,
        is_ai_suggested: false,
      }));

      if (wishlistEntries.length > 0) {
        const { error: insertError } = await supabase
          .from('wishlist')
          .insert(wishlistEntries);

        if (insertError) throw insertError;
      }

      results.phase4 = { status: 'success', message: `Synced ${wishlistEntries.length} wishlist items` };
      console.log('Phase 4 complete:', results.phase4.message);
    } catch (error) {
      results.phase4 = { status: 'error', message: error instanceof Error ? error.message : 'Unknown error' };
      console.error('Phase 4 error:', error);
    }

    // Phase 5: AI-powered rarity and historical analysis
    try {
      console.log('Phase 5: Running AI analysis...');
      const { data: watches } = await supabase
        .from('watches')
        .select('id, brand, model')
        .eq('user_id', user.id);

      if (!watches) throw new Error('No watches found');

      let analyzedCount = 0;
      const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

      for (const watch of watches) {
        try {
          const response = await fetch(`${supabaseUrl}/functions/v1/analyze-watch-metadata`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${LOVABLE_API_KEY}`,
            },
            body: JSON.stringify({
              brand: watch.brand,
              model: watch.model,
            }),
          });

          if (response.ok) {
            const analysis = await response.json();
            
            await supabase
              .from('watches')
              .update({
                rarity: analysis.rarity,
                historical_significance: analysis.historical_significance,
              })
              .eq('id', watch.id);

            analyzedCount++;
          }

          // Rate limiting: wait 1 second between requests
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
          console.error(`Error analyzing ${watch.brand} ${watch.model}:`, error);
        }
      }

      results.phase5 = { status: 'success', message: `Analyzed ${analyzedCount} watches` };
      console.log('Phase 5 complete:', results.phase5.message);
    } catch (error) {
      results.phase5 = { status: 'error', message: error instanceof Error ? error.message : 'Unknown error' };
      console.error('Phase 5 error:', error);
    }

    return new Response(
      JSON.stringify({ success: true, results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in import-spreadsheet-data:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
