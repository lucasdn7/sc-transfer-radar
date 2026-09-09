# Generate Embeddings Edge Function

Edge Function para gerar embeddings da tabela `knowledge_base` usando a API do Gemini.

## Configuração de Variáveis de Ambiente

```bash
supabase secrets set GEMINI_API_KEY="sua_chave_gemini"
supabase secrets set SUPABASE_SERVICE_ROLE_KEY="sua_service_role_key"
```

## Deploy

```bash
supabase functions deploy generate-embeddings
```

## Uso

### Executar a função

```bash
curl -X POST https://SEU_PROJECT_ID.supabase.co/functions/v1/generate-embeddings \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json"
```

### Response

```json
{
  "message": "Processamento concluído",
  "total": 50,
  "processed": 48,
  "errors": 2
}
```

## Funcionalidades

- Busca registros de `knowledge_base` onde `embedding IS NULL`
- Gera embedding do campo `content` via Gemini API (text-embedding-004)
- Atualiza a coluna `embedding` com o vetor gerado
- Processa em batches de 10 registros por vez
- Delay de 1 segundo entre batches para evitar rate limit
- Limite de 100 registros por execução (segurança)

## Rate Limiting

- Batch size: 10 registros
- Delay entre batches: 1 segundo
- Limite por execução: 100 registros
