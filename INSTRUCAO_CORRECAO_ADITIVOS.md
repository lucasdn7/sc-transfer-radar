# 🔧 INSTRUÇÕES PARA CORRIGIR O ERRO DE ADITIVOS

## ❌ Problema
Erro ao tentar adicionar termo aditivo: `403 Forbidden - new row violates row-level security policy for table 'process_addendums'`

## ✅ Solução

### Passo 1: Acessar o Supabase Dashboard
1. Acesse: https://supabase.com/dashboard
2. Selecione seu projeto: `yonisrknsnsrigmgrcvk`
3. Vá para: **SQL Editor** (ícone de terminal no menu lateral)

### Passo 2: Executar o SQL de Correção
Copie e execute o seguinte SQL no SQL Editor:

```sql
-- CORREÇÃO PARA TABELA process_addendums
-- Desabilitar RLS temporariamente
ALTER TABLE public.process_addendums DISABLE ROW LEVEL SECURITY;

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

-- CORREÇÃO PARA TABELA processes (permitir atualização de vigencia_date)
DROP POLICY IF EXISTS "Allow update on processes" ON public.processes;

CREATE POLICY "Allow update on processes"
    ON public.processes FOR UPDATE USING (true) WITH CHECK (true);

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
WHERE tablename IN ('process_addendums', 'processes');
```

### Passo 3: Verificar o Resultado
Após executar o SQL, você deve ver um resultado mostrando as políticas criadas:

**Para process_addendums:**
- `Allow public read access to process_addendums` (SELECT)
- `Allow insert on process_addendums` (INSERT)
- `Allow update on process_addendums` (UPDATE)
- `Allow delete on process_addendums` (DELETE)

**Para processes:**
- `Allow update on processes` (UPDATE)

### Passo 4: Testar a Funcionalidade
1. Volte para a aplicação
2. Tente adicionar um novo termo aditivo
3. Verifique se:
   - ✅ O aditivo é salvo sem erro
   - ✅ A data de vigência do processo é atualizada automaticamente
   - ✅ Mensagens de sucesso aparecem
   - ✅ No console do navegador deve aparecer: "Vigência do processo atualizada com sucesso para: [data]"

## 📋 Resumo das Funcionalidades Implementadas

Após aplicar a correção SQL, o sistema terá:

1. **Adicionar Aditivo**: Salva o aditivo e atualiza a vigência do processo na tabela `processes.vigencia_date`
2. **Editar Aditivo**: Atualiza o aditivo e a vigência do processo
3. **Deletar Aditivo**: Remove o aditivo e atualiza a vigência para o último aditivo restante
4. **Atualização Automática**: O formulário recarrega os dados do processo após mudanças nos aditivos

## 🔍 Debugging

Se a vigência não estiver sendo atualizada:

1. **Verifique o console do navegador**:
   - Deve aparecer: "Tentando atualizar vigência do processo: [ID] para: [data]"
   - Se houver erro, aparecerá: "Erro ao atualizar vigência do processo" com detalhes

2. **Verifique as políticas RLS**:
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'processes';
   ```

3. **Verifique se a coluna vigencia_date existe**:
   ```sql
   SELECT column_name, data_type 
   FROM information_schema.columns 
   WHERE table_name = 'processes' 
   AND column_name = 'vigencia_date';
   ```

## ⚠️ Se o Problema Persistir

Se após executar o SQL o erro ainda persistir:

1. **Verifique se o SQL foi executado corretamente**:
   - No SQL Editor, execute: `SELECT * FROM pg_policies WHERE tablename IN ('process_addendums', 'processes');`
   - Deve mostrar as políticas criadas

2. **Tente desabilitar RLS completamente** (temporário):
   ```sql
   ALTER TABLE public.process_addendums DISABLE ROW LEVEL SECURITY;
   ALTER TABLE public.processes DISABLE ROW LEVEL SECURITY;
   ```

3. **Verifique permissões do usuário**:
   - No Supabase Dashboard, verifique se seu usuário tem permissões de escrita

4. **Reinicie o servidor de desenvolvimento**:
   - Pare o servidor atual
   - Execute: `npm run dev`
   - Tente novamente

## 📞 Suporte

Se ainda assim o problema persistir, forneça:
- O resultado do SQL de verificação das políticas
- O erro exato do console do navegador
- Captura de tela do Supabase SQL Editor
- Os logs do console que mostram "Tentando atualizar vigência do processo"
