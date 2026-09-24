-- Technical notifications: incremental model for scheduled in-app and email delivery.
-- This migration intentionally preserves the legacy public.notifications table.

CREATE TABLE IF NOT EXISTS public.technical_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  notification_type text NOT NULL DEFAULT 'technical',
  status text NOT NULL DEFAULT 'scheduled',
  schedule_type text NOT NULL DEFAULT 'once',
  scheduled_at timestamptz NOT NULL,
  timezone text NOT NULL DEFAULT 'Etc/GMT+3',
  recurrence_config jsonb,
  next_run_at timestamptz,
  last_run_at timestamptz,
  created_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  deleted_by uuid REFERENCES auth.users(id),
  delete_reason text,
  CONSTRAINT technical_notifications_status_check
    CHECK (status IN ('scheduled', 'active', 'paused', 'completed', 'cancelled', 'deleted', 'failed')),
  CONSTRAINT technical_notifications_schedule_type_check
    CHECK (schedule_type IN ('once', 'daily', 'weekly', 'monthly', 'yearly', 'business_days', 'custom_interval')),
  CONSTRAINT technical_notifications_timezone_check
    CHECK (timezone = 'Etc/GMT+3')
);

CREATE TABLE IF NOT EXISTS public.technical_notification_processes (
  notification_id uuid NOT NULL REFERENCES public.technical_notifications(id) ON DELETE CASCADE,
  process_id integer NOT NULL REFERENCES public.processes(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (notification_id, process_id)
);

CREATE TABLE IF NOT EXISTS public.technical_notification_email_recipients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id uuid NOT NULL REFERENCES public.technical_notifications(id) ON DELETE CASCADE,
  email text NOT NULL,
  name text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT technical_notification_email_recipient_unique UNIQUE (notification_id, email),
  CONSTRAINT technical_notification_email_recipient_format
    CHECK (email ~* '^[^[:space:]<>@]+@[^[:space:]<>@]+\.[^[:space:]<>@]+$')
);

CREATE TABLE IF NOT EXISTS public.technical_notification_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id uuid NOT NULL REFERENCES public.technical_notifications(id) ON DELETE CASCADE,
  occurrence_key text NOT NULL,
  scheduled_for timestamptz NOT NULL,
  delivered_at timestamptz,
  in_app_delivered boolean NOT NULL DEFAULT false,
  email_status text NOT NULL DEFAULT 'not_requested',
  email_sent_at timestamptz,
  email_error text,
  processing_attempts integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT technical_notification_delivery_unique UNIQUE (notification_id, occurrence_key),
  CONSTRAINT technical_notification_email_status_check
    CHECK (email_status IN ('not_requested', 'pending', 'sent', 'failed', 'partial', 'cancelled')),
  CONSTRAINT technical_notification_processing_attempts_check
    CHECK (processing_attempts >= 0)
);

CREATE TABLE IF NOT EXISTS public.technical_notification_user_states (
  notification_id uuid NOT NULL REFERENCES public.technical_notifications(id) ON DELETE CASCADE,
  occurrence_key text NOT NULL,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  read_at timestamptz,
  snoozed_until timestamptz,
  dismissed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (notification_id, occurrence_key, user_id)
);

CREATE TABLE IF NOT EXISTS public.technical_notification_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id uuid,
  actor_user_id uuid REFERENCES auth.users(id),
  action text NOT NULL,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT technical_notification_audit_action_check
    CHECK (action IN ('created', 'updated', 'scheduled', 'triggered', 'email_sent', 'email_failed', 'read', 'snoozed', 'cancelled', 'deleted'))
);

CREATE INDEX IF NOT EXISTS idx_technical_notifications_next_run
  ON public.technical_notifications (next_run_at)
  WHERE deleted_at IS NULL AND status IN ('scheduled', 'active');

CREATE INDEX IF NOT EXISTS idx_technical_notifications_created_by
  ON public.technical_notifications (created_by);

CREATE INDEX IF NOT EXISTS idx_technical_notification_processes_process_id
  ON public.technical_notification_processes (process_id);

