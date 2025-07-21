import React, { useState, Component, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { DocumentUploadForm } from '@/components/forms/DocumentUploadForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from '@/components/ui/breadcrumb';
import { DocumentCard } from '@/components/documents/DocumentCard';
import { DocumentPreviewModal } from '@/components/documents/DocumentPreviewModal';
import { useDocuments, useDocumentCategories } from '@/hooks/useDocuments';
import { supabase } from '@/integrations/supabase/client';
import { FileText } from 'lucide-react';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

class ErrorBoundary extends Component<{ children: ReactNode, fallback: (error: Error) => ReactNode }, { error: Error | null }> {
  constructor(props: any) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  render() {
    if (this.state.error) {
      return this.props.fallback(this.state.error);
    }
    return this.props.children;
  }
}

function ErrorFallback(error: Error) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Documentação</h1>
        <p className="text-red-600">Erro inesperado: {error.message}</p>
        <p className="text-muted-foreground">Tente recarregar a página ou entre em contato com o suporte.</p>
      </div>
    </div>
  );
}

export default function Documents() {
  const { isAuthenticated } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [previewDocument, setPreviewDocument] = useState<any>(null);
  const [editDocument, setEditDocument] = useState<any>(null);

  const debouncedSearchTerm = useDebouncedValue(searchTerm, 400);
  const { data: documents, isLoading, error, refetch } = useDocuments(debouncedSearchTerm, selectedCategory);
  const { data: categories } = useDocumentCategories();

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
    <React.Suspense fallback={<div>Carregando...</div>}>
      <ErrorBoundary fallback={ErrorFallback}>
        <div className="space-y-6">
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

          {/* Barra de busca textual */}
          <div className="flex gap-4 mb-2">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Buscar documentos..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border rounded w-full"
              />
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24"><path d="M21 21l-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/></svg>
              </span>
            </div>
          </div>

          {/* Abas de categoria */}
          <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-full">
            <TabsList>
              <TabsTrigger value="all">Todos</TabsTrigger>
              {categories && categories.length > 0 && categories.map((cat: any) => (
                <TabsTrigger key={cat.id} value={cat.id.toString()}>{cat.name}</TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          {/* Listagem de documentos */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {documents && documents.length > 0 ? (
              documents.map((document) => (
                <DocumentCard
                  key={document.id}
                  document={document}
                  onPreview={setPreviewDocument}
                  onDownload={handleDownload}
                  onEdit={setEditDocument}
                />
              ))
            ) : (
              <div className="col-span-full text-center py-12 flex flex-col items-center justify-center">
                <FileText className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Nenhum documento disponível ainda
                </h3>
                <p className="text-gray-600 max-w-md">
                  Quando houver documentos cadastrados pela área técnica, eles aparecerão aqui para leitura e download público. Utilize o botão acima para inserir um novo documento (apenas área técnica).
                </p>
              </div>
            )}
          </div>

          <DocumentPreviewModal
            document={previewDocument}
            isOpen={!!previewDocument}
            onClose={() => setPreviewDocument(null)}
            onDownload={handleDownload}
          />

          {/* Modal de edição de documento */}
          <Dialog open={!!editDocument} onOpenChange={v => { if (!v) setEditDocument(null); }}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Editar Documento</DialogTitle>
              </DialogHeader>
              {editDocument && (
                <DocumentUploadForm
                  onSuccess={() => {
                    setEditDocument(null);
                    refetch();
                  }}
                  onCancel={() => setEditDocument(null)}
                  document={editDocument}
                  isEditMode={true}
                />
              )}
            </DialogContent>
          </Dialog>
        </div>
      </ErrorBoundary>
    </React.Suspense>
  );
}
