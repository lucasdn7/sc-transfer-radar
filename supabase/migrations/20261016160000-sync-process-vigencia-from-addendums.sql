-- Keep the main process validity date synchronized with its latest registered addendum.
-- The trigger performs the update inside the same database transaction as the addendum write,
-- so it also works when client-side UPDATE permissions on processes differ.

CREATE OR REPLACE FUNCTION public.sync_process_vigencia_from_addendums()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  target_process_id integer;
BEGIN
  IF TG_OP = 'DELETE' THEN
    target_process_id := OLD.process_id;
  ELSE
    target_process_id := NEW.process_id;
  END IF;

  -- Use the most recently registered addendum, matching the application's existing history order.
  -- If an update/delete leaves no addendums, preserve the process's current validity date.
  UPDATE public.processes AS p
  SET vigencia_date = latest.nova_vigencia
  FROM (
    SELECT pa.nova_vigencia
    FROM public.process_addendums AS pa
    WHERE pa.process_id = target_process_id
    ORDER BY pa.created_at DESC, pa.id DESC
    LIMIT 1
  ) AS latest
  WHERE p.id = target_process_id
    AND p.vigencia_date IS DISTINCT FROM latest.nova_vigencia;

  -- If an addendum is moved to another process, refresh the previous process as well.
  IF TG_OP = 'UPDATE' AND OLD.process_id IS DISTINCT FROM NEW.process_id THEN
    UPDATE public.processes AS p
    SET vigencia_date = latest.nova_vigencia
    FROM (
      SELECT pa.nova_vigencia
      FROM public.process_addendums AS pa
      WHERE pa.process_id = OLD.process_id
      ORDER BY pa.created_at DESC, pa.id DESC
      LIMIT 1
    ) AS latest
    WHERE p.id = OLD.process_id
      AND p.vigencia_date IS DISTINCT FROM latest.nova_vigencia;
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;

  RETURN NEW;
END;
$function$;

REVOKE ALL ON FUNCTION public.sync_process_vigencia_from_addendums() FROM PUBLIC;

DROP TRIGGER IF EXISTS sync_process_vigencia_from_addendums ON public.process_addendums;

CREATE TRIGGER sync_process_vigencia_from_addendums
AFTER INSERT OR UPDATE OR DELETE
ON public.process_addendums
FOR EACH ROW
EXECUTE FUNCTION public.sync_process_vigencia_from_addendums();

-- Repair existing processes whose registered addendums were not reflected in vigencia_date.
UPDATE public.processes AS p
SET vigencia_date = latest.nova_vigencia
FROM (
  SELECT DISTINCT ON (pa.process_id)
    pa.process_id,
    pa.nova_vigencia
  FROM public.process_addendums AS pa
  ORDER BY pa.process_id, pa.created_at DESC, pa.id DESC
) AS latest
WHERE p.id = latest.process_id
  AND p.vigencia_date IS DISTINCT FROM latest.nova_vigencia;