CREATE INDEX IF NOT EXISTS idx_technical_notification_deliveries_pending
  ON public.technical_notification_deliveries (scheduled_for, email_status);

CREATE INDEX IF NOT EXISTS idx_technical_notification_user_states_user_id
  ON public.technical_notification_user_states (user_id);

CREATE INDEX IF NOT EXISTS idx_technical_notification_audit_logs_notification_id
  ON public.technical_notification_audit_logs (notification_id, created_at DESC);

-- The application stores Brasília local input as an instant with a fixed UTC-3
-- policy. Etc/GMT+3 is intentionally used instead of a DST-aware zone.
CREATE OR REPLACE FUNCTION public.is_technical_user()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.roles r ON r.id = ur.role_id
    WHERE ur.user_id = auth.uid()
      AND r.name IN ('technical', 'admin')
  );
$$;

CREATE OR REPLACE FUNCTION public.update_technical_notification_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS technical_notifications_updated_at ON public.technical_notifications;
CREATE TRIGGER technical_notifications_updated_at
  BEFORE UPDATE ON public.technical_notifications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_technical_notification_updated_at();

DROP TRIGGER IF EXISTS technical_notification_user_states_updated_at ON public.technical_notification_user_states;
CREATE TRIGGER technical_notification_user_states_updated_at
  BEFORE UPDATE ON public.technical_notification_user_states
  FOR EACH ROW
  EXECUTE FUNCTION public.update_technical_notification_updated_at();

-- Keep audit rows after a physical deletion. The notification itself and its
-- child rows are removed by the ON DELETE CASCADE relationships.
CREATE OR REPLACE FUNCTION public.audit_technical_notification_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  audit_notification_id uuid;
  audit_metadata jsonb;
BEGIN
  audit_notification_id := COALESCE(NEW.id, OLD.id);

  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.technical_notification_audit_logs (notification_id, actor_user_id, action, metadata)
    VALUES (audit_notification_id, auth.uid(), 'created', jsonb_build_object('status', NEW.status, 'schedule_type', NEW.schedule_type));
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    audit_metadata := jsonb_build_object('old_status', OLD.status, 'new_status', NEW.status);
    INSERT INTO public.technical_notification_audit_logs (notification_id, actor_user_id, action, metadata)
    VALUES (audit_notification_id, auth.uid(), 'updated', audit_metadata);

    IF NEW.status = 'scheduled' AND OLD.status IS DISTINCT FROM NEW.status THEN
      INSERT INTO public.technical_notification_audit_logs (notification_id, actor_user_id, action, metadata)
      VALUES (audit_notification_id, auth.uid(), 'scheduled', audit_metadata);
    ELSIF NEW.status = 'cancelled' AND OLD.status IS DISTINCT FROM NEW.status THEN
      INSERT INTO public.technical_notification_audit_logs (notification_id, actor_user_id, action, metadata)
      VALUES (audit_notification_id, auth.uid(), 'cancelled', audit_metadata);
    END IF;
    RETURN NEW;
  END IF;

  INSERT INTO public.technical_notification_audit_logs (notification_id, actor_user_id, action, metadata)
  VALUES (audit_notification_id, auth.uid(), 'deleted', jsonb_build_object('delete_reason', OLD.delete_reason));
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS technical_notifications_audit ON public.technical_notifications;
CREATE TRIGGER technical_notifications_audit
  AFTER INSERT OR UPDATE ON public.technical_notifications
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_technical_notification_change();

DROP TRIGGER IF EXISTS technical_notifications_delete_audit ON public.technical_notifications;
CREATE TRIGGER technical_notifications_delete_audit
  BEFORE DELETE ON public.technical_notifications
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_technical_notification_change();

