# Process Document Edge Function

Edge Function para processar documentos (PDF/DOCX), extrair texto, dividir em chunks e gerar embeddings.

## Configuração de Variáveis de Ambiente

```bash
supabase secrets set GEMINI_API_KEY="sua_chave_gemini"
supabase secrets set SUPABASE_SERVICE_ROLE_KEY="sua_service_role_key"
```

## Deploy

```bash
supabase functions deploy process-document
```

## Uso

### Executar a função

```bash
curl -X POST https://SEU_PROJECT_ID.supabase.co/functions/v1/process-document \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"document_id": 123}'
```

### Response

```json
{
  "message": "Documento processado com sucesso",
  "document_id": 123,
  "total_chunks": 25,
  "processed": 25,
  "errors": 0
}
```

## Funcionalidades

- Recebe um `document_id` da tabela `documents`
- Extrai texto do arquivo do Supabase Storage
- Suporta PDF (via pdf-parse) e DOCX (via jszip + XML parsing)
- Divide texto em chunks de ~500 tokens com overlap de 100 tokens
- Gera embedding de cada chunk via Gemini API (text-embedding-004)
- Insere chunks na tabela `document_chunks`
- Atualiza status do documento (processed, chunks_count, processed_at)

## Configurações

- Chunk size: 500 tokens
- Chunk overlap: 100 tokens
- Max file size: 10MB
- Delay entre chunks: 200ms (para evitar rate limit)

## Requisitos do Documento

- O documento deve existir na tabela `documents`
- O arquivo deve estar no bucket `documents` do Supabase Storage
- O campo `arquivo_path` deve conter o caminho do arquivo
- O campo `tipo_arquivo` ou `file_type` deve indicar o tipo (pdf/docx)

## Fluxo

1. Buscar documento na tabela `documents`
2. Baixar arquivo do Supabase Storage
3. Extrair texto baseado no tipo de arquivo
4. Dividir texto em chunks
5. Limpar chunks existentes para este documento
6. Gerar embedding de cada chunk
7. Inserir chunks na tabela `document_chunks`
8. Atualizar status do documento
