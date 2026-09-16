-- Execute este SQL no SQL Editor do Supabase para aplicar os triggers de updated_at
-- Isso garantirá que o campo updated_at da tabela processes seja atualizado automaticamente
-- quando o processo ou suas relações (parcelas, termos aditivos) forem modificados

-- Função para atualizar updated_at de um processo específico
CREATE OR REPLACE FUNCTION public.update_process_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    -- Atualizar o updated_at do processo relacionado
    UPDATE public.processes
    SET updated_at = now()
    WHERE id = NEW.process_id;
    
    IF TG_OP = 'DELETE' THEN
        -- Para operações de DELETE, usar OLD.process_id
        UPDATE public.processes
        SET updated_at = now()
        WHERE id = OLD.process_id;
        RETURN OLD;
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Função para atualizar updated_at do próprio processo
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para atualizar updated_at quando o próprio processo for modificado
DROP TRIGGER IF EXISTS update_processes_updated_at ON public.processes;
CREATE TRIGGER update_processes_updated_at
    BEFORE UPDATE ON public.processes
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Triggers para atualizar updated_at quando parcelas forem modificadas
DROP TRIGGER IF EXISTS update_process_on_parcel_insert ON public.process_parcels;
CREATE TRIGGER update_process_on_parcel_insert
    AFTER INSERT ON public.process_parcels
    FOR EACH ROW
    EXECUTE FUNCTION public.update_process_updated_at();

DROP TRIGGER IF EXISTS update_process_on_parcel_update ON public.process_parcels;
CREATE TRIGGER update_process_on_parcel_update
    AFTER UPDATE ON public.process_parcels
    FOR EACH ROW
    EXECUTE FUNCTION public.update_process_updated_at();

DROP TRIGGER IF EXISTS update_process_on_parcel_delete ON public.process_parcels;
CREATE TRIGGER update_process_on_parcel_delete
    AFTER DELETE ON public.process_parcels
    FOR EACH ROW
    EXECUTE FUNCTION public.update_process_updated_at();

-- Triggers para atualizar updated_at quando termos aditivos forem modificados
DROP TRIGGER IF EXISTS update_process_on_addendum_insert ON public.process_addendums;
CREATE TRIGGER update_process_on_addendum_insert
    AFTER INSERT ON public.process_addendums
    FOR EACH ROW
    EXECUTE FUNCTION public.update_process_updated_at();

DROP TRIGGER IF EXISTS update_process_on_addendum_update ON public.process_addendums;
CREATE TRIGGER update_process_on_addendum_update
    AFTER UPDATE ON public.process_addendums
    FOR EACH ROW
    EXECUTE FUNCTION public.update_process_updated_at();

DROP TRIGGER IF EXISTS update_process_on_addendum_delete ON public.process_addendums;
CREATE TRIGGER update_process_on_addendum_delete
    AFTER DELETE ON public.process_addendums
    FOR EACH ROW
    EXECUTE FUNCTION public.update_process_updated_at();

-- Atualizar updated_at para processos que têm NULL (usar created_at como base)
UPDATE public.processes 
SET updated_at = COALESCE(updated_at, created_at)
WHERE updated_at IS NULL;
