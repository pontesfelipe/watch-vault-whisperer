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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const { email } = await req.json();

    if (!email) {
      return new Response(
        JSON.stringify({ error: 'Email is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Check if this is the first user (first user is automatically allowed and becomes admin)
    const { count: userCount, error: countError } = await supabaseClient
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('Error counting users:', countError);
      return new Response(
        JSON.stringify({ error: 'Database error' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    // If this is the first user, allow them
    if (userCount === 0) {
      return new Response(
        JSON.stringify({ allowed: true, isFirstUser: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if email is in allowed_users table
    const { data: allowedUser, error: checkError } = await supabaseClient
      .from('allowed_users')
      .select('email')
      .eq('email', email)
      .maybeSingle();

    if (checkError) {
      console.error('Error checking allowed users:', checkError);
      return new Response(
        JSON.stringify({ error: 'Database error' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    return new Response(
      JSON.stringify({ allowed: !!allowedUser, isFirstUser: false }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
