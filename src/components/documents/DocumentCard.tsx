
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Calendar, Download, Eye } from 'lucide-react';

interface DocumentCardProps {
  document: any;
  onPreview: (document: any) => void;
  onDownload: (document: any) => void;
}

export function DocumentCard({ document, onPreview, onDownload }: DocumentCardProps) {
  const isRecentDocument = (createdAt: string) => {
    const created = new Date(createdAt);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - created.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 7;
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
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
            onClick={() => onPreview(document)}
            className="flex-1"
            variant="outline"
          >
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
          <Button 
            onClick={() => onDownload(document)}
            className="flex-1"
            variant="outline"
          >
            <Download className="h-4 w-4 mr-2" />
            Baixar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
