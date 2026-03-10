import type { VercelRequest, VercelResponse } from '@vercel/node';

const N8N_WEBHOOK_URL = 'https://casludn.app.n8n.cloud/webhook/dart-verificar';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { municipality_id, cnpj, name } = req.body;

    // Dispara o N8N sem esperar a resposta (fire and forget)
    // Isso evita timeout do Vercel
    fetch(N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ municipality_id, cnpj, name }),
    }).catch(err => console.error('N8N error:', err));

    // Responde imediatamente ao frontend
    // O frontend vai recarregar os dados do Supabase após alguns segundos
    return res.status(200).json({ 
      success: true, 
      message: 'Verificação iniciada',
      municipality_id 
    });

  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
