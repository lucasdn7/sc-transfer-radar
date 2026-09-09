import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4"

// Configurações de chunking
const CHUNK_SIZE = 500 // tokens aproximados
const CHUNK_OVERLAP = 100 // tokens de overlap
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

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

// Função para extrair texto de PDF usando pdf-parse
async function extractTextFromPDF(buffer: ArrayBuffer): Promise<string> {
  try {
    // Importar pdf-parse dinamicamente
    const pdfParse = await import('https://esm.sh/pdf-parse@1.1.1/lib/pdf-parse.js')
    const data = await pdfParse.default(Buffer.from(buffer))
    return data.text
  } catch (error) {
    console.error('Erro ao extrair texto do PDF:', error)
    throw new Error('Não foi possível extrair texto do PDF')
  }
}

// Função para extrair texto de DOCX usando mammoth (via serviço externo ou biblioteca)
async function extractTextFromDOCX(buffer: ArrayBuffer): Promise<string> {
  try {
    // Para DOCX, vamos usar uma abordagem simplificada
    // Mammoth não funciona bem em Deno, então vamos usar um serviço externo ou pular
    // Por enquanto, vamos tentar usar uma biblioteca alternativa
    
    // Tentar usar uma biblioteca compatível com Deno
    const docx = await import('https://esm.sh/docx@8.5.0')
    // Nota: docx é para criar documentos, não para ler
    // Vamos usar uma abordagem alternativa
    
    throw new Error('Extração de DOCX não implementada. Use PDF por enquanto.')
  } catch (error) {
    console.error('Erro ao extrair texto do DOCX:', error)
    throw new Error('Não foi possível extrair texto do DOCX')
  }
}

// Função simples para extrair texto de DOCX (usando unzip e parsing XML)
async function extractTextFromDOCXSimple(buffer: ArrayBuffer): Promise<string> {
  try {
    // Usar jszip para extrair o conteúdo
    const JSZip = await import('https://esm.sh/jszip@3.10.1')
    const zip = await JSZip.loadAsync(buffer)
    
    // Ler o document.xml
    const documentXml = await zip.file('word/document.xml')?.async('string')
    if (!documentXml) {
      throw new Error('Arquivo DOCX inválido')
    }
    
    // Extrair texto do XML (remover tags)
    const text = documentXml
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
    
    return text
  } catch (error) {
    console.error('Erro ao extrair texto do DOCX:', error)
    throw new Error('Não foi possível extrair texto do DOCX')
  }
}

// Função para dividir texto em chunks
function chunkText(text: string, chunkSize: number = CHUNK_SIZE, overlap: number = CHUNK_OVERLAP): string[] {
  const chunks: string[] = []
  const words = text.split(/\s+/)
  
  if (words.length <= chunkSize) {
    return [text]
  }
  
  let startIndex = 0
  while (startIndex < words.length) {
    const endIndex = Math.min(startIndex + chunkSize, words.length)
    const chunk = words.slice(startIndex, endIndex).join(' ')
    chunks.push(chunk)
    
    // Avançar com overlap
    startIndex = endIndex - overlap
    
    // Se o overlap faz voltar ou ficar no mesmo lugar, avançar sem overlap
    if (startIndex >= endIndex) {
      startIndex = endIndex
    }
  }
  
  return chunks
}

// Função para dormir entre requests
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

serve(async (req) => {
  // Apenas aceitar POST
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  try {
    const { document_id } = await req.json()

    // Validações
    if (!document_id || typeof document_id !== 'number') {
      return new Response(
        JSON.stringify({ error: 'document_id é obrigatório e deve ser um número' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Inicializar cliente Supabase com service role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não configuradas')
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Buscar informações do documento
    const { data: document, error: docError } = await supabase
      .from('documents')
      .select('*')
      .eq('id', document_id)
      .single()

    if (docError || !document) {
      throw new Error('Documento não encontrado')
    }

    // Verificar se o arquivo existe no storage
    const { data: fileData, error: fileError } = await supabase
      .storage
      .from('documents')
      .download(document.arquivo_path)

    if (fileError || !fileData) {
      throw new Error('Arquivo não encontrado no storage')
    }

    // Converter para ArrayBuffer
    const buffer = await fileData.arrayBuffer()

    // Verificar tamanho do arquivo
    if (buffer.byteLength > MAX_FILE_SIZE) {
      throw new Error('Arquivo muito grande (máximo 10MB)')
    }

    // Extrair texto baseado no tipo de arquivo
    let text = ''
    const fileType = document.tipo_arquivo || document.file_type || ''
    
    if (fileType.toLowerCase().includes('pdf')) {
      text = await extractTextFromPDF(buffer)
    } else if (fileType.toLowerCase().includes('docx') || fileType.toLowerCase().includes('word')) {
      text = await extractTextFromDOCXSimple(buffer)
    } else {
      throw new Error(`Tipo de arquivo não suportado: ${fileType}`)
    }

    if (!text || text.trim().length === 0) {
      throw new Error('Não foi possível extrair texto do arquivo')
    }

    // Limpar o texto
    text = text.replace(/\s+/g, ' ').trim()

    console.log(`Texto extraído: ${text.length} caracteres`)

    // Dividir em chunks
    const chunks = chunkText(text)
    console.log(`Gerados ${chunks.length} chunks`)

    // Limpar chunks existentes para este documento
    await supabase
      .from('document_chunks')
      .delete()
      .eq('document_id', document_id)

    // Processar cada chunk
    let processed = 0
    let errors = 0

    for (let i = 0; i < chunks.length; i++) {
      try {
        console.log(`Processando chunk ${i + 1}/${chunks.length}`)
        
        const embedding = await generateEmbedding(chunks[i])
        
        const { error: insertError } = await supabase
          .from('document_chunks')
          .insert({
            document_id,
            content: chunks[i],
            embedding,
            chunk_index: i
          })

        if (insertError) {
          console.error(`Erro ao inserir chunk ${i}:`, insertError)
          errors++
        } else {
          processed++
        }

        // Delay para evitar rate limit
        if (i < chunks.length - 1) {
          await sleep(200) // 200ms entre chunks
        }
      } catch (error) {
        console.error(`Erro ao processar chunk ${i}:`, error)
        errors++
      }
    }

    // Atualizar status do documento
    await supabase
      .from('documents')
      .update({ 
        processed: true,
        chunks_count: processed,
        processed_at: new Date().toISOString()
      })
      .eq('id', document_id)

    return new Response(
      JSON.stringify({
        message: 'Documento processado com sucesso',
        document_id,
        total_chunks: chunks.length,
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
