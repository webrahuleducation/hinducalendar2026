import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { createClient } from 'npm:@supabase/supabase-js@2'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    )
    const token = authHeader.replace('Bearer ', '')
    const { data: claims, error: claimsErr } = await supabase.auth.getClaims(token)
    if (claimsErr || !claims?.claims?.sub) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    const userId = claims.claims.sub as string

    const body = await req.json().catch(() => ({}))
    const title = String(body?.title ?? '').trim().slice(0, 120)
    const message = String(body?.body ?? '').trim().slice(0, 500)
    if (!title || !message) {
      return new Response(JSON.stringify({ error: 'title and body required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const appKey = Deno.env.get('APPILIX_APP_KEY')
    const apiKey = Deno.env.get('APPILIX_API_KEY')
    if (!appKey || !apiKey) {
      return new Response(JSON.stringify({ error: 'Appilix keys not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const payload = new URLSearchParams({
      app_key: appKey,
      api_key: apiKey,
      notification_title: title,
      notification_body: message,
      user_identity: userId,
    }).toString()

    const ctrl = new AbortController()
    const timer = setTimeout(() => ctrl.abort(), 10_000)
    let upstreamStatus = 0
    let upstreamText = ''
    try {
      const res = await fetch('https://appilix.com/api/push-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
          Accept: 'application/json',
        },
        body: payload,
        signal: ctrl.signal,
      })
      upstreamStatus = res.status
      upstreamText = await res.text()
    } finally {
      clearTimeout(timer)
    }

    const ok = upstreamStatus >= 200 && upstreamStatus < 300
    return new Response(
      JSON.stringify({ ok, status: upstreamStatus, response: upstreamText.slice(0, 500) }),
      {
        status: ok ? 200 : 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})