-- Migração para automatizar notificações de vencimento
-- Notificações serão criadas automaticamente quando processos entram nos períodos de vencimento

-- Melhorar a função de criação de notificações para evitar duplicatas
CREATE OR REPLACE FUNCTION public.create_expiration_notifications()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  process_record RECORD;
  days_until_expiration INTEGER;
  notification_message TEXT;
  notification_type notification_type;
  existing_notification INTEGER;
BEGIN
  -- Check for processes expiring in 30, 15, or 7 days
  FOR process_record IN
    SELECT id, process_number, object, vigencia_date
    FROM public.processes
    WHERE vigencia_date IS NOT NULL
  LOOP
    days_until_expiration := process_record.vigencia_date - CURRENT_DATE;

    -- Verificar se já existe notificação de vencimento para este processo e período
    IF days_until_expiration IN (30, 15, 7) THEN
      existing_notification := (
        SELECT COUNT(*) 
        FROM public.notifications 
        WHERE message LIKE '%' || process_record.process_number || '%' 
          AND message LIKE '%vence em%'
          AND created_at > CURRENT_DATE - INTERVAL '1 day'
      );
      
      -- Só criar notificação se não existir uma recente do mesmo tipo
      IF existing_notification = 0 THEN
        notification_message := format(
          'O processo %s (%s) vence em %s dias (%s)',
          process_record.process_number,
          process_record.object,
          days_until_expiration,
          process_record.vigencia_date
        );
        notification_type := 'important'::notification_type;

        INSERT INTO public.notifications (message, type, is_public)
        VALUES (notification_message, notification_type, true);
      END IF;
    END IF;

    -- Para processos vencidos, criar notificação crítica
    IF days_until_expiration < 0 AND days_until_expiration >= -1 THEN
      existing_notification := (
        SELECT COUNT(*) 
        FROM public.notifications 
        WHERE message LIKE '%' || process_record.process_number || '%' 
          AND type = 'critical'
          AND created_at > CURRENT_DATE - INTERVAL '7 days'
      );
      
      -- Só criar notificação crítica se não existir uma recente (7 dias)
      IF existing_notification = 0 THEN
        notification_message := format(
          'O processo %s (%s) venceu em %s (há %s dias)',
          process_record.process_number,
          process_record.object,
          process_record.vigencia_date,
          ABS(days_until_expiration)
        );
        notification_type := 'critical'::notification_type;

        INSERT INTO public.notifications (message, type, is_public)
        VALUES (notification_message, notification_type, true);
      END IF;
    END IF;
  END LOOP;
END;
$$;

-- Trigger para criar notificações automaticamente quando a vigência é atualizada
CREATE OR REPLACE FUNCTION public.check_vigency_on_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Se a vigência foi alterada, verificar se precisa criar notificação
  IF NEW.vigencia_date IS DISTINCT FROM OLD.vigencia_date AND NEW.vigencia_date IS NOT NULL THEN
    -- Criar notificação imediatamente se estiver nos períodos críticos
    INSERT INTO public.notifications (message, type, is_public)
    SELECT 
      format('A vigência do processo %s (%s) foi atualizada para %s', process_number, object, NEW.vigencia_date),
      'informative',
      true
    FROM public.processes
    WHERE id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger para atualizar vigência
DROP TRIGGER IF EXISTS check_vigencia_trigger ON public.processes;
CREATE TRIGGER check_vigency_trigger
    AFTER UPDATE OF vigencia_date ON public.processes
    FOR EACH ROW
    EXECUTE FUNCTION public.check_vigency_on_update();

-- Criar notificações iniciais para processos existentes
SELECT public.create_expiration_notifications();