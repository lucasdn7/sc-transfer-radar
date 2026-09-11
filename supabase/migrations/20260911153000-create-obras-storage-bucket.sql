-- O upload de imagens depende de um bucket existente e de políticas para os
-- usuários autenticados. Sem estas permissões, o endpoint Storage retorna 400/403.
INSERT INTO storage.buckets (id, name, public)
VALUES ('obras', 'obras', true)
ON CONFLICT (id) DO UPDATE SET public = true;

CREATE POLICY "Authenticated users can upload obra images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'obras');

CREATE POLICY "Authenticated users can update obra images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'obras')
WITH CHECK (bucket_id = 'obras');

CREATE POLICY "Authenticated users can delete obra images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'obras');
