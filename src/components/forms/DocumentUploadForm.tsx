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
import { useRef } from 'react';

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
  const [keepFileName, setKeepFileName] = useState(true);
  const [customTitle, setCustomTitle] = useState('');
  const [categoryMode, setCategoryMode] = useState<'select' | 'custom'>('select');
  const [customCategory, setCustomCategory] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const { toast } = useToast();
  const customCategoryInputRef = useRef<HTMLInputElement>(null);
  
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
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(fileName, selectedFile);
      if (uploadError) throw uploadError;
      // Nome do documento
      const finalTitle = keepFileName ? selectedFile.name : customTitle || selectedFile.name;
      // Categoria
      let categoryId = selectedCategoryId ? Number(selectedCategoryId) : null;
      let categoryName = '';
      if (categoryMode === 'custom' && customCategory.trim()) {
        categoryName = customCategory.trim();
      }
      // Inserir registro no banco
      const documentData: any = {
        title: finalTitle,
        description: data.description,
        file_name: selectedFile.name,
        file_path: fileName,
        file_size: selectedFile.size,
        file_mime_type: selectedFile.type,
        is_public: data.is_public,
        validity_date: data.validity_date || null,
        uploaded_by_user_id: null,
      };
      if (categoryName) {
        documentData.category_name = categoryName;
      } else if (categoryId) {
        documentData.document_category_id = categoryId;
      }
      const { error: insertError } = await supabase
        .from('documents')
        .insert(documentData);
      if (insertError) throw insertError;
      // Notificação global
      await supabase.from('notifications').insert({
        message: `Novo documento disponível: "${finalTitle}" para download na área pública de Documentação!`,
        type: 'informative',
        is_public: true,
        created_at: new Date().toISOString(),
        is_read: false
      });
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
    if (file && keepFileName) setCustomTitle('');
  };

  return (
    <Card>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="flex justify-end space-x-4 pb-4 border-b mb-4 bg-white sticky top-0 left-0 z-20">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isUploading}>
              {isUploading ? 'Enviando...' : 'Enviar Documento'}
            </Button>
          </div>
          <div className="max-h-[60vh] overflow-y-auto pr-2 pb-4">
            {/* Nome do documento */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="keepFileName"
                  checked={keepFileName}
                  onChange={e => setKeepFileName(e.target.checked)}
                  className="rounded"
                />
                <Label htmlFor="keepFileName">Manter o nome do arquivo</Label>
              </div>
              {!keepFileName && (
                <div className="space-y-2">
                  <Label htmlFor="customTitle">Nome personalizado *</Label>
                  <Input
                    id="customTitle"
                    value={customTitle}
                    onChange={e => setCustomTitle(e.target.value)}
                    placeholder="Digite o nome que será exibido ao público"
                    required={!keepFileName}
                  />
                </div>
              )}
            </div>
            {/* Descrição */}
            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                {...register('description')}
                placeholder="Descrição do documento..."
                rows={3}
              />
            </div>
            {/* Categoria */}
            <div className="space-y-2">
              <Label>Categoria</Label>
              <div className="flex gap-2 items-center">
                <Select
                  value={categoryMode === 'select' ? selectedCategoryId : ''}
                  onValueChange={val => {
                    setCategoryMode('select');
                    setSelectedCategoryId(val);
                    setValue('document_category_id', Number(val));
                  }}
                  disabled={categoryMode === 'custom'}
                >
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
                <Button
                  type="button"
                  variant={categoryMode === 'custom' ? 'default' : 'outline'}
                  onClick={() => {
                    setCategoryMode('custom');
                    setTimeout(() => customCategoryInputRef.current?.focus(), 100);
                  }}
                >
                  Nova Categoria
                </Button>
              </div>
              {categoryMode === 'custom' && (
                <div className="flex gap-2 mt-2">
                  <Input
                    ref={customCategoryInputRef}
                    value={customCategory}
                    onChange={e => setCustomCategory(e.target.value)}
                    placeholder="Digite a nova categoria"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCategoryMode('select')}
                  >
                    Cancelar
                  </Button>
                </div>
              )}
            </div>
            {/* Data de validade */}
            <div className="space-y-2">
              <Label htmlFor="validity_date">Data de Validade</Label>
              <Input
                id="validity_date"
                type="date"
                {...register('validity_date')}
              />
            </div>
            {/* Upload do arquivo */}
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
            {/* Público */}
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="is_public"
                {...register('is_public')}
                className="rounded"
              />
              <Label htmlFor="is_public">Documento público (visível para todos)</Label>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
