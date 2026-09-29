import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { BarChart3, Download, Eye, FileText, MoreVertical, RefreshCw, AlertCircle } from 'lucide-react';
import type { ReportType } from '@/lib/reportApi';

interface ReportCardProps {
  title: string;
  description: string;
  type: ReportType;
  status: 'available' | 'processing' | 'error';
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
  onDownloadCSV,
}: ReportCardProps) {
  const icon = type === 'executive' ? <BarChart3 className="h-5 w-5" /> : <FileText className="h-5 w-5" />;

  return (
    <Card className="transition-shadow hover:shadow-lg">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-2">
            <CardTitle className="flex items-center gap-2 text-lg">
              {icon}
              {title}
            </CardTitle>
            {status === 'available' && (
              <Badge variant="default" className="bg-green-100 text-green-800">Disponível</Badge>
            )}
            {status === 'processing' && (
              <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Processando</Badge>
            )}
            {status === 'error' && <Badge variant="destructive">Erro</Badge>}
          </div>
          {status === 'error' && (
            <Button onClick={onRetry ?? onGenerate} variant="outline" size="sm">
              <RefreshCw className="mr-2 h-4 w-4" />
              Tentar novamente
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">{description}</p>

        {lastGenerated && (
          <p className="text-xs text-muted-foreground">
            Última geração: {new Date(lastGenerated).toLocaleString('pt-BR')}
          </p>
        )}

        {status === 'error' && (
          <div className="flex items-start gap-2 rounded bg-red-50 p-2 text-xs text-red-700" role="alert">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>Não foi possível gerar este relatório. Tente novamente.</span>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {status === 'processing' ? (
            <Button disabled className="flex-1">
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Gerando relatório...
            </Button>
          ) : (
            <Button onClick={onGenerate} className="flex-1">
              <FileText className="mr-2 h-4 w-4" />
              Gerar relatório
            </Button>
          )}

          {onView && status === 'available' && (
            <Button onClick={onView} variant="outline">
              <Eye className="mr-2 h-4 w-4" />
              Visualizar
            </Button>
          )}

          {status === 'available' && (onDownloadPDF || onDownloadExcel || onDownloadCSV) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" aria-label={`Exportar ${title}`}>
                  <Download className="mr-2 h-4 w-4" />
                  Exportar
                  <MoreVertical className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onDownloadPDF && <DropdownMenuItem onClick={onDownloadPDF}>PDF</DropdownMenuItem>}
                {onDownloadExcel && <DropdownMenuItem onClick={onDownloadExcel}>XLSX</DropdownMenuItem>}
                {onDownloadCSV && <DropdownMenuItem onClick={onDownloadCSV}>CSV</DropdownMenuItem>}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardContent>
    </Card>
  );
}