import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Plus, Download, FileText, Calendar, Filter, Eye } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useTechnicalAuth } from '@/hooks/useTechnicalAuth';
import { DocumentUploadForm } from '@/components/forms/DocumentUploadForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from '@/components/ui/breadcrumb';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';

export default function Documents() {
  const { isAuthenticated } = useTechnicalAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [previewDocument, setPreviewDocument] = useState<any>(null);

  const { data: documents, isLoading, error, refetch } = useQuery({
    queryKey: ['documents', searchTerm, selectedCategory],
    queryFn: async () => {
      let query = supabase
        .from('documents')
        .select(`
          *,
          document_categories(name)
        `)
        .order('created_at', { ascending: false });

      if (searchTerm) {
        query = query.or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
      }

      if (selectedCategory) {
        query = query.eq('document_category_id', parseInt(selectedCategory));
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  const { data: categories } = useQuery({
    queryKey: ['document-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('document_categories')
        .select('*')
        .order('name');
      if (error) throw error;
      return data || [];
    },
  });

  const handleDownload = async (document: any) => {
    const { data } = await supabase.storage
      .from('documents')
      .download(document.file_path);
    
    if (data) {
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = document.file_name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const isRecentDocument = (createdAt: string) => {
    const created = new Date(createdAt);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - created.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 7;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Documentação</h1>
          <p className="text-muted-foreground">Carregando documentos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Documentação</h1>
          <p className="text-red-600">Erro ao carregar documentos: {error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Início</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Documentação</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Documentação</h1>
          <p className="text-muted-foreground">
            Central de documentos e recursos do sistema
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Última atualização: {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR')}
          </p>
        </div>
        {isAuthenticated && (
          <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Upload Documento
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Upload de Documento</DialogTitle>
              </DialogHeader>
              <DocumentUploadForm 
                onSuccess={() => {
                  setIsUploadOpen(false);
                  refetch();
                }}
                onCancel={() => setIsUploadOpen(false)}
              />
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar documentos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todas as categorias</SelectItem>
            {categories?.map(category => (
              <SelectItem key={category.id} value={category.id.toString()}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline">
          <Filter className="h-4 w-4 mr-2" />
          Filtros
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {documents && documents.length > 0 ? (
          documents.map((document) => (
            <Card key={document.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      {document.title}
                      {isRecentDocument(document.created_at) && (
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          Novo
                        </Badge>
                      )}
                    </CardTitle>
                    {document.document_categories && (
                      <Badge variant="secondary">
                        {document.document_categories.name}
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {document.description && (
                  <p className="text-sm text-gray-600">{document.description}</p>
                )}

                <div className="text-xs text-gray-500 space-y-1">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3 w-3" />
                    <span>Criado: {new Date(document.created_at).toLocaleDateString('pt-BR')}</span>
                  </div>
                  {document.validity_date && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3 w-3" />
                      <span>Válido até: {new Date(document.validity_date).toLocaleDateString('pt-BR')}</span>
                    </div>
                  )}
                  <div>Versão: {document.version}</div>
                  {document.file_size && (
                    <div>Tamanho: {(document.file_size / 1024).toFixed(1)} KB</div>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button 
                    onClick={() => setPreviewDocument(document)}
                    className="flex-1"
                    variant="outline"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Preview
                  </Button>
                  <Button 
                    onClick={() => handleDownload(document)}
                    className="flex-1"
                    variant="outline"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Baixar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm ? 'Nenhum documento encontrado' : 'Nenhum documento disponível'}
            </h3>
            <p className="text-gray-600">
              {searchTerm 
                ? 'Tente alterar os termos de busca.' 
                : 'Não há documentos disponíveis no momento.'
              }
            </p>
          </div>
        )}
      </div>

      {/* Preview Modal */}
      {previewDocument && (
        <Dialog open={!!previewDocument} onOpenChange={() => setPreviewDocument(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh]">
            <DialogHeader>
              <DialogTitle>{previewDocument.title}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="text-sm text-gray-600">
                {previewDocument.description}
              </div>
              <div className="bg-gray-100 p-8 rounded-lg text-center">
                <FileText className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600 mb-4">
                  Preview não disponível para este tipo de arquivo
                </p>
                <Button onClick={() => handleDownload(previewDocument)}>
                  <Download className="h-4 w-4 mr-2" />
                  Baixar Documento
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
