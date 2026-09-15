-- Corrigir políticas RLS da tabela processes para permitir atualização de vigencia_date
-- Execute este SQL no SQL Editor do Supabase se a atualização de vigência não funcionar

-- Verificar se RLS está habilitado
-- SELECT schemaname, tablename, rowsecurity FROM pg_tables WHERE tablename = 'processes';

-- Se RLS estiver habilitado, adicionar política para UPDATE
DROP POLICY IF EXISTS "Allow update on processes" ON public.processes;

CREATE POLICY "Allow update on processes"
    ON public.processes FOR UPDATE USING (true) WITH CHECK (true);

-- Verificar políticas criadas
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'processes';
