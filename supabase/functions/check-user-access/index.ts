import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { checkRateLimit } from "../_shared/rate-limiter.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Input validation schema
const inputSchema = z.object({
  email: z.string().email('Invalid email format').max(255, 'Email too long'),
});

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Strict per-IP rate limit to slow allow-list email enumeration.
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("cf-connecting-ip") ||
      "unknown";
    const limit = checkRateLimit(ip, "check-user-access", 5, 60 * 60 * 1000);
    if (!limit.allowed) {
      const retryAfterSec = Math.ceil((limit.retryAfterMs || 3600_000) / 1000);
      return new Response(
        JSON.stringify({ allowed: false }),
        {
          status: 429,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
            "Retry-After": String(retryAfterSec),
          },
        }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

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
    
    const { email } = parseResult.data;

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
