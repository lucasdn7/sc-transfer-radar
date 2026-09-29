# generate-report

Edge Function para gerar relatórios públicos do Transferências SC usando consultas fixas às tabelas do portal.

## Tipos iniciais

- `executive`
- `processes`
- `financial`
- `expiring`
- `municipality`
- `custom`

## Formatos

A função aceita `json`, `csv`, `xlsx` e `pdf` no contrato. Nesta primeira implementação, `json` retorna dados e resumo estruturados; `csv` retorna o arquivo diretamente. `xlsx` e `pdf` retornam os dados estruturados para o frontend aplicar a formatação atual sem duplicar bibliotecas no runtime Deno.

## Segurança

- Apenas `POST` e `OPTIONS`.
- Origem de produção fixa em `https://transfersc.vercel.app`.
- Origens adicionais somente por `REPORT_ALLOWED_ORIGINS`.
- Limite de corpo de 64 KiB e máximo de 2.000 linhas.
- Allowlist de tipos, campos, filtros e ordenações.
- Nenhum SQL ou nome de RPC é aceito pelo cliente.
- A service role fica apenas no ambiente server-side.

## Execução local

A função depende de `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY` no ambiente da Edge Function. A implementação local não aplica migration, altera secret ou publica deployment.

## Próximas etapas

1. Confirmar no projeto de produção se os relacionamentos `process_parcels`, `municipalities`, `regional_nuclei` e `status_processos` possuem exatamente os campos usados aqui.
2. Adicionar rate limit específico para geração de relatórios antes do deploy público.
3. Criar geração profissional de XLSX/PDF e Storage privado para arquivos grandes.
4. Adicionar RPCs agregadoras para relatórios financeiros quando os campos de pagamentos estiverem confirmados.
