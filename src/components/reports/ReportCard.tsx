import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { FileText, BarChart3, Download, Eye, MoreVertical, RefreshCw, AlertCircle } from 'lucide-react';

interface ReportCardProps {
  title: string;
  description: string;
  type: 'dashboard' | 'financial' | 'process' | 'municipality';
  status: 'available' | 'processing' | 'scheduled' | 'error';
  lastGenerated?: string;
  onGenerate: () => void;
  onRetry?: () => void;
  onView?: () => void;
  onDownloadPDF?: () => void;
  onDownloadExcel?: () => void;
  onDownloadCSV?: () => void;
}

export function ReportCard({ 
  title, 
  description, 
  type, 
  status, 
  lastGenerated, 
  onGenerate,
  onRetry,
  onView, 
  onDownloadPDF, 
  onDownloadExcel, 
  onDownloadCSV
}: ReportCardProps) {
  const getTypeIcon = () => {
    switch (type) {
      case 'dashboard':
        return <BarChart3 className="h-5 w-5" />;
      case 'financial':
        return <FileText className="h-5 w-5" />;
      default:
        return <FileText className="h-5 w-5" />;
    }
  };

  const getStatusBadge = () => {
    switch (status) {
      case 'available':
        return <Badge variant="default" className="bg-green-100 text-green-800">Disponível</Badge>;
      case 'processing':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Processando</Badge>;
      case 'scheduled':
        return <Badge variant="outline">Agendado</Badge>;
      case 'error':
        return <Badge variant="destructive" className="bg-red-100 text-red-800">Erro</Badge>;
      default:
        return null;
    }
  };

  const formatLastGenerated = (date?: string) => {
    if (!date) return null;
    try {
      const d = new Date(date);
      if (isNaN(d.getTime())) return 'Data indisponível';
      return d.toLocaleString('pt-BR');
    } catch {
      return 'Data indisponível';
    }
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <CardTitle className="text-lg flex items-center gap-2">
              {getTypeIcon()}
              {title}
            </CardTitle>
            {getStatusBadge()}
          </div>
          {status === 'error' && (
            <Button onClick={onRetry} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Tentar novamente
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-gray-600">{description}</p>
        
        {lastGenerated && (
          <div className="text-xs text-gray-500">
            Última geração: {formatLastGenerated(lastGenerated)}
          </div>
        )}

        {status === 'error' && (
          <div className="flex items-start gap-2 text-xs text-red-600 bg-red-50 p-2 rounded">
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>Falha ao gerar relatório. Tente novamente.</span>
          </div>
        )}

        <div className="flex gap-2 flex-wrap">
          {onView && status === 'available' && (
            <Button 
              onClick={onView}
              className="flex-1"
              variant="default"
            >
              <Eye className="h-4 w-4 mr-2" />
              Visualizar
            </Button>
          )}
          
          {status === 'available' && (onDownloadPDF || onDownloadExcel || onDownloadCSV) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex-1">
                  <Download className="h-4 w-4 mr-2" />
                  Exportar
                  <MoreVertical className="h-4 w-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onDownloadPDF && (
                  <DropdownMenuItem onClick={onDownloadPDF}>
                    <Download className="h-4 w-4 mr-2" />
                    PDF
                  </DropdownMenuItem>
                )}
                {onDownloadExcel && (
                  <DropdownMenuItem onClick={onDownloadExcel}>
                    <Download className="h-4 w-4 mr-2" />
                    Excel
                  </DropdownMenuItem>
                )}
                {onDownloadCSV && (
                  <DropdownMenuItem onClick={onDownloadCSV}>
                    <Download className="h-4 w-4 mr-2" />
                    CSV
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {status === 'processing' && (
            <Button disabled className="flex-1">
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Processando...
            </Button>
          )}

          {status === 'error' && !onRetry && (
            <Button onClick={onGenerate} variant="outline" className="flex-1">
              <RefreshCw className="h-4 w-4 mr-2" />
              Tentar novamente
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
