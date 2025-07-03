
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Upload, X } from 'lucide-react';

interface DocumentUploadFormData {
  title: string;
  description?: string;
  document_category_id?: number;
  is_public: boolean;
  validity_date?: string;
  file: FileList;
}

interface DocumentUploadFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export function DocumentUploadForm({ onSuccess, onCancel }: DocumentUploadFormProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const { toast } = useToast();
  
  const { register, handleSubmit, setValue, formState: { errors } } = useForm<DocumentUploadFormData>({
    defaultValues: {
      is_public: true,
    },
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['document-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('document_categories')
        .select('id, name')
        .order('name');
      
      if (error) throw error;
      return data;
    },
  });

  const onSubmit = async (data: DocumentUploadFormData) => {
    if (!selectedFile) {
      toast({
        title: 'Arquivo obrigatório',
        description: 'Por favor, selecione um arquivo para upload.',
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);
    
    try {
      // Upload do arquivo
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(fileName, selectedFile);

      if (uploadError) throw uploadError;

      // Inserir registro no banco
      const documentData = {
        title: data.title,
        description: data.description,
        file_name: selectedFile.name,
        file_path: fileName,
        file_size: selectedFile.size,
        file_mime_type: selectedFile.type,
        document_category_id: data.document_category_id ? Number(data.document_category_id) : 1,
        is_public: data.is_public,
        validity_date: data.validity_date || null,
        uploaded_by_user_id: null, // Será preenchido quando tiver autenticação
      };

      const { error: insertError } = await supabase
        .from('documents')
        .insert(documentData);

      if (insertError) throw insertError;
      
      toast({
        title: 'Documento enviado com sucesso',
        description: 'O documento foi adicionado à biblioteca.',
      });

      onSuccess();
    } catch (error: any) {
      toast({
        title: 'Erro ao enviar documento',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setSelectedFile(file || null);
  };

  return (
    <Card>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Título do Documento *</Label>
            <Input
              id="title"
              {...register('title', { required: 'Campo obrigatório' })}
              placeholder="Ex: Manual do Usuário v2.0"
            />
            {errors.title && (
              <p className="text-sm text-red-600">{errors.title.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="Descrição do documento..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Categoria</Label>
            <Select onValueChange={(value) => setValue('document_category_id', Number(value))}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id.toString()}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="validity_date">Data de Validade</Label>
            <Input
              id="validity_date"
              type="date"
              {...register('validity_date')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="file">Arquivo *</Label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              {selectedFile ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Upload className="h-5 w-5 text-green-600" />
                    <span className="text-sm">{selectedFile.name}</span>
                    <span className="text-xs text-gray-500">
                      ({(selectedFile.size / 1024).toFixed(1)} KB)
                    </span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedFile(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div>
                  <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-gray-600">
                    Clique para selecionar um arquivo
                  </p>
                </div>
              )}
              <Input
                type="file"
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.jpg,.jpeg,.png"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="is_public"
              {...register('is_public')}
              className="rounded"
            />
            <Label htmlFor="is_public">Documento público (visível para todos)</Label>
          </div>

          <div className="flex justify-end space-x-4 pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isUploading}>
              {isUploading ? 'Enviando...' : 'Enviar Documento'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
