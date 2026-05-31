const ALLOWED_ORIGINS = [
  'https://quiz.hasit.in',
  'https://hasit.in',
];

const ALLOWED_MODEL = 'mistral-small-latest';
const MAX_BODY_SIZE = 50 * 1024; // 50 KB
const MAX_TOKENS = 1024;

function getAllowedOrigin(request) {
  let origin = request.headers.get('Origin');
  if (!origin) {
    const referer = request.headers.get('Referer');
    if (referer) {
      try {
        const url = new URL(referer);
        origin = url.origin;
      } catch {
        // invalid Referer, ignore
      }
    }
  }
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    return origin;
  }
  return null;
}

function corsHeaders(origin) {
  return {
    'Access-Control-Allow-Origin': origin || 'null',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
  };
}

function jsonError(status, message, origin) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
  });
}

export default {
  async fetch(request, env) {
    const origin = getAllowedOrigin(request);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }

    if (request.method !== 'POST') {
      return jsonError(405, 'Method not allowed', origin);
    }

    if (!origin) {
      return jsonError(403, 'Forbidden origin', origin);
    }

    try {
      const contentLength = request.headers.get('Content-Length');
      if (contentLength && parseInt(contentLength, 10) > MAX_BODY_SIZE) {
        return jsonError(413, 'Payload too large', origin);
      }

      const text = await request.text();
      if (text.length > MAX_BODY_SIZE) {
        return jsonError(413, 'Payload too large', origin);
      }

      const body = JSON.parse(text);

      if (body.model !== ALLOWED_MODEL) {
        return jsonError(400, `Invalid model: ${body.model}`, origin);
      }

      if (!Array.isArray(body.messages) || body.messages.length === 0) {
        return jsonError(400, 'Invalid or empty messages array', origin);
      }

      if (typeof body.max_tokens !== 'number' || body.max_tokens < 1 || body.max_tokens > MAX_TOKENS) {
        body.max_tokens = MAX_TOKENS;
      }

      const mistralResponse = await fetch('https://api.mistral.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${env.MISTRAL_API_KEY}`,
        },
        body: JSON.stringify(body),
      });

      const data = await mistralResponse.json();

      return new Response(JSON.stringify(data), {
        status: mistralResponse.status,
        headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
      });
    } catch (error) {
      return jsonError(500, error.message, origin);
    }
  },
};
