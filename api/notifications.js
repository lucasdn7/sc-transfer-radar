const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');

// Configurações do Supabase
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://yonisrknsnsrigmgrcvk.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlvbmlzcmtuc25zcmlnbWdyY3ZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg1NTQyNzIsImV4cCI6MjA2NDEzMDI3Mn0.XOdf0QUrpyUfj-CeUL-WNaYUZ8LqXu2ZvYNU_pJahVM';

// Criar cliente Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Endpoint para criar notificações de vencimento de convênios
 * Este endpoint chama a função SQL create_expiration_notifications()
 */
router.post('/expiration', async (req, res) => {
  try {
    console.log('Disparando notificações de vencimento...');
    
    // Chamar a função SQL para criar notificações
    const { data, error } = await supabase.rpc('create_expiration_notifications');
    
    if (error) {
      console.error('Erro ao criar notificações de vencimento:', error);
      return res.status(500).json({
        error: 'Erro ao criar notificações de vencimento',
        details: error.message
      });
    }
    
    // Buscar as notificações criadas recentemente
    const { data: recentNotifications, error: fetchError } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (fetchError) {
      console.error('Erro ao buscar notificações recentes:', fetchError);
    }
    
    res.json({
      success: true,
      message: 'Notificações de vencimento criadas com sucesso',
      notifications: recentNotifications || []
    });
    
  } catch (error) {
    console.error('Erro no endpoint de notificações:', error);
    res.status(500).json({
      error: 'Erro interno ao processar notificações',
      details: error.message
    });
  }
});

/**
 * Endpoint para disparar notificação manual via GitHub Actions
 * Integra com o repositório contract-notifier
 */
router.post('/github-dispatch', async (req, res) => {
  try {
    const { source } = req.body;
    
    // Configurações do repositório contract-notifier
    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
    const OWNER = process.env.GITHUB_OWNER || 'lucasdn7';
    const REPO = process.env.GITHUB_REPO || 'contract-notifier';
    
    if (!GITHUB_TOKEN) {
      return res.status(400).json({
        error: 'GITHUB_TOKEN não configurado nas variáveis de ambiente'
      });
    }
    
    console.log(`Disparando workflow manual no repositório ${OWNER}/${REPO}...`);
    
    const response = await fetch(
      `https://api.github.com/repos/${OWNER}/${REPO}/dispatches`,
      {
        method: 'POST',
        headers: {
          'Accept': 'application/vnd.github+json',
          'Authorization': `Bearer ${GITHUB_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          event_type: 'relatorio_manual',
          client_payload: {
            source: source || 'manual_api'
          }
        })
      }
    );
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Erro ao disparar workflow GitHub:', errorText);
      return res.status(response.status).json({
        error: 'Erro ao disparar workflow GitHub',
        details: errorText
      });
    }
    
    res.json({
      success: true,
      message: 'Workflow disparado com sucesso no GitHub Actions',
      repository: `${OWNER}/${REPO}`
    });
    
  } catch (error) {
    console.error('Erro ao disparar GitHub dispatch:', error);
    res.status(500).json({
      error: 'Erro ao disparar workflow GitHub',
      details: error.message
    });
  }
});

/**
 * Endpoint para buscar notificações
 */
router.get('/', async (req, res) => {
  try {
    const { limit = 20, unread_only = false } = req.query;
    
    let query = supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(parseInt(limit));
    
    if (unread_only === 'true') {
      query = query.is('is_read', false);
    }
    
    const { data, error } = await query;
    
    if (error) {
      return res.status(500).json({
        error: 'Erro ao buscar notificações',
        details: error.message
      });
    }
    
    res.json({
      success: true,
      notifications: data || []
    });
    
  } catch (error) {
    console.error('Erro ao buscar notificações:', error);
    res.status(500).json({
      error: 'Erro interno ao buscar notificações',
      details: error.message
    });
  }
});

/**
 * Endpoint para marcar notificação como lida
 */
router.patch('/:id/read', async (req, res) => {
  try {
    const { id } = req.params;
    
    const { data, error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id)
      .select();
    
    if (error) {
      return res.status(500).json({
        error: 'Erro ao marcar notificação como lida',
        details: error.message
      });
    }
    
    res.json({
      success: true,
      notification: data[0]
    });
    
  } catch (error) {
    console.error('Erro ao marcar notificação como lida:', error);
    res.status(500).json({
      error: 'Erro interno ao marcar notificação',
      details: error.message
    });
  }
});

module.exports = router;