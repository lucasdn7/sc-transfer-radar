// ============================================================
// Arquivo: api/dart-verificar.ts
// Coloque este arquivo na raiz do seu projeto em /api/
// O Vercel vai criar automaticamente a rota /api/dart-verificar
// Isso resolve o CORS pois a chamada parte do servidor, não do browser
// ============================================================

import type { VercelRequest, VercelResponse } from '@vercel/node';

const N8N_WEBHOOK_URL = 'https://casludn.app.n8n.cloud/webhook/dart-verificar';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Permite chamadas do seu site
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Responde ao preflight OPTIONS
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { municipality_id, cnpj, name } = req.body;

    // Chama o N8N pelo servidor (sem CORS)
    const response = await fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ municipality_id, cnpj, name }),
    });

    if (!response.ok) {
      throw new Error(`N8N retornou ${response.status}`);
    }

    const data = await response.json();
    return res.status(200).json(data);

  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
