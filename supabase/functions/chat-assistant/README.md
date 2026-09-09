# Chat Assistant Edge Function

Edge Function do Supabase para assistente de chat com IA usando Gemini API e RAG (Retrieval-Augmented Generation).

## Configuração de Variáveis de Ambiente

Antes de fazer o deploy, configure as seguintes secrets no Supabase:

```bash
# Via CLI do Supabase
supabase secrets set GEMINI_API_KEY="sua_chave_gemini_aqui"
supabase secrets set SUPABASE_SERVICE_ROLE_KEY="sua_service_role_key_aqui"
```

Ou via dashboard do Supabase:
1. Acesse https://supabase.com/dashboard
2. Selecione seu projeto
3. Vá em Settings > Edge Functions > Secrets
4. Adicione:
   - `GEMINI_API_KEY`: Chave da API do Google Gemini
   - `SUPABASE_SERVICE_ROLE_KEY`: Service role key do seu projeto Supabase (encontrada em Settings > API)

## Deploy Local (para testes)

```bash
# Iniciar o servidor local
supabase functions serve chat-assistant

# Testar localmente
curl -X POST http://localhost:54321/functions/v1/chat-assistant \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"message": "Qual é o ranking de municípios?", "session_id": "test-session"}'
```

## Deploy para Produção

```bash
# Deploy da função
supabase functions deploy chat-assistant

# Verificar logs
supabase functions logs chat-assistant --tail
```

## API Endpoint

Após o deploy, a função estará disponível em:
```
https://SEU_PROJECT_ID.supabase.co/functions/v1/chat-assistant
```

## Uso

### Request

```json
POST /functions/v1/chat-assistant
Content-Type: application/json
Authorization: Bearer YOUR_ANON_KEY

{
  "message": "Qual é o ranking de municípios da região Serra?",
  "session_id": "user-session-123"
}
```

### Response

```json
{
  "response": "Com base nos dados, o ranking de municípios da região Serra é...",
  "session_id": "user-session-123"
}
```

## Funcionalidades

1. **Function Calling**: O Gemini decide automaticamente qual RPC chamar com base na pergunta
2. **RAG com Knowledge Base**: Para perguntas conceituais, busca na base de conhecimento
3. **Rate Limiting**: 20 mensagens por minuto por IP
4. **Logging**: Cada interação é registrada em `conversation_logs`
5. **Validações**: Mensagem não pode estar vazia e máximo 2000 caracteres

## RPCs Disponíveis

- `match_knowledge_base`: Busca na base de conhecimento
- `match_document_chunks`: Busca em chunks de documentos
- `get_repasses_por_regiao`: Repasses por região
- `get_ranking_municipios`: Ranking de municípios
- `get_processos_por_municipio`: Processos por município

## Segurança

- Usa service role key apenas no servidor (nunca exposta ao frontend)
- Rate limiting por IP
- Validação de entrada
- CORS configurado
