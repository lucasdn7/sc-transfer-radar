const N8N_WEBHOOK_URL = 'https://casludn.app.n8n.cloud/webhook/dart-verificar';

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  const { municipality_id, cnpj, name } = req.body || {};

  fetch(N8N_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ municipality_id, cnpj, name }),
  }).catch(() => {});

  return res.status(200).json({ success: true, municipality_id });
};
