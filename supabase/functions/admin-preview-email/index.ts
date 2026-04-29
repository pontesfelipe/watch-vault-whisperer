import * as React from 'npm:react@18.3.1'
import { renderAsync } from 'npm:@react-email/components@0.0.22'
import { createClient } from 'npm:@supabase/supabase-js@2'
import { TEMPLATES } from '../_shared/transactional-email-templates/registry.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const authHeader = req.headers.get('Authorization') || ''

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: userData } = await userClient.auth.getUser()
    if (!userData?.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const adminClient = createClient(supabaseUrl, serviceKey)
    const { data: isAdmin } = await adminClient.rpc('has_role', {
      _user_id: userData.user.id, _role: 'admin',
    })
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { templateName, templateData, listTemplates } = await req.json().catch(() => ({}))

    if (listTemplates) {
      const list = Object.entries(TEMPLATES).map(([name, t]) => ({
        name, displayName: t.displayName || name, previewData: t.previewData || {},
      }))
      return new Response(JSON.stringify({ templates: list }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const entry = TEMPLATES[templateName]
    if (!entry) {
      return new Response(JSON.stringify({ error: 'Template not found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const data = templateData || entry.previewData || {}
    const html = await renderAsync(React.createElement(entry.component, data))
    const subject = typeof entry.subject === 'function' ? entry.subject(data) : entry.subject

    return new Response(JSON.stringify({ html, subject }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err: any) {
    console.error('admin-preview-email error', err)
    return new Response(JSON.stringify({ error: err?.message || 'Error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})