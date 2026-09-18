-- Migração para automatizar notificações de vencimento com melhor sistema de cores
-- Notificações serão criadas automaticamente quando processos entram nos períodos de vencimento

-- Recriar o tipo enum com novos tipos para sistema de cores
DROP TYPE IF EXISTS notification_type CASCADE;

CREATE TYPE notification_type AS ENUM (
  'critical',    -- Vermelho (vencido)
  'important',   -- Laranja (7 dias)
  'warning',     -- Amarelo (15 dias)
  'info',        -- Azul (30 dias)
  'informative'  -- Cinza (atualizações)
);

-- Recriar a tabela de notificações com o novo tipo
DROP TABLE IF EXISTS notifications CASCADE;

CREATE TABLE notifications (
  id SERIAL PRIMARY KEY,
  recipient_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  is_public BOOLEAN DEFAULT true,
  type notification_type DEFAULT 'informative',
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Recriar políticas RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to read public notifications" 
ON notifications FOR SELECT 
USING (is_public = true OR auth.uid() = recipient_user_id);

CREATE POLICY "Allow authenticated users to insert notifications" 
ON notifications FOR INSERT 
WITH CHECK (is_public = true OR auth.uid() = recipient_user_id);

CREATE POLICY "Allow users to update their own notifications" 
ON notifications FOR UPDATE 
USING (auth.uid() = recipient_user_id OR is_public = true)
WITH CHECK (auth.uid() = recipient_user_id OR is_public = true);

-- Função melhorada para criar notificações simplificadas com cores específicas
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
  -- Check for processes expiring in 30, 15, 7, or 0 days
  FOR process_record IN
    SELECT id, process_number, vigencia_date
    FROM public.processes
    WHERE vigencia_date IS NOT NULL
  LOOP
    days_until_expiration := process_record.vigencia_date - CURRENT_DATE;

    -- 30 dias antes - Azul (info)
    IF days_until_expiration = 30 THEN
      existing_notification := (
        SELECT COUNT(*) 
        FROM public.notifications 
        WHERE message LIKE '%' || process_record.process_number || '%' 
          AND type = 'info'
          AND created_at > CURRENT_DATE - INTERVAL '1 day'
      );
      
      IF existing_notification = 0 THEN
        notification_message := format(
          'Processo %s vence em 30 dias',
          process_record.process_number
        );
        notification_type := 'info'::notification_type;

        INSERT INTO public.notifications (message, type, is_public)
        VALUES (notification_message, notification_type, true);
      END IF;
    END IF;

    -- 15 dias antes - Amarelo (warning)
    IF days_until_expiration = 15 THEN
      existing_notification := (
        SELECT COUNT(*) 
        FROM public.notifications 
        WHERE message LIKE '%' || process_record.process_number || '%' 
          AND type = 'warning'
          AND created_at > CURRENT_DATE - INTERVAL '1 day'
      );
      
      IF existing_notification = 0 THEN
        notification_message := format(
          'Processo %s vence em 15 dias',
          process_record.process_number
        );
        notification_type := 'warning'::notification_type;

        INSERT INTO public.notifications (message, type, is_public)
        VALUES (notification_message, notification_type, true);
      END IF;
    END IF;

    -- 7 dias antes - Laranja (important)
    IF days_until_expiration = 7 THEN
      existing_notification := (
        SELECT COUNT(*) 
        FROM public.notifications 
        WHERE message LIKE '%' || process_record.process_number || '%' 
          AND type = 'important'
          AND created_at > CURRENT_DATE - INTERVAL '1 day'
      );
      
      IF existing_notification = 0 THEN
        notification_message := format(
          'Processo %s vence em 7 dias',
          process_record.process_number
        );
        notification_type := 'important'::notification_type;

        INSERT INTO public.notifications (message, type, is_public)
        VALUES (notification_message, notification_type, true);
      END IF;
    END IF;

    -- No dia do vencimento - Vermelho (critical)
    IF days_until_expiration = 0 THEN
      existing_notification := (
        SELECT COUNT(*) 
        FROM public.notifications 
        WHERE message LIKE '%' || process_record.process_number || '%' 
          AND type = 'critical'
          AND created_at > CURRENT_DATE - INTERVAL '1 day'
      );
      
      IF existing_notification = 0 THEN
        notification_message := format(
          'Processo %s vence hoje',
          process_record.process_number
        );
        notification_type := 'critical'::notification_type;

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
      
      IF existing_notification = 0 THEN
        notification_message := format(
          'Processo %s venceu ontem',
          process_record.process_number
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
    -- Criar notificação informativa
    INSERT INTO public.notifications (message, type, is_public)
    SELECT 
      format('Vigência do processo %s atualizada para %s', process_number, NEW.vigencia_date),
      'informative'::notification_type,
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