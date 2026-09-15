import { supabase } from '@/integrations/supabase/client';

// Função para verificar e criar políticas RLS via chamada direta
// Esta função tenta criar as políticas necessárias para a tabela process_addendums
export async function fixAddendumsRlsPolicies() {
  try {
    console.log('Tentando corrigir políticas RLS para process_addendums...');
    
    // Como não podemos executar SQL arbitrário via cliente Supabase sem RPC,
    // vamos apenas logar o erro e sugerir correção manual
    console.warn('As políticas RLS precisam ser corrigidas manualmente no Supabase SQL Editor');
    console.warn('Execute o SQL do arquivo: supabase/manual-fix-addendums-rls.sql');
    
    return false;
  } catch (error) {
    console.error('Erro ao tentar corrigir políticas RLS:', error);
    return false;
  }
}

// Função para desabilitar RLS (precisa ser executada manualmente via SQL Editor)
export function getDisableRlsSql() {
  return `
-- Desabilitar RLS temporariamente para permitir operações
ALTER TABLE public.process_addendums DISABLE ROW LEVEL SECURITY;
  `;
}

// Função para reabilitar RLS (precisa ser executada manualmente via SQL Editor)
export function getEnableRlsSql() {
  return `
-- Reabilitar RLS com políticas apropriadas
ALTER TABLE public.process_addendums ENABLE ROW LEVEL SECURITY;

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
  `;
}
