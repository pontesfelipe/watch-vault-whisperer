import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WearEntry {
  brand: string;
  model: string;
  date: string;
  wearCount: number;
}

function parseCSV(csvText: string): WearEntry[] {
  const lines = csvText.trim().split('\n');
  const entries: WearEntry[] = [];
  
  // Skip header row
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const parts = line.split(',');
    if (parts.length >= 4) {
      entries.push({
        brand: parts[0].trim(),
        model: parts[1].trim(),
        date: parts[2].trim(),
        wearCount: parseFloat(parts[3].trim()),
      });
    }
  }
  
  return entries;
}

function parseDate(dateStr: string): string {
  // Parse M/D/YY format (e.g., "3/13/25" -> "2025-03-13")
  const parts = dateStr.split('/');
  const month = parts[0].padStart(2, '0');
  const day = parts[1].padStart(2, '0');
  let year = parts[2];
  
  // Convert 2-digit year to 4-digit (assuming 20xx)
  if (year.length === 2) {
    year = '20' + year;
  }
  
  return `${year}-${month}-${day}`;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Get authenticated user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      throw new Error('Not authenticated');
    }

    const { csvData } = await req.json();
    
    if (!csvData) {
      throw new Error('CSV data is required');
    }

    console.log('Parsing CSV data...');
    const entries = parseCSV(csvData);
    console.log(`Parsed ${entries.length} entries`);

    // Fetch all user's watches
    const { data: watches, error: watchesError } = await supabase
      .from('watches')
      .select('id, brand, model')
      .eq('user_id', user.id);

    if (watchesError) {
      throw watchesError;
    }

    console.log(`Found ${watches?.length || 0} watches for user`);

    // Create a map for quick lookup
    const watchMap = new Map<string, string>();
    watches?.forEach((watch) => {
      const key = `${watch.brand.toLowerCase()}|${watch.model.toLowerCase()}`;
      watchMap.set(key, watch.id);
    });

    // Prepare wear entries
    const wearEntries = [];
    const skipped = [];

    for (const entry of entries) {
      const key = `${entry.brand.toLowerCase()}|${entry.model.toLowerCase()}`;
      const watchId = watchMap.get(key);

      if (!watchId) {
        skipped.push({ brand: entry.brand, model: entry.model, date: entry.date });
        continue;
      }

      const wearDate = parseDate(entry.date);

      wearEntries.push({
        watch_id: watchId,
        wear_date: wearDate,
        days: entry.wearCount,
        user_id: user.id,
      });
    }

    console.log(`Prepared ${wearEntries.length} wear entries, skipped ${skipped.length}`);

    // Insert wear entries (upsert to avoid duplicates)
    if (wearEntries.length > 0) {
      const { error: insertError } = await supabase
        .from('wear_entries')
        .upsert(wearEntries, {
          onConflict: 'watch_id,wear_date,user_id',
          ignoreDuplicates: false,
        });

      if (insertError) {
        throw insertError;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        imported: wearEntries.length,
        skipped: skipped,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error importing wear entries:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
