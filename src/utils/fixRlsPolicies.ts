import { supabase } from '@/integrations/supabase/client';

export async function fixAddendumsRlsPolicies() {
  try {
    // Execute SQL to fix RLS policies
    const { error } = await supabase.rpc('exec_sql', {
      sql: `
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
      `
    });

    if (error) {
      console.error('Erro ao executar SQL:', error);
      return false;
    }

    console.log('Políticas RLS corrigidas com sucesso');
    return true;
  } catch (error) {
    console.error('Erro ao corrigir políticas RLS:', error);
    return false;
  }
}
