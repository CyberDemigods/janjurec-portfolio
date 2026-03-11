// Cloudflare Worker for Jan Jurec Portfolio - Session Logging
// Stores terminal commands and paint saves in KV

export default {
    async fetch(request, env) {
        // CORS headers
        const corsHeaders = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        };

        if (request.method === 'OPTIONS') {
            return new Response(null, { headers: corsHeaders });
        }

        const url = new URL(request.url);

        // POST - log session data
        if (request.method === 'POST') {
            try {
                const body = await request.json();
                const { session, type, data, image, timestamp } = body;

                if (!session || !type) {
                    return new Response(JSON.stringify({ error: 'Missing session or type' }), {
                        status: 400,
                        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                    });
                }

                // For paintings, store the full image
                if (type === 'painting_save' && image) {
                    const paintKey = `paint:${session}:${Date.now()}`;
                    await env.PORTFOLIO_LOGS.put(paintKey, JSON.stringify({
                        session,
                        image,
                        timestamp: timestamp || new Date().toISOString(),
                    }), { expirationTtl: 60 * 60 * 24 * 30 }); // 30 days

                    return new Response(JSON.stringify({ ok: true, key: paintKey }), {
                        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                    });
                }

                // For terminal commands and other events, append to session log
                const logKey = `log:${session}`;
                const existing = await env.PORTFOLIO_LOGS.get(logKey);
                const logs = existing ? JSON.parse(existing) : [];
                logs.push({
                    type,
                    data,
                    timestamp: timestamp || new Date().toISOString(),
                });

                // Keep last 200 entries per session
                if (logs.length > 200) logs.splice(0, logs.length - 200);

                await env.PORTFOLIO_LOGS.put(logKey, JSON.stringify(logs), {
                    expirationTtl: 60 * 60 * 24 * 30 // 30 days
                });

                return new Response(JSON.stringify({ ok: true }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });

            } catch (e) {
                return new Response(JSON.stringify({ error: e.message }), {
                    status: 500,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }
        }

        // GET - admin view (list sessions, paintings)
        if (request.method === 'GET') {
            const key = url.searchParams.get('key');

            // Get specific entry
            if (key) {
                const value = await env.PORTFOLIO_LOGS.get(key);
                if (!value) {
                    return new Response(JSON.stringify({ error: 'Not found' }), {
                        status: 404,
                        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                    });
                }
                return new Response(value, {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
            }

            // List recent entries
            const prefix = url.searchParams.get('prefix') || 'paint:';
            const list = await env.PORTFOLIO_LOGS.list({ prefix, limit: 50 });

            return new Response(JSON.stringify({
                keys: list.keys.map(k => ({
                    name: k.name,
                    expiration: k.expiration,
                }))
            }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        return new Response('Jan Jurec Portfolio Logger', {
            headers: { ...corsHeaders, 'Content-Type': 'text/plain' }
        });
    }
};
