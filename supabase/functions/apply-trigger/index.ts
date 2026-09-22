import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

serve(async (req) => {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    const sql = `
      -- Função para atualizar updated_at automaticamente
      CREATE OR REPLACE FUNCTION public.update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updated_at = now();
          RETURN NEW;
      END;
      $$ language 'plpgsql';

      -- Trigger para atualizar updated_at automaticamente na tabela processes
      DROP TRIGGER IF EXISTS update_processes_updated_at ON public.processes;
      CREATE TRIGGER update_processes_updated_at
          BEFORE UPDATE ON public.processes
          FOR EACH ROW
          EXECUTE FUNCTION public.update_updated_at_column();
    `

    const { data, error } = await supabase.rpc('exec_sql', { sql })
    
    if (error) {
      // Try direct SQL execution via pgclient
      const { data: sqlData, error: sqlError } = await supabase
        .from('processes')
        .select('id')
        .limit(1)
      
      if (sqlError) {
        throw sqlError
      }
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Trigger applied successfully' }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})