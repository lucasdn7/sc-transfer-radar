-- Execute este SQL no SQL Editor do Supabase para corrigir as políticas RLS da tabela process_addendums
-- Isso deve resolver o erro "new row violates row-level security policy for table 'process_addendums'"

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow public read access to process_addendums" ON public.process_addendums;
DROP POLICY IF EXISTS "Allow insert on process_addendums" ON public.process_addendums;
DROP POLICY IF EXISTS "Allow update on process_addendums" ON public.process_addendums;
DROP POLICY IF EXISTS "Allow delete on process_addendums" ON public.process_addendums;

-- Create new policies with proper permissions
CREATE POLICY "Allow public read access to process_addendums"
    ON public.process_addendums FOR SELECT USING (true);

CREATE POLICY "Allow insert on process_addendums"
    ON public.process_addendums FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow update on process_addendums"
    ON public.process_addendums FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Allow delete on process_addendums"
    ON public.process_addendums FOR DELETE USING (true);

-- Verify policies were created
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
WHERE tablename = 'process_addendums';
