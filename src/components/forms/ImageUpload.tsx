import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Upload, X } from 'lucide-react';

export interface ProcessImage {
  id?: number;
  image_path?: string;
  image_url: string;
  parcela_id?: number | null;
  percentual_execucao?: number | null;
  tipo: 'principal' | 'medicao';
}

interface ImageUploadProps {
  processId: number;
  tipo: ProcessImage['tipo'];
  parcelaId?: number;
  parcelaNumber?: number;
  existingImage?: ProcessImage;
  onUploadSuccess: (image: ProcessImage) => void;
  onDeleteSuccess: () => void;
  showPercentual?: boolean;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ACCEPTED_TYPES = ['image/jpeg', 'image/png'];
const getErrorMessage = (error: unknown) => {
  if (error instanceof Error) return error.message;
  if (typeof error === 'object' && error !== null && 'message' in error && typeof error.message === 'string') return error.message;
  return undefined;
};

export function ImageUpload({
  processId,
  tipo,
  parcelaId,
  parcelaNumber,
  existingImage,
  onUploadSuccess,
  onDeleteSuccess,
  showPercentual = false,
}: ImageUploadProps) {
  const [file, setFile] = useState<File>();
  const [previewUrl, setPreviewUrl] = useState<string>();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [percentualExecucao, setPercentualExecucao] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    setFile(undefined);
    setPreviewUrl(existingImage?.image_url);
    setPercentualExecucao(existingImage?.percentual_execucao?.toString() ?? '');
  }, [existingImage?.id, existingImage?.image_url, existingImage?.percentual_execucao]);

  useEffect(() => () => {
    if (previewUrl?.startsWith('blob:')) URL.revokeObjectURL(previewUrl);
  }, [previewUrl]);

  const validateFile = (selectedFile: File) => {
    if (!ACCEPTED_TYPES.includes(selectedFile.type)) {
      toast({ title: 'Tipo de arquivo inválido', description: 'Envie uma imagem JPG, JPEG ou PNG.', variant: 'destructive' });
      return false;
    }
    if (selectedFile.size > MAX_FILE_SIZE) {
      toast({ title: 'Arquivo muito grande', description: 'O tamanho máximo permitido é 5 MB.', variant: 'destructive' });
      return false;
    }
    return true;
  };

  const selectFile = (selectedFile?: File) => {
    if (!selectedFile || !validateFile(selectedFile)) return;
    if (previewUrl?.startsWith('blob:')) URL.revokeObjectURL(previewUrl);
    setFile(selectedFile);
    setPreviewUrl(URL.createObjectURL(selectedFile));
  };

  const clearSelection = () => {
    if (previewUrl?.startsWith('blob:')) URL.revokeObjectURL(previewUrl);
    setFile(undefined);
    setPreviewUrl(existingImage?.image_url);
    if (inputRef.current) inputRef.current.value = '';
  };

  const getStoragePath = () => {
    if (existingImage?.image_path) return existingImage.image_path;
    const marker = '/storage/v1/object/public/obras/';
    const path = existingImage?.image_url.split(marker)[1];
    return path ? decodeURIComponent(path.split('?')[0]) : undefined;
  };

  const uploadImage = async () => {
    if (!file || (tipo === 'medicao' && !parcelaId)) return;
    const percentual = percentualExecucao === '' ? null : Number(percentualExecucao);
    if (percentual !== null && (!Number.isFinite(percentual) || percentual < 0 || percentual > 100)) {
      toast({ title: 'Percentual inválido', description: 'Informe um percentual entre 0 e 100.', variant: 'destructive' });
      return;
    }

    setIsUploading(true);
    setUploadProgress(10);
    let uploadedPath: string | undefined;
    try {
      const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const timestamp = Date.now();
      const suffix = Math.random().toString(36).slice(2, 8);
      uploadedPath = tipo === 'principal'
        ? `${processId}/principal/${timestamp}-${suffix}.${extension}`
        : `${processId}/medicoes/${timestamp}-parcela-${parcelaNumber ?? parcelaId}-${suffix}.${extension}`;

      const { error: storageError } = await supabase.storage.from('obras').upload(uploadedPath, file, { upsert: false });
      if (storageError) throw storageError;
      setUploadProgress(70);

      const { data: publicUrlData } = supabase.storage.from('obras').getPublicUrl(uploadedPath);
      const imagePayload = {
        process_id: processId,
        tipo,
        image_path: uploadedPath,
        image_url: publicUrlData.publicUrl,
        parcela_id: tipo === 'medicao' ? parcelaId : null,
        percentual_execucao: tipo === 'medicao' ? percentual : null,
      };
      const query = existingImage?.id
        ? supabase.from('process_images').update(imagePayload).eq('id', existingImage.id).select().single()
        : supabase.from('process_images').insert(imagePayload).select().single();
      const { data, error } = await query;
      if (error) throw error;

      if (tipo === 'principal') {
        const { error: processError } = await supabase.from('processes').update({ imagem_principal_url: publicUrlData.publicUrl }).eq('id', processId);
        if (processError) throw processError;
      }
      const previousPath = getStoragePath();
      if (previousPath && previousPath !== uploadedPath) await supabase.storage.from('obras').remove([previousPath]);
      setUploadProgress(100);
      onUploadSuccess(data as ProcessImage);
      toast({ title: 'Imagem enviada com sucesso', description: 'A imagem foi associada ao processo.' });
    } catch (error: unknown) {
      if (uploadedPath) await supabase.storage.from('obras').remove([uploadedPath]);
      toast({ title: 'Erro ao enviar imagem', description: getErrorMessage(error) || 'Verifique se o bucket obras e suas permissões de upload foram configurados.', variant: 'destructive' });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const deleteImage = async () => {
    if (!existingImage?.id) return;
    setIsUploading(true);
    try {
      const { error } = await supabase.from('process_images').delete().eq('id', existingImage.id);
      if (error) throw error;
      const path = getStoragePath();
      if (path) await supabase.storage.from('obras').remove([path]);
      if (tipo === 'principal') {
        const { error: processError } = await supabase.from('processes').update({ imagem_principal_url: null }).eq('id', processId);
        if (processError) throw processError;
      }
      onDeleteSuccess();
      toast({ title: 'Imagem removida', description: 'A imagem foi removida com sucesso.' });
    } catch (error: unknown) {
      toast({ title: 'Erro ao remover imagem', description: getErrorMessage(error) || 'Não foi possível remover a imagem.', variant: 'destructive' });
    } finally {
      setIsUploading(false);
    }
  };

  const hasSavedImage = Boolean(existingImage?.id && !file);
  return <div className="space-y-2">
    <Label>{tipo === 'principal' ? 'Foto Principal da Obra' : `Foto da Medição — Parcela ${parcelaNumber}`}</Label>
    {showPercentual && <div className="max-w-xs"><Label htmlFor={`percentual-${parcelaId}`}>% Execução (opcional)</Label><Input id={`percentual-${parcelaId}`} type="number" min="0" max="100" step="0.01" value={percentualExecucao} onChange={(event) => setPercentualExecucao(event.target.value)} placeholder="0,00" /></div>}
    {previewUrl && <div className="relative w-full max-w-md"><img src={previewUrl} alt={tipo === 'principal' ? 'Foto principal da obra' : `Foto da medição da parcela ${parcelaNumber}`} className="h-[200px] w-full rounded-lg border object-cover" />{hasSavedImage && <Button type="button" variant="destructive" size="icon" className="absolute right-2 top-2" disabled={isUploading} onClick={deleteImage} aria-label="Excluir imagem"><X className="h-4 w-4" /></Button>}</div>}
    {isUploading ? <div className="max-w-md space-y-2"><div className="flex items-center gap-2 text-sm"><Loader2 className="h-4 w-4 animate-spin" /> Enviando imagem… {Math.round(uploadProgress)}%</div><Progress value={uploadProgress} /></div> : file ? <div className="flex max-w-md gap-2"><Button type="button" onClick={uploadImage} className="flex-1">Enviar imagem</Button><Button type="button" variant="outline" onClick={clearSelection}>Cancelar</Button></div> : <div onDragOver={(event) => event.preventDefault()} onDrop={(event) => { event.preventDefault(); selectFile(event.dataTransfer.files[0]); }} className="max-w-md rounded-lg border-2 border-dashed p-4 text-center"><Button type="button" variant="outline" onClick={() => inputRef.current?.click()}><Upload className="mr-2 h-4 w-4" />{hasSavedImage ? 'Trocar foto' : tipo === 'principal' ? 'Adicionar foto principal' : 'Adicionar foto da medição'}</Button><p className="mt-2 text-xs text-muted-foreground">Arraste uma imagem aqui ou selecione um arquivo JPG, JPEG ou PNG (máx. 5 MB).</p><Input ref={inputRef} type="file" className="hidden" accept="image/jpeg,image/png,.jpg,.jpeg,.png" onChange={(event) => selectFile(event.target.files?.[0])} /></div>}
  </div>;
}
