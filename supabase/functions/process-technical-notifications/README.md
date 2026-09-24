# Processador de notificacoes tecnicas

A funcao `process-technical-notifications` deve ser executada por um cron externo ao navegador, idealmente a cada 1 minuto. A janela de tolerancia implementada e de 5 minutos (`PROCESSOR_TOLERANCE_MS`), para absorver pequenos atrasos sem perder ocorrencias.

## Secrets obrigatorios

Configure no Supabase Edge Functions:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `RESEND_API_KEY`
- `NOTIFICATION_FROM_EMAIL`
- `NOTIFICATION_FROM_NAME`
- `APP_BASE_URL`

As funcoes exigem `Authorization: Bearer <SUPABASE_SERVICE_ROLE_KEY>` e nunca devem ser chamadas diretamente pelo frontend.

## Agendamento

O repositorio nao possui cron configurado no `config.toml`. No Supabase Dashboard, crie um agendamento para chamar:

`POST https://<project-ref>.supabase.co/functions/v1/process-technical-notifications`

com o header `Authorization: Bearer <SUPABASE_SERVICE_ROLE_KEY>` a cada minuto. A mesma funcao pode ser acionada por um worker seguro externo. Sem esse agendamento, as notificacoes continuam persistidas, mas nao serao processadas automaticamente.

A funcao aceita opcionalmente `{ "delivery_id": "..." }` para reprocessar somente uma entrega de e-mail com falha, sem criar nova ocorrencia.

## Recorrencia e horario

Todos os instantes sao persistidos como timestamps e calculados com UTC-3 fixo (`-03:00`), sem horario de verao. Ocorrencias mensais cujo dia nao existe sao ajustadas para o ultimo dia do mes. Dias uteis consideram segunda a sexta e nao consideram feriados nesta versao.
