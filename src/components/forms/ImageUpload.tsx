import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Upload, X, Loader2 } from 'lucide-react';

interface ProcessImage {
  id?: number;
  tipo: 'principal' | 'medicao';
  parcela_id?: number;
  image_url: string;
  percentual_execucao?: number;
}

interface ImageUploadProps {
  processId: number;
  tipo: 'principal' | 'medicao';
  parcelaId?: number;
  existingImage?: ProcessImage;
  onUploadSuccess: (image: ProcessImage) => void;
  onDeleteSuccess: () => void;
  showPercentual?: boolean;
}

export function ImageUpload({
  processId,
  tipo,
  parcelaId,
  existingImage,
  onUploadSuccess,
  onDeleteSuccess,
  showPercentual = false,
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [percentualExecucao, setPercentualExecucao] = useState<number>(
    existingImage?.percentual_execucao || 0
  );
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    existingImage?.image_url || null
  );
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  const validateFile = (file: File): boolean => {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    if (!validTypes.includes(file.type)) {
      toast({
        title: 'Tipo de arquivo inválido',
        description: 'Apenas arquivos JPG, JPEG e PNG são permitidos.',
        variant: 'destructive',
      });
      return false;
    }

    if (file.size > maxSize) {
      toast({
        title: 'Arquivo muito grande',
        description: 'O tamanho máximo permitido é 5MB.',
        variant: 'destructive',
      });
      return false;
    }

    return true;
  };

  const handleFileSelect = (file: File) => {
    if (validateFile(file)) {
      setSelectedFile(file);
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (dropZoneRef.current) {
      dropZoneRef.current.classList.add('border-primary', 'bg-primary/5');
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (dropZoneRef.current) {
      dropZoneRef.current.classList.remove('border-primary', 'bg-primary/5');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (dropZoneRef.current) {
      dropZoneRef.current.classList.remove('border-primary', 'bg-primary/5');
    }

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const uploadImage = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const fileExt = selectedFile.name.split('.').pop();
      const timestamp = Date.now();
      const random = Math.random().toString(36).substring(2, 8);
      
      // Define path based on tipo
      const folder = tipo === 'principal' ? 'principal' : 'medicoes';
      const fileName = tipo === 'principal' 
        ? `${timestamp}-${random}.${fileExt}`
        : `${timestamp}-parcela-${parcelaId}.${fileExt}`;
      
      const filePath = `obras/${processId}/${folder}/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('obras')
        .upload(filePath, selectedFile, {
          upsert: true,
          onUploadProgress: (progress) => {
            const percent = (progress.loaded / progress.total) * 100;
            setUploadProgress(percent);
          },
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('obras')
        .getPublicUrl(filePath);

      // Insert into process_images table
      const imageData: any = {
        process_id: processId,
        tipo,
        image_path: filePath,
        image_url: publicUrl,
      };

      if (tipo === 'medicao' && parcelaId) {
        imageData.parcela_id = parcelaId;
        imageData.percentual_execucao = percentualExecucao || null;
      }

      const { data: insertedImage, error: insertError } = await supabase
        .from('process_images')
        .insert(imageData)
        .select()
        .single();

      if (insertError) throw insertError;

      // If it's a principal image, update processes table
      if (tipo === 'principal') {
        await supabase
          .from('processes')
          .update({ imagem_principal_url: publicUrl })
          .eq('id', processId);
      }

      toast({
        title: 'Imagem enviada com sucesso',
        description: 'A imagem foi salva e associada ao processo.',
      });

      onUploadSuccess(insertedImage);
      setSelectedFile(null);
    } catch (error: any) {
      console.error('Erro ao fazer upload:', error);
      toast({
        title: 'Erro ao enviar imagem',
        description: error.message || 'Ocorreu um erro ao enviar a imagem.',
        variant: 'destructive',
      });
      // Revert preview on error
      if (existingImage?.image_url) {
        setPreviewUrl(existingImage.image_url);
      } else {
        setPreviewUrl(null);
      }
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const deleteImage = async () => {
    if (!existingImage?.id) return;

    try {
      // Delete from storage
      if (existingImage.image_url) {
        const filePath = existingImage.image_url.split('/obras/')[1];
        if (filePath) {
          await supabase.storage
            .from('obras')
            .remove([`obras/${filePath}`]);
        }
      }

      // Delete from database
      await supabase
        .from('process_images')
        .delete()
        .eq('id', existingImage.id);

      // If it's a principal image, clear from processes table
      if (tipo === 'principal') {
        await supabase
          .from('processes')
          .update({ imagem_principal_url: null })
          .eq('id', processId);
      }

      toast({
        title: 'Imagem removida',
        description: 'A imagem foi removida com sucesso.',
      });

      onDeleteSuccess();
      setPreviewUrl(null);
      setSelectedFile(null);
    } catch (error: any) {
      console.error('Erro ao deletar imagem:', error);
      toast({
        title: 'Erro ao remover imagem',
        description: error.message || 'Ocorreu um erro ao remover a imagem.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-2">
      <Label>
        {tipo === 'principal' ? 'Foto Principal da Obra' : `Foto da Parcela ${parcelaId}`}
      </Label>
      
      {previewUrl ? (
        <div className="relative group">
          <div className="relative inline-block">
            <img
              src={previewUrl}
              alt={tipo === 'principal' ? 'Foto principal' : `Foto parcela ${parcelaId}`}
              className="h-48 w-full object-cover rounded-lg border"
            />
            <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={deleteImage}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {showPercentual && (
            <div className="mt-2">
              <Label htmlFor={`percentual-${parcelaId}`}>
                % Execução (opcional)
              </Label>
              <Input
                id={`percentual-${parcelaId}`}
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={percentualExecucao || ''}
                onChange={(e) => setPercentualExecucao(Number(e.target.value) || 0)}
                placeholder="0.00"
                className="mt-1"
              />
            </div>
          )}
        </div>
      ) : (
        <div
          ref={dropZoneRef}
          className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary transition-colors"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {isUploading ? (
            <div className="space-y-2">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
              <p className="text-sm text-gray-600">Enviando... {Math.round(uploadProgress)}%</p>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          ) : selectedFile ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{selectedFile.name}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedFile(null);
                    setPreviewUrl(null);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              {showPercentual && (
                <div>
                  <Label htmlFor={`percentual-${parcelaId}`}>
                    % Execução (opcional)
                  </Label>
                  <Input
                    id={`percentual-${parcelaId}`}
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={percentualExecucao || ''}
                    onChange={(e) => setPercentualExecucao(Number(e.target.value) || 0)}
                    placeholder="0.00"
                    className="mt-1"
                  />
                </div>
              )}
              
              <Button
                type="button"
                onClick={uploadImage}
                disabled={isUploading}
                className="w-full"
              >
                {isUploading ? 'Enviando...' : 'Enviar Imagem'}
              </Button>
            </div>
          ) : (
            <div>
              <Button
                type="button"
                variant="outline"
                className="w-full flex flex-col items-center justify-center py-4"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-6 w-6 mb-2 text-gray-400" />
                <span className="text-sm text-gray-600">
                  {tipo === 'principal' ? 'Adicionar foto principal' : 'Adicionar foto da medição'}
                </span>
                <span className="text-xs text-gray-400 mt-1">
                  JPG, JPEG ou PNG (máx. 5MB)
                </span>
              </Button>
              <Input
                ref={fileInputRef}
                type="file"
                onChange={handleFileChange}
                className="hidden"
                accept="image/jpeg,image/jpg,image/png"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