CREATE OR REPLACE FUNCTION public.audit_technical_notification_user_state_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.read_at IS NOT NULL AND (TG_OP = 'INSERT' OR OLD.read_at IS DISTINCT FROM NEW.read_at) THEN
    INSERT INTO public.technical_notification_audit_logs (notification_id, actor_user_id, action, metadata)
    VALUES (NEW.notification_id, auth.uid(), 'read', jsonb_build_object('occurrence_key', NEW.occurrence_key));
  END IF;

  IF NEW.snoozed_until IS NOT NULL AND (TG_OP = 'INSERT' OR OLD.snoozed_until IS DISTINCT FROM NEW.snoozed_until) THEN
    INSERT INTO public.technical_notification_audit_logs (notification_id, actor_user_id, action, metadata)
    VALUES (NEW.notification_id, auth.uid(), 'snoozed', jsonb_build_object('occurrence_key', NEW.occurrence_key, 'snoozed_until', NEW.snoozed_until));
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS technical_notification_user_states_audit ON public.technical_notification_user_states;
CREATE TRIGGER technical_notification_user_states_audit
  AFTER INSERT OR UPDATE ON public.technical_notification_user_states
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_technical_notification_user_state_change();

ALTER TABLE public.technical_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.technical_notification_processes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.technical_notification_email_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.technical_notification_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.technical_notification_user_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.technical_notification_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY technical_notifications_technical_select
  ON public.technical_notifications FOR SELECT
  USING (public.is_technical_user() AND deleted_at IS NULL AND status <> 'deleted');

CREATE POLICY technical_notifications_technical_insert
  ON public.technical_notifications FOR INSERT
  WITH CHECK (public.is_technical_user() AND created_by = auth.uid());

CREATE POLICY technical_notifications_technical_update
  ON public.technical_notifications FOR UPDATE
  USING (public.is_technical_user())
  WITH CHECK (public.is_technical_user());

CREATE POLICY technical_notifications_technical_delete
  ON public.technical_notifications FOR DELETE
  USING (public.is_technical_user());

CREATE POLICY technical_notification_processes_technical_access
  ON public.technical_notification_processes FOR ALL
  USING (public.is_technical_user())
  WITH CHECK (public.is_technical_user());

CREATE POLICY technical_notification_recipients_technical_access
  ON public.technical_notification_email_recipients FOR ALL
  USING (public.is_technical_user())
  WITH CHECK (public.is_technical_user());

CREATE POLICY technical_notification_deliveries_technical_select
  ON public.technical_notification_deliveries FOR SELECT
  USING (public.is_technical_user());

CREATE POLICY technical_notification_user_states_own_select
  ON public.technical_notification_user_states FOR SELECT
  USING (public.is_technical_user() AND user_id = auth.uid());

CREATE POLICY technical_notification_user_states_own_insert
  ON public.technical_notification_user_states FOR INSERT
  WITH CHECK (public.is_technical_user() AND user_id = auth.uid());

CREATE POLICY technical_notification_user_states_own_update
  ON public.technical_notification_user_states FOR UPDATE
  USING (public.is_technical_user() AND user_id = auth.uid())
  WITH CHECK (public.is_technical_user() AND user_id = auth.uid());

CREATE POLICY technical_notification_user_states_own_delete
  ON public.technical_notification_user_states FOR DELETE
  USING (public.is_technical_user() AND user_id = auth.uid());

CREATE POLICY technical_notification_audit_technical_select
  ON public.technical_notification_audit_logs FOR SELECT
  USING (public.is_technical_user());

GRANT SELECT, INSERT, UPDATE, DELETE ON public.technical_notifications TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.technical_notification_processes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.technical_notification_email_recipients TO authenticated;
GRANT SELECT ON public.technical_notification_deliveries TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.technical_notification_user_states TO authenticated;
GRANT SELECT ON public.technical_notification_audit_logs TO authenticated;

COMMENT ON COLUMN public.technical_notifications.timezone IS 'Fixed Brasília UTC-3 policy represented by Etc/GMT+3; do not use a DST-aware zone.';
COMMENT ON COLUMN public.technical_notifications.recurrence_config IS 'Recurring dates use last-day-of-month adjustment when the configured day does not exist.';
COMMENT ON TABLE public.technical_notification_user_states IS 'One row per notification occurrence and technical user; absence means unread and not snoozed.';
COMMENT ON TABLE public.technical_notification_audit_logs IS 'Audit is intentionally independent from the notification row so physical deletion remains traceable.';
