import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4"

// Rate limiting em memória (simples, por IP)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>()
const RATE_LIMIT_MAX = 20 // mensagens por minuto
const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minuto em ms

// Schema das funções RPC para function calling
const rpcFunctions = [
  {
    name: "match_knowledge_base",
    description: "Busca na base de conhecimento por conteúdo similar à pergunta do usuário",
    parameters: {
      type: "object",
      properties: {
        query_embedding: {
          type: "array",
          description: "Array de números representando o embedding da query (vetor de 768 dimensões)",
          items: { type: "number" }
        },
        match_count: {
          type: "number",
          description: "Número máximo de resultados a retornar",
          default: 5
        },
        similarity_threshold: {
          type: "number",
          description: "Limiar de similaridade (0 a 1)",
          default: 0.5
        }
      },
      required: ["query_embedding"]
    }
  },
  {
    name: "match_document_chunks",
    description: "Busca em chunks de documentos por conteúdo similar à pergunta do usuário",
    parameters: {
      type: "object",
      properties: {
        query_embedding: {
          type: "array",
          description: "Array de números representando o embedding da query (vetor de 768 dimensões)",
          items: { type: "number" }
        },
        match_count: {
          type: "number",
          description: "Número máximo de resultados a retornar",
          default: 5
        },
        similarity_threshold: {
          type: "number",
          description: "Limiar de similaridade (0 a 1)",
          default: 0.5
        },
        p_document_id: {
          type: "number",
          description: "ID do documento para filtrar (opcional)"
        }
      },
      required: ["query_embedding"]
    }
  },
  {
    name: "get_repasses_por_regiao",
    description: "Retorna os valores de repasses agrupados por região",
    parameters: {
      type: "object",
      properties: {
        p_regiao: {
          type: "string",
          description: "Nome da região para filtrar (opcional, se null retorna todas)"
        }
      }
    }
  },
  {
    name: "get_ranking_municipios",
    description: "Retorna ranking de municípios com base em critérios específicos",
    parameters: {
      type: "object",
      properties: {
        p_regiao: {
          type: "string",
          description: "Nome da região para filtrar (opcional, se null retorna todas)"
        },
        p_limite: {
          type: "number",
          description: "Número máximo de municípios a retornar",
          default: 10
        }
      }
    }
  },
  {
    name: "get_processos_por_municipio",
    description: "Retorna todos os processos de um município específico",
    parameters: {
      type: "object",
      properties: {
        p_municipio: {
          type: "string",
          description: "Nome do município para buscar processos"
        }
      },
      required: ["p_municipio"]
    }
  }
]

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

// Função para chamar Gemini com function calling
async function callGeminiWithTools(
  message: string,
  tools: any[],
  context?: string
): Promise<{ response: string; toolCall?: any }> {
  const geminiApiKey = Deno.env.get('GEMINI_API_KEY')
  if (!geminiApiKey) {
    throw new Error('GEMINI_API_KEY não configurada')
  }

  const systemPrompt = `Você é um assistente útil do portal de transferências do governo de Santa Catarina. 
Você deve responder em português brasileiro de forma clara e profissional.

${context ? `CONTEXTO ADICIONAL:\n${context}\n\n` : ''}

Quando o usuário perguntar sobre dados específicos (repasses, rankings, processos por município, etc), 
use as ferramentas disponíveis para buscar as informações no banco de dados.

Quando o usuário perguntar sobre conceitos, como o portal funciona, prazos, definições, etc,
use a base de conhecimento para fornecer respostas baseadas na documentação.

Seja conciso e direto em suas respostas.`

  const requestBody: any = {
    contents: [{
      parts: [{ text: message }]
    }],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 1000
    }
  }

  if (tools && tools.length > 0) {
    requestBody.tools = [{
      function_declarations: tools
    }]
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    }
  )

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Erro ao chamar Gemini: ${error}`)
  }

  const data = await response.json()
  const candidate = data.candidates?.[0]
  
  if (!candidate) {
    throw new Error('Nenhuma resposta do Gemini')
  }

  const part = candidate.content?.parts?.[0]
  
  // Verifica se houve chamada de ferramenta
  if (part?.functionCall) {
    return {
      response: '',
      toolCall: part.functionCall
    }
  }

  return {
    response: part?.text || 'Não foi possível gerar uma resposta.'
  }
}

// Função para chamar Gemini com resultado da tool
async function callGeminiWithToolResult(
  originalMessage: string,
  toolName: string,
  toolResult: any
): Promise<string> {
  const geminiApiKey = Deno.env.get('GEMINI_API_KEY')
  if (!geminiApiKey) {
    throw new Error('GEMINI_API_KEY não configurada')
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [{ text: originalMessage }]
          },
          {
            role: 'model',
            parts: [{
              functionCall: {
                name: toolName,
                args: {}
              }
            }]
          },
          {
            role: 'user',
            parts: [{
              functionResponse: {
                name: toolName,
                response: toolResult
              }
            }]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1000
        }
      })
    }
  )

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Erro ao chamar Gemini com resultado: ${error}`)
  }

  const data = await response.json()
  const candidate = data.candidates?.[0]
  const part = candidate?.content?.parts?.[0]
  
  return part?.text || 'Não foi possível processar o resultado.'
}

