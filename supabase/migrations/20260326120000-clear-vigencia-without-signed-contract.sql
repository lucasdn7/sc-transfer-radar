UPDATE public.processes
SET vigencia_date = NULL
WHERE contrato_assinado = false
  AND vigencia_date IS NOT NULL;
