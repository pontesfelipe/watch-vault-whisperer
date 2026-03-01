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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Verify caller is admin, service-role, or internal cron
    const authHeader = req.headers.get('Authorization');
    const cronSecret = req.headers.get('x-cron-secret');
    const expectedCronSecret = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    // Allow internal cron calls with service role key as cron secret
    const isCronCall = cronSecret && expectedCronSecret && cronSecret === expectedCronSecret;
    
    if (!isCronCall) {
      if (!authHeader) throw new Error('Not authenticated');
      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      if (authError || !user) throw new Error('Not authenticated');

      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .maybeSingle();
      if (!roleData) throw new Error('Admin access required');
    }

    // Get all ai_image_url values from watches
    const { data: watches } = await supabase
      .from('watches')
      .select('ai_image_url');

    const usedFiles = new Set<string>();
    for (const w of watches || []) {
      if (w.ai_image_url) {
        // Extract filename from URL (last path segment, strip query params)
        const url = new URL(w.ai_image_url);
        const segments = url.pathname.split('/');
        const fileName = segments[segments.length - 1];
        if (fileName) usedFiles.add(fileName);
      }
    }

    // List all files in watch-images bucket
    const { data: storageFiles, error: listError } = await supabase.storage
      .from('watch-images')
      .list('', { limit: 1000 });
    if (listError) throw new Error(`Failed to list storage: ${listError.message}`);

    const unusedFiles: string[] = [];
    for (const file of storageFiles || []) {
      if (!usedFiles.has(file.name)) {
        unusedFiles.push(file.name);
      }
    }

    console.log(`Found ${unusedFiles.length} unused images out of ${storageFiles?.length || 0} total`);

    const { dryRun } = await req.json().catch(() => ({ dryRun: true }));

    if (dryRun) {
      return new Response(JSON.stringify({
        totalFiles: storageFiles?.length || 0,
        usedFiles: usedFiles.size,
        unusedFiles: unusedFiles.length,
        unusedFileNames: unusedFiles,
        dryRun: true,
        message: 'Dry run - no files deleted. Set dryRun: false to delete.',
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Delete in batches of 100
    let deleted = 0;
    for (let i = 0; i < unusedFiles.length; i += 100) {
      const batch = unusedFiles.slice(i, i + 100);
      const { error: delError } = await supabase.storage
        .from('watch-images')
        .remove(batch);
      if (delError) {
        console.error(`Batch delete error: ${delError.message}`);
      } else {
        deleted += batch.length;
      }
    }

    return new Response(JSON.stringify({
      totalFiles: storageFiles?.length || 0,
      usedFiles: usedFiles.size,
      deletedFiles: deleted,
      dryRun: false,
      message: `Deleted ${deleted} unused images.`,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