// Função para executar RPC no Supabase
async function executeRPC(
  supabase: any,
  functionName: string,
  params: any
): Promise<any> {
  try {
    const { data, error } = await supabase.rpc(functionName, params)
    
    if (error) {
      console.error(`Erro ao executar RPC ${functionName}:`, error)
      throw error
    }
    
    return data
  } catch (error) {
    console.error(`Erro ao executar RPC ${functionName}:`, error)
    throw error
  }
}

// Função para verificar rate limit
function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const record = rateLimitMap.get(ip)
  
  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW
    })
    return true
  }
  
  if (record.count >= RATE_LIMIT_MAX) {
    return false
  }
  
  record.count++
  return true
}

// Função para limpar rate limit antigo
function cleanupRateLimit() {
  const now = Date.now()
  for (const [ip, record] of rateLimitMap.entries()) {
    if (now > record.resetTime) {
      rateLimitMap.delete(ip)
    }
  }
}

// Limpar rate limit a cada 5 minutos
setInterval(cleanupRateLimit, 5 * 60 * 1000)

// Função para logar conversação
async function logConversation(
  supabase: any,
  sessionId: string,
  question: string,
  response: string,
  responseTimeMs: number,
  sourcesCount: number = 0,
  relevantResults: any[] = [],
  metadata: any = {}
) {
  try {
    await supabase.from('conversation_logs').insert({
      session_id: sessionId,
      question,
      response,
      sources_count: sourcesCount,
      relevant_results: relevantResults,
      response_time_ms: responseTimeMs,
      metadata
    })
  } catch (error) {
    console.error('Erro ao logar conversação:', error)
    // Não lançar erro para não interromper a resposta
  }
}

serve(async (req) => {
  // Apenas aceitar POST
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  try {
    const { message, session_id } = await req.json()

    // Validações
    if (!message || typeof message !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Mensagem é obrigatória e deve ser uma string' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    if (message.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: 'Mensagem não pode estar vazia' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    if (message.length > 2000) {
      return new Response(
        JSON.stringify({ error: 'Mensagem muito longa (máximo 2000 caracteres)' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    if (!session_id || typeof session_id !== 'string') {
      return new Response(
        JSON.stringify({ error: 'session_id é obrigatório e deve ser uma string' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Rate limiting por IP
    const ip = req.headers.get('x-forwarded-for') || 
               req.headers.get('x-real-ip') || 
               'unknown'
    
    if (!checkRateLimit(ip)) {
      return new Response(
        JSON.stringify({ error: 'Muitas requisições. Tente novamente em alguns minutos.' }),
        { status: 429, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const startTime = Date.now()

    // Inicializar cliente Supabase com service role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não configuradas')
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Gerar embedding da pergunta
    const embedding = await generateEmbedding(message)

    // Primeira chamada ao Gemini para decidir se usa tool ou knowledge base
    const geminiResponse = await callGeminiWithTools(message, rpcFunctions)

    let finalResponse = ''
    let sourcesCount = 0
    let relevantResults: any[] = []

    if (geminiResponse.toolCall) {
      // Gemini decidiu chamar uma tool
      const toolName = geminiResponse.toolCall.name
      const toolArgs = geminiResponse.toolCall.args

      // Executar a RPC correspondente
      const rpcResult = await executeRPC(supabase, toolName, toolArgs)
      
      sourcesCount = Array.isArray(rpcResult) ? rpcResult.length : 1
      relevantResults = Array.isArray(rpcResult) ? rpcResult : [rpcResult]

      // Enviar resultado de volta ao Gemini para formatar
      finalResponse = await callGeminiWithToolResult(message, toolName, rpcResult)
    } else {
      // Pergunta conceitual - usar knowledge base
      const kbResults = await executeRPC(supabase, 'match_knowledge_base', {
        query_embedding: embedding,
        match_count: 3,
        similarity_threshold: 0.5
      })

      sourcesCount = Array.isArray(kbResults) ? kbResults.length : 0
      relevantResults = Array.isArray(kbResults) ? kbResults : []

      if (kbResults && kbResults.length > 0) {
        const context = kbResults.map((item: any) => 
          `Título: ${item.title}\nConteúdo: ${item.content}`
        ).join('\n\n')

        finalResponse = await callGeminiWithTools(message, [], context)
      } else {
        // Sem resultados na knowledge base, responder sem contexto
        finalResponse = await callGeminiWithTools(
          message,
          [],
          'Não encontrei informações específicas na base de conhecimento. Responda de forma geral baseado no seu conhecimento sobre o portal de transferências.'
        )
      }
    }

    const responseTimeMs = Date.now() - startTime

    // Logar a conversação
    await logConversation(
      supabase,
      session_id,
      message,
      finalResponse,
      responseTimeMs,
      sourcesCount,
      relevantResults,
      { used_tool: !!geminiResponse.toolCall, tool_name: geminiResponse.toolCall?.name }
    )

    return new Response(
      JSON.stringify({
        response: finalResponse,
        session_id
      }),
      { 
        status: 200,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
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
