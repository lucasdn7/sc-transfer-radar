-- Criar a tabela process_images se ela não existir
CREATE TABLE IF NOT EXISTS public.process_images (
    id SERIAL PRIMARY KEY,
    process_id INTEGER NOT NULL REFERENCES public.processes(id) ON DELETE CASCADE,
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('principal', 'medicao')),
    parcela_id INTEGER NULL REFERENCES public.process_parcels(id) ON DELETE CASCADE,
    image_path VARCHAR(500) NOT NULL,
    image_url VARCHAR(500) NOT NULL,
    percentual_execucao DECIMAL(5,2) NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_process_images_process_id ON public.process_images(process_id);
CREATE INDEX IF NOT EXISTS idx_process_images_tipo ON public.process_images(tipo);
CREATE INDEX IF NOT EXISTS idx_process_images_parcela_id ON public.process_images(parcela_id);

-- Habilitar RLS
ALTER TABLE public.process_images ENABLE ROW LEVEL SECURITY;

-- Garantir que temos as políticas necessárias
DO $$
BEGIN
    -- Política para leitura pública
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'process_images' 
        AND policyname = 'Allow public read access to process_images'
    ) THEN
        CREATE POLICY "Allow public read access to process_images"
        ON public.process_images
        FOR SELECT USING (true);
    END IF;

    -- Política para inserção por sessões técnicas
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'process_images' 
        AND policyname = 'Allow insert on process_images'
    ) THEN
        CREATE POLICY "Allow insert on process_images"
        ON public.process_images
        FOR INSERT WITH CHECK (true);
    END IF;

    -- Política para atualização por sessões técnicas
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'process_images' 
        AND policyname = 'Allow update on process_images'
    ) THEN
        CREATE POLICY "Allow update on process_images"
        ON public.process_images
        FOR UPDATE USING (true);
    END IF;

    -- Política para exclusão por sessões técnicas
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'process_images' 
        AND policyname = 'Allow delete on process_images'
    ) THEN
        CREATE POLICY "Allow delete on process_images"
        ON public.process_images
        FOR DELETE USING (true);
    END IF;
END $$;

-- Função para atualizar updated_at automaticamente (se já não existir)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para atualizar updated_at automaticamente
DROP TRIGGER IF EXISTS update_process_images_updated_at ON public.process_images;
CREATE TRIGGER update_process_images_updated_at
    BEFORE UPDATE ON public.process_images
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Garantir que a constraint de unicidade existe
ALTER TABLE public.process_images 
ADD CONSTRAINT IF NOT EXISTS unique_process_principal_image 
UNIQUE (process_id, tipo) 
WHERE tipo = 'principal';

-- Adicionar coluna imagem_principal_url na tabela processes se não existir
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'processes' 
        AND column_name = 'imagem_principal_url'
    ) THEN
        ALTER TABLE public.processes 
        ADD COLUMN imagem_principal_url VARCHAR(500) NULL;
    END IF;
END $$;
