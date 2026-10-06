# DART verification through the official CIASC API

**Status:** awaiting user review  
**Date:** 2026-10-06

## Context

The `/dart` page currently sends `municipality_id`, `cnpj`, and `name` to `/api/dart-verificar`. That Vercel Edge endpoint forwards the request to an n8n Cloud webhook. The n8n workflow is not present in this repository, and the Vercel endpoint returns HTTP 200 even if the webhook fails. The page then polls `municipalities` and can report a successful start without ever receiving a result.

The `municipalities` table already contains the fields needed for persistence: `dart_status`, `dart_validade`, `dart_verificado_em`, `dart_detalhes`, `dart_details`, and `dart_last_checked_at`. No schema change is intended.

The official DART web app is client rendered. Its public configuration identifies the CIASC API host, and its frontend calls the consultation endpoint with `cnpjcpf` and `idConsulta`. The public selector maps `idConsulta=1` to “Transferência (TRA)” and `idConsulta=2` to “Convênio Simplificado” (TEV). A read-only GET to the latter returned JSON containing `hasError`, `listaCredores`, creditor-level `flComprovado`, unmet requirement counts, requirements, and CND data.

## Goals

- Remove the DART workflow's dependency on the inaccessible n8n webhook.
- Verify the municipal CNPJ already stored in Supabase against the official DART API, using the Convênio Simplificado consultation (`idConsulta=2`).
- Persist the result in the existing DART columns and return a result the page can display immediately.
- Make individual and batch verification accurately represent success, irregularity, missing registration, upstream errors, and timeouts.
- Improve the `/dart` page's visual hierarchy and show useful requirement details without horizontal overflow.
- Preserve the page's current access and its individual/batch verification actions.

## Non-goals

- Reimplement the DART calculation or independently decide whether each legal requirement is satisfied. The official API's `flComprovado` value is authoritative.
- Automate login, browser interaction, or scraping the rendered portal.
- Change municipal CNPJs, RLS policies, or other municipality fields.
- Retain n8n as a fallback; it is not inspectable or verifiable by this project.

## Proposed architecture

The browser invokes a new Supabase Edge Function, `verificar-dart`, with a municipality ID only. The function reads that municipality and its CNPJ from Supabase, validates the record, and calls the official CIASC endpoint:

```text
GET https://dart-api.prod.okd4.ciasc.sc.gov.br/api/consulta/consulta
    ?cnpjcpf=<digits-only CNPJ>
    &idConsulta=2
```

The function normalizes the official response, updates only the DART-specific fields on the same municipality row, and returns the normalized status and details. Supabase credentials remain server-side. The frontend invalidates the municipality query and presents the returned result; it does not send an independently supplied CNPJ or write privileged columns itself.

No endpoint secret is placed in browser code. Because the current page is not behind an authentication guard, the function must treat requests as untrusted: validate the method and positive municipality ID, load CNPJ by ID, reject malformed/missing CNPJs, constrain writes to DART columns, use bounded upstream timeouts and response sizes, and apply a per-municipality cooldown using the existing check timestamp so the public UI cannot repeatedly fan out requests. Calls inside the cooldown return the stored result and timestamp rather than re-querying CIASC.

## Status mapping

- `regular`: a non-empty official `listaCredores` response has `flComprovado=true` for all returned creditor records and `hasError` is false.
- `irregular`: at least one registered creditor record has `flComprovado=false` and the response does not indicate a missing SIGEF registration.
- `pending`: CIASC explicitly reports that the CNPJ is not registered, or provides no creditor records without an upstream error. The message is kept in the details so this is not mislabeled as an irregularity.
- `error`: transient response to the current verification only, for invalid/unsupported payloads, `hasError=true`, HTTP failure, or timeout. It is not persisted to `dart_status`; the last known result remains visible after a failed refresh.

For successful official responses (`regular`, `irregular`, or `pending`), the details JSON retains the official requirements and CND information needed to explain the result. The legacy `dart_detalhes` field stores a concise human-readable summary. `dart_verificado_em` records a successful response; `dart_last_checked_at` records the latest attempt for cooldown and diagnostics. For upstream/transport errors on a valid municipality request, update only the attempt timestamp and return an error to the caller; preserve the last successful status, validity, and details in the database. Invalid request input does not update the row.

For the single `dart_validade` date, use the earliest parseable expiration among official requirement (`dataValidade`) and CND (`validade`) dates, including already-expired dates. If none exists, store `null` and display that no validity date was provided. The UI must label this as the nearest requirement validity, rather than implying that the entire DART expires on that date.

## Page behavior and visual direction

- Use a clear page title and short explanation of the official source and Convênio Simplificado scope.
- Present summary metrics and filters with responsive spacing, readable status color/icon, and a mobile-safe table.
- Expand or open a detail panel per municipality to show each requirement's official status, validity, and available CND information.
- On individual verification, show a loading state only while the function runs; then show the returned status or a precise error/timeout message.
- In batch verification, process municipalities sequentially, show current municipality and progress, continue after individual failures, and summarize successes/failures at the end.
- Use React Query invalidation after results are persisted.

## Error handling

The function returns non-2xx responses for invalid input and infrastructure/upstream failure, with a safe user-facing message and a diagnostic code. The frontend distinguishes a DART-reported irregularity from a technical failure. An old cached status remains visible after a failed refresh, with its last successful verification time; a failed attempt must not change the persisted status to `error`, `regular`, or erase its details. A technical error is shown transiently in the current UI response.

## Verification plan

- Unit-test response normalization for regular, irregular, not-registered, empty, and malformed CIASC responses.
- Test the Edge Function locally with mocked CIASC responses and verify that it reads CNPJ by municipality ID and writes only the intended DART columns.
- Verify missing municipality/CNPJ, malformed ID, cooldown, non-2xx upstream response, timeout, and malformed JSON behavior.
- Test the page at 375, 768, and 1280 pixels; exercise single and batch verification, filters, expanded details, errors, and progress.
- Run the project build and the available Supabase function checks.
- Before deployment, confirm production function secrets/configuration and deploy the function to the linked Supabase project; do not expose any secret to the browser.

## Risks and assumptions

- The public CIASC endpoint is not documented as a stable public API contract. Its response schema or availability may change; parsing must be defensive and show a technical error rather than infer regularity.
- The official service can report a CNPJ as not registered in SIGEF. That is not equivalent to a confirmed irregularity and must remain a separate UI state/message.
- The read-only probe used an example CNPJ exposed by the official portal; no municipal production record was modified during discovery.
- The official API may have usage limits. The per-municipality cooldown and sequential batch processing reduce repeated requests; actual limits are not published in the inspected portal configuration.
- This repository can implement and test the function, but production deployment requires valid access to the linked Supabase project.

## Review checklist

- [x] Confirms the existing implementation and missing n8n workflow dependency.
- [x] Confirms the official simplified-transfer consultation ID from the DART frontend.
- [x] Keeps municipality CNPJ server-side and limits persisted updates to DART fields.
- [x] Distinguishes not-registered and technical-error states from confirmed irregularity.
- [x] Avoids an unnecessary schema migration.
- [x] Includes UI, individual/batch behavior, security, errors, validation, and deployment constraints.
