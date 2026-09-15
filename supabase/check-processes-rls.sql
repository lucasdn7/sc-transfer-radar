-- Verificar políticas RLS da tabela processes
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

-- Verificar se RLS está habilitado
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE tablename = 'processes';
