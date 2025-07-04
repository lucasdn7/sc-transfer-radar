import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { 
  BarChart3, 
  Download, 
  TrendingUp, 
  FileText, 
  Calendar as CalendarIcon,
  Filter,
  History,
  Mail,
  Settings
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { 
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from "@/components/ui/breadcrumb";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const CHART_COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function Reports() {
  const [filters, setFilters] = useState({
    startDate: null as Date | null,
    endDate: null as Date | null,
    municipality: "",
    regionalNucleus: "",
    status: "",
    minValue: "",
    maxValue: ""
  });

  const [reportHistory, setReportHistory] = useState([
    { id: 1, name: "Relatório Geral Q1 2024", date: "2024-03-31", type: "PDF", size: "2.1 MB" },
    { id: 2, name: "Análise Regional Dezembro", date: "2024-01-15", type: "XLSX", size: "1.8 MB" },
    { id: 3, name: "Status Processos Janeiro", date: "2024-02-01", type: "CSV", size: "845 KB" }
  ]);

  const { data: reportData, isLoading } = useQuery({
    queryKey: ['report-data', filters],
    queryFn: async () => {
      let query = supabase
        .from('processes')
        .select(`
          *,
          municipalities (name, region_id),
          regional_nuclei (name, acronym),
          status_processos (nome, cor),
          regioes (nome)
        `);

      if (filters.municipality) {
        query = query.ilike('municipalities.name', `%${filters.municipality}%`);
      }

      if (filters.status) {
        query = query.eq('status_processos.nome', filters.status);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      return data || [];
    }
  });

  const { data: statusData } = useQuery({
    queryKey: ['status-distribution'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('processes')
        .select(`
          status_processos (nome, cor),
          total_portaria_value
        `);
      
      if (error) throw error;
      
      const statusCount = data?.reduce((acc: any, process) => {
        const status = process.status_processos?.nome || 'Não definido';
        if (!acc[status]) {
          acc[status] = { count: 0, value: 0 };
        }
        acc[status].count += 1;
        acc[status].value += process.total_portaria_value || 0;
        return acc;
      }, {});

      return Object.entries(statusCount || {}).map(([status, data]: [string, any]) => ({
        status,
        count: data.count,
        value: data.value
      }));
    }
  });

  const { data: regionalData } = useQuery({
    queryKey: ['regional-distribution'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('processes')
        .select(`
          regional_nuclei (name, acronym),
          total_portaria_value
        `);
      
      if (error) throw error;
      
      const regionalCount = data?.reduce((acc: any, process) => {
        const nucleus = process.regional_nuclei?.name || 'Não definido';
        if (!acc[nucleus]) {
          acc[nucleus] = { count: 0, value: 0 };
        }
        acc[nucleus].count += 1;
        acc[nucleus].value += process.total_portaria_value || 0;
        return acc;
      }, {});

      return Object.entries(regionalCount || {}).map(([nucleus, data]: [string, any]) => ({
        nucleus,
        count: data.count,
        value: data.value
      }));
    }
  });

  const handleDownload = (fileFormat: 'PDF' | 'XLSX' | 'CSV') => {
    // Simular download
    const newReport = {
      id: reportHistory.length + 1,
      name: `Relatório ${fileFormat} ${format(new Date(), 'dd/MM/yyyy')}`,
      date: format(new Date(), 'yyyy-MM-dd'),
      type: fileFormat,
      size: fileFormat === 'PDF' ? '2.3 MB' : fileFormat === 'XLSX' ? '1.9 MB' : '1.1 MB'
    };
    
    setReportHistory([newReport, ...reportHistory]);
    
    // Aqui você implementaria a lógica real de download
    console.log(`Downloading report in ${fileFormat} format with filters:`, filters);
  };

  const chartConfig = {
    value: {
      label: "Valor",
    },
    count: {
      label: "Quantidade",
    },
  };

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
            <BreadcrumbPage>Relatórios</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Relatórios</h1>
          <p className="text-muted-foreground">
            Análises detalhadas e exportação de dados sobre transferências financeiras
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Última atualização: {format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Configurar Automação
          </Button>
          <Button variant="outline">
            <Mail className="h-4 w-4 mr-2" />
            Agendar Envio
          </Button>
        </div>
      </div>

      {/* Filtros Dinâmicos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros para Relatórios
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Data Inicial</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filters.startDate ? format(filters.startDate, "dd/MM/yyyy") : "Selecionar"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={filters.startDate}
                    onSelect={(date) => setFilters({...filters, startDate: date})}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Data Final</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {filters.endDate ? format(filters.endDate, "dd/MM/yyyy") : "Selecionar"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={filters.endDate}
                    onSelect={(date) => setFilters({...filters, endDate: date})}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Município</label>
              <Input
                placeholder="Nome do município"
                value={filters.municipality}
                onChange={(e) => setFilters({...filters, municipality: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={filters.status} onValueChange={(value) => setFilters({...filters, status: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todos</SelectItem>
                  <SelectItem value="Em Análise">Em Análise</SelectItem>
                  <SelectItem value="Aprovado">Aprovado</SelectItem>
                  <SelectItem value="Finalizado">Finalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Valor Mínimo</label>
              <Input
                type="number"
                placeholder="R$ 0,00"
                value={filters.minValue}
                onChange={(e) => setFilters({...filters, minValue: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Valor Máximo</label>
              <Input
                type="number"
                placeholder="R$ 999.999,99"
                value={filters.maxValue}
                onChange={(e) => setFilters({...filters, maxValue: e.target.value})}
              />
            </div>
          </div>

          <div className="flex justify-end mt-4 gap-2">
            <Button variant="outline" onClick={() => setFilters({
              startDate: null,
              endDate: null,
              municipality: "",
              regionalNucleus: "",
              status: "",
              minValue: "",
              maxValue: ""
            })}>
              Limpar Filtros
            </Button>
            <Button>Aplicar Filtros</Button>
          </div>
        </CardContent>
      </Card>

      {/* Gráficos de Análise */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Distribuição por Status</CardTitle>
          </CardHeader>
          <CardContent>
            {statusData && (
              <ChartContainer config={chartConfig} className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ status, count }) => `${status}: ${count}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent />} />
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Distribuição Regional</CardTitle>
          </CardHeader>
          <CardContent>
            {regionalData && (
              <ChartContainer config={chartConfig} className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={regionalData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="nucleus" />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="count" fill="#0088FE" />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Ações de Export */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-red-600" />
              Relatório PDF
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Relatório completo formatado para impressão com gráficos e tabelas
            </p>
            <Button 
              className="w-full" 
              onClick={() => handleDownload('PDF')}
              disabled={isLoading}
            >
              <Download className="h-4 w-4 mr-2" />
              Baixar PDF
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-green-600" />
              Planilha Excel
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Dados estruturados em planilha para análise e manipulação
            </p>
            <Button 
              className="w-full" 
              onClick={() => handleDownload('XLSX')}
              disabled={isLoading}
            >
              <Download className="h-4 w-4 mr-2" />
              Baixar XLSX
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              Dados CSV
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Dados brutos em formato CSV para integração com outros sistemas
            </p>
            <Button 
              className="w-full" 
              onClick={() => handleDownload('CSV')}
              disabled={isLoading}
            >
              <Download className="h-4 w-4 mr-2" />
              Baixar CSV
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Histórico de Relatórios */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Histórico de Relatórios
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {reportHistory.map((report) => (
              <div key={report.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <FileText className="h-8 w-8 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{report.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(report.date), "dd/MM/yyyy", { locale: ptBR })} • {report.size}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{report.type}</Badge>
                  <Button variant="ghost" size="sm">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Legenda */}
      <Card>
        <CardHeader>
          <CardTitle>Legenda de Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="text-sm">Finalizado</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <span className="text-sm">Em Andamento</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="text-sm">Em Análise</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span className="text-sm">Cancelado/Rejeitado</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
