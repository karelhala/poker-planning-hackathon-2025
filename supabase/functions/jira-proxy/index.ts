// supabase/functions/jira-proxy/index.ts

// Type declaration for Deno global
declare const Deno: any;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-jira-domain, x-jira-email, x-jira-token',
}

// Use Deno.serve directly (No import needed)
Deno.serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { jql } = await req.json()
    const domain = req.headers.get('x-jira-domain')
    const email = req.headers.get('x-jira-email')
    const token = req.headers.get('x-jira-token')

    if (!domain || !email || !token) {
      throw new Error('Missing Jira credentials headers')
    }

    const jiraUrl = `https://${domain}/rest/api/3/search?jql=${encodeURIComponent(jql || 'order by created DESC')}`
    
    const response = await fetch(jiraUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${btoa(`${email}:${token}`)}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    })

    const data = await response.json()

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})