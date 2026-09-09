import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4"

// Configurações de rate limiting
const BATCH_SIZE = 10 // Processar 10 registros por vez
const DELAY_MS = 1000 // 1 segundo entre batches para evitar rate limit

// Função para gerar embedding via Gemini API
async function generateEmbedding(text: string): Promise<number[]> {
  const geminiApiKey = Deno.env.get('GEMINI_API_KEY')
  if (!geminiApiKey) {
    throw new Error('GEMINI_API_KEY não configurada')
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${geminiApiKey}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content: {
          parts: [{ text }]
        }
      })
    }
  )

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Erro ao gerar embedding: ${error}`)
  }

  const data = await response.json()
  return data.embedding.values
}

// Função para dormir entre batches
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

serve(async (req) => {
  // Apenas aceitar POST
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  try {
    // Inicializar cliente Supabase com service role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não configuradas')
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Buscar registros sem embedding
    const { data: records, error: fetchError } = await supabase
      .from('knowledge_base')
      .select('id, content')
      .is('embedding', null)
      .limit(100) // Limite de segurança

    if (fetchError) {
      throw fetchError
    }

    if (!records || records.length === 0) {
      return new Response(
        JSON.stringify({ 
          message: 'Nenhum registro encontrado sem embedding',
          processed: 0
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    }

    let processed = 0
    let errors = 0
    const total = records.length

    // Processar em batches
    for (let i = 0; i < total; i += BATCH_SIZE) {
      const batch = records.slice(i, i + BATCH_SIZE)
      
      for (const record of batch) {
        try {
          console.log(`Gerando embedding para registro ${record.id} (${processed + 1}/${total})`)
          
          const embedding = await generateEmbedding(record.content)
          
          const { error: updateError } = await supabase
            .from('knowledge_base')
            .update({ embedding })
            .eq('id', record.id)

          if (updateError) {
            console.error(`Erro ao atualizar registro ${record.id}:`, updateError)
            errors++
          } else {
            processed++
          }
        } catch (error) {
          console.error(`Erro ao processar registro ${record.id}:`, error)
          errors++
        }
      }

      // Delay entre batches para evitar rate limit
      if (i + BATCH_SIZE < total) {
        await sleep(DELAY_MS)
      }
    }

    return new Response(
      JSON.stringify({
        message: 'Processamento concluído',
        total,
        processed,
        errors
      }),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    )

  } catch (error: any) {
    console.error('Erro na Edge Function:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Erro interno ao processar requisição' }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
})
