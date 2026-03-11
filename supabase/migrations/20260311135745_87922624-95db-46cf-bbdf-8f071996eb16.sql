
UPDATE public.processes 
SET contrato_assinado = true 
FROM public.status_processos 
WHERE processes.status_id = status_processos.id 
AND LOWER(status_processos.nome) IN (
  'contrato assinado', 
  'em pagamento', 
  'termo de aditivo', 
  'em prestação de contas', 
  'prestação de contas',
  'em análise', 
  'finalizado',
  'executado/finalizado'
);
