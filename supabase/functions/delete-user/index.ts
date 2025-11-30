import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    // Create client with service role for admin operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Create client with anon key to verify the requesting user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: { Authorization: authHeader },
      },
    });

    // Verify the requesting user
    const { data: { user: requestingUser }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !requestingUser) {
      throw new Error('Unauthorized');
    }

    const { userId, selfDelete } = await req.json();
    console.log(`Delete user request - userId: ${userId}, selfDelete: ${selfDelete}, requestingUser: ${requestingUser.id}`);

    // If self-delete, ensure the user is deleting their own account
    if (selfDelete) {
      if (userId !== requestingUser.id) {
        throw new Error('You can only delete your own account');
      }
    } else {
      // Check if requesting user is admin
      const { data: adminRole, error: roleError } = await supabaseAdmin
        .from('user_roles')
        .select('role')
        .eq('user_id', requestingUser.id)
        .eq('role', 'admin')
        .maybeSingle();

      if (roleError || !adminRole) {
        throw new Error('Only admins can delete other users');
      }
    }

    // Delete the user from auth.users (the trigger will handle data cleanup)
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (deleteError) {
      console.error('Error deleting user:', deleteError);
      throw new Error(`Failed to delete user: ${deleteError.message}`);
    }

    console.log(`Successfully deleted user: ${userId}`);

    return new Response(
      JSON.stringify({ success: true, message: 'User deleted successfully' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in delete-user function:', errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
