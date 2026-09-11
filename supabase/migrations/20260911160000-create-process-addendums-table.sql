-- Store contract addendums independently from the process record so a process
-- can have more than one extension of its validity period.
CREATE TABLE IF NOT EXISTS public.process_addendums (
    id SERIAL PRIMARY KEY,
    process_id INTEGER NOT NULL REFERENCES public.processes(id) ON DELETE CASCADE,
    numero_aditivo TEXT NOT NULL DEFAULT '',
    data_assinatura DATE NULL,
    nova_vigencia DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_process_addendums_process_id
    ON public.process_addendums(process_id);

ALTER TABLE public.process_addendums ENABLE ROW LEVEL SECURITY;

-- The technical area is authenticated by the application and the existing
-- process/parcel management flow uses public RLS policies for writes. Keep the
-- addendum table consistent with that flow; without these policies PostgREST
-- rejects insertions with HTTP 403.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'process_addendums'
          AND policyname = 'Allow public read access to process_addendums'
    ) THEN
        CREATE POLICY "Allow public read access to process_addendums"
            ON public.process_addendums FOR SELECT USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'process_addendums'
          AND policyname = 'Allow insert on process_addendums'
    ) THEN
        CREATE POLICY "Allow insert on process_addendums"
            ON public.process_addendums FOR INSERT WITH CHECK (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'process_addendums'
          AND policyname = 'Allow update on process_addendums'
    ) THEN
        CREATE POLICY "Allow update on process_addendums"
            ON public.process_addendums FOR UPDATE USING (true) WITH CHECK (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies
        WHERE schemaname = 'public'
          AND tablename = 'process_addendums'
          AND policyname = 'Allow delete on process_addendums'
    ) THEN
        CREATE POLICY "Allow delete on process_addendums"
            ON public.process_addendums FOR DELETE USING (true);
    END IF;
END $$;

CREATE OR REPLACE FUNCTION public.update_process_addendums_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_process_addendums_updated_at ON public.process_addendums;
CREATE TRIGGER update_process_addendums_updated_at
    BEFORE UPDATE ON public.process_addendums
    FOR EACH ROW
    EXECUTE FUNCTION public.update_process_addendums_updated_at();
