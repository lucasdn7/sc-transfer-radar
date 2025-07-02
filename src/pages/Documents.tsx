
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Plus, Download, FileText, Calendar, Filter } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useTechnicalAuth } from '@/hooks/useTechnicalAuth';
import { DocumentUploadForm } from '@/components/forms/DocumentUploadForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

export default function Documents() {
  const { isAuthenticated } = useTechnicalAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  const { data: documents, isLoading, error, refetch } = useQuery({
    queryKey: ['documents', searchTerm],
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

      const { data, error } = await query;
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Documentação</h1>
          <p className="text-muted-foreground">
            Central de documentos e recursos do sistema
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

                <Button 
                  onClick={() => handleDownload(document)}
                  className="w-full"
                  variant="outline"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Baixar
                </Button>
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
    </div>
  );
}
