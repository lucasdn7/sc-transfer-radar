-- Fix RLS policies for process_addendums table
-- This ensures the policies are properly set to allow public access

-- First, ensure RLS is enabled
ALTER TABLE public.process_addendums ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
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
