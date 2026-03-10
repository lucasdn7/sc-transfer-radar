export const config = { runtime: 'edge' };

const N8N_WEBHOOK_URL = 'https://casludn.app.n8n.cloud/webhook/dart-verificar';

export default async function handler(req) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers });
  }

  try {
    const body = await req.json();
    const { municipality_id, cnpj, name } = body;

    // Aguarda o N8N com timeout de 25s (dentro do limite do Edge)
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25000);

    try {
      await fetch(N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ municipality_id, cnpj, name }),
        signal: controller.signal,
      });
    } catch (e) {
      // timeout ou erro no N8N — não importa, retorna sucesso mesmo assim
    } finally {
      clearTimeout(timeout);
    }

    return new Response(JSON.stringify({ success: true, municipality_id }), {
      status: 200,
      headers,
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 200, // retorna 200 mesmo com erro para o frontend não travar
      headers,
    });
  }
}
