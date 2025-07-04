
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage } from '@/components/ui/breadcrumb';
import { ReportCard } from '@/components/reports/ReportCard';
import { FileText, BarChart3, TrendingUp, Users, MapPin } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function Reports() {
  const [dateRange, setDateRange] = useState<{from?: Date, to?: Date}>({});
  const [municipality, setMunicipality] = useState('');
  const [nucleus, setNucleus] = useState('');
  const [reportType, setReportType] = useState('');

  const handleDownload = (reportName: string, fileFormat: 'PDF' | 'XLSX' | 'CSV') => {
    console.log(`Gerando relatório: ${reportName} em formato ${fileFormat}`);
    // Implementar lógica de download aqui
  };

  const generateReport = (reportName: string) => {
    console.log(`Gerando relatório: ${reportName}`);
    handleDownload(reportName, 'PDF');
  };

  const reports = [
    {
      title: 'Relatório de Processos',
      description: 'Relatório completo de todos os processos com status, valores e prazos',
      type: 'process' as const,
      status: 'available' as const,
      lastGenerated: '2024-07-04T10:30:00'
    },
    {
      title: 'Análise Financeira',
      description: 'Análise detalhada dos valores investidos por região e município',
      type: 'financial' as const,
      status: 'available' as const,
      lastGenerated: '2024-07-03T15:45:00'
    },
    {
      title: 'Dashboard Executivo',
      description: 'Visão executiva com principais KPIs e indicadores',
      type: 'dashboard' as const,
      status: 'processing' as const
    },
    {
      title: 'Relatório por Município',
      description: 'Detalhamento dos investimentos por município',
      type: 'municipality' as const,
      status: 'available' as const,
      lastGenerated: '2024-07-04T08:15:00'
    }
  ];

  return (
    <div className="space-y-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Início</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Relatórios</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div>
        <h1 className="text-3xl font-bold tracking-tight">Relatórios</h1>
        <p className="text-muted-foreground">
          Gere relatórios personalizados sobre transferências e investimentos
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Última atualização: {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR')}
        </p>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Filtros de Relatório
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Período (De)</label>
              <DatePicker
                selected={dateRange.from}
                onSelect={(date) => setDateRange(prev => ({...prev, from: date}))}
                placeholderText="Data inicial"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Período (Até)</label>
              <DatePicker
                selected={dateRange.to}
                onSelect={(date) => setDateRange(prev => ({...prev, to: date}))}
                placeholderText="Data final"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Município</label>
              <Select value={municipality} onValueChange={setMunicipality}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um município" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os municípios</SelectItem>
                  <SelectItem value="florianopolis">Florianópolis</SelectItem>
                  <SelectItem value="joinville">Joinville</SelectItem>
                  <SelectItem value="blumenau">Blumenau</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Núcleo Regional</label>
              <Select value={nucleus} onValueChange={setNucleus}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um núcleo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os núcleos</SelectItem>
                  <SelectItem value="grande-florianopolis">Grande Florianópolis</SelectItem>
                  <SelectItem value="norte">Norte</SelectItem>
                  <SelectItem value="vale-do-itajai">Vale do Itajaí</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Estatísticas Rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <FileText className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">24</p>
                <p className="text-xs text-muted-foreground">Relatórios Gerados</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold">R$ 67M</p>
                <p className="text-xs text-muted-foreground">Valor Total Analisado</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Users className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-2xl font-bold">60</p>
                <p className="text-xs text-muted-foreground">Municípios Ativos</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <MapPin className="h-8 w-8 text-orange-600" />
              <div>
                <p className="text-2xl font-bold">21</p>
                <p className="text-xs text-muted-foreground">Núcleos Regionais</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Relatórios */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {reports.map((report, index) => (
          <ReportCard
            key={index}
            title={report.title}
            description={report.description}
            type={report.type}
            status={report.status}
            lastGenerated={report.lastGenerated}
            onGenerate={() => generateReport(report.title)}
            onView={report.status === 'available' ? () => console.log(`Visualizar ${report.title}`) : undefined}
          />
        ))}
      </div>

      {/* Ações Rápidas */}
      <Card>
        <CardHeader>
          <CardTitle>Ações Rápidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => generateReport('Relatório Completo')}>
              Relatório Completo (PDF)
            </Button>
            <Button variant="outline" onClick={() => generateReport('Dados Exportação')}>
              Exportar Dados (XLSX)
            </Button>
            <Button variant="outline" onClick={() => generateReport('Resumo Executivo')}>
              Resumo Executivo
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
