export const config = { runtime: 'edge' };

const REPORT_SCRIPT_URL = process.env.CONTRACT_EXPIRATION_REPORT_URL;

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

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Método não permitido. Use POST.' }), {
      status: 405,
      headers,
    });
  }

  if (!REPORT_SCRIPT_URL) {
    return new Response(JSON.stringify({
      error: 'Variável CONTRACT_EXPIRATION_REPORT_URL não configurada no ambiente.',
    }), {
      status: 500,
      headers,
    });
  }

  try {
    const payload = await req.json().catch(() => ({}));

    const upstreamResponse = await fetch(REPORT_SCRIPT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const contentType = upstreamResponse.headers.get('content-type') || '';

    if (!upstreamResponse.ok) {
      const errorBody = await upstreamResponse.text();
      return new Response(JSON.stringify({
        error: 'Falha ao consultar o serviço externo de vencimentos.',
        details: errorBody,
      }), {
        status: upstreamResponse.status,
        headers,
      });
    }

    if (contentType.includes('application/json')) {
      const data = await upstreamResponse.json();
      return new Response(JSON.stringify(data), {
        status: 200,
        headers,
      });
    }

    const textBody = await upstreamResponse.text();
    return new Response(JSON.stringify({
      report: [],
      message: 'Serviço respondeu em texto. Ajuste o repositório externo para retornar JSON.',
      raw: textBody,
    }), {
      status: 200,
      headers,
    });
  } catch (error) {
    return new Response(JSON.stringify({
      error: 'Erro interno ao gerar relatório de vencimento.',
      details: error instanceof Error ? error.message : String(error),
    }), {
      status: 500,
      headers,
    });
  }
}
