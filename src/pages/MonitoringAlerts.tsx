import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, Clock, CheckCircle, XCircle, Calendar, ExternalLink, ArrowRight, FileText } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/utils/processUtils";
import { getAlertCategory, getAlertCategoryLabel, type AlertCategory } from "@/utils/vigenciaUtils";
import { formatDateDisplay, getTimeUntilDescription } from "@/utils/dateUtils";
import { Link } from "react-router-dom";

export default function MonitoringAlerts() {
  const [categoryFilter, setCategoryFilter] = useState<AlertCategory>('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const { data: processes, isLoading, error } = useQuery({
    queryKey: ['processes-with-vigencia'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('processes')
        .select(`
          *,
          municipalities(name),
          status_processos(nome, cor)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    },
  });

  // Buscar status do Supabase para o filtro (padronizado com Processes.tsx)
  const { data: statusList = [] } = useQuery({
    queryKey: ['status-processos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('status_processos')
        .select('nome')
        .order('nome', { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });

  // Filter processes based on category and status
  const filteredProcesses = processes?.filter((process) => {
    const isFinished = (process.status_processos && 'nome' in process.status_processos) 
      ? String(process.status_processos.nome).toLowerCase().includes('final') 
      : false;
    
    const alertCategory = getAlertCategory(process.vigencia_date, isFinished);
    
    // Filter by category
    if (categoryFilter !== 'all' && alertCategory !== categoryFilter) {
      return false;
    }
    
    // Filter by status - use status_processos.nome
    if (statusFilter !== 'all' && process.status_processos?.nome !== statusFilter) {
      return false;
    }
    
    return true;
  }) || [];

  // Group processes by alert category
  const groupedProcesses = {
    vencidos: filteredProcesses.filter(p => {
      const isFinished = (p.status_processos && 'nome' in p.status_processos) 
        ? String(p.status_processos.nome).toLowerCase().includes('final') 
        : false;
      return getAlertCategory(p.vigencia_date, isFinished) === 'vencidos';
    }),
    ate_7_dias: filteredProcesses.filter(p => {
      const isFinished = (p.status_processos && 'nome' in p.status_processos) 
        ? String(p.status_processos.nome).toLowerCase().includes('final') 
        : false;
      return getAlertCategory(p.vigencia_date, isFinished) === 'ate_7_dias';
    }),
    ate_30_dias: filteredProcesses.filter(p => {
      const isFinished = (p.status_processos && 'nome' in p.status_processos) 
        ? String(p.status_processos.nome).toLowerCase().includes('final') 
        : false;
      return getAlertCategory(p.vigencia_date, isFinished) === 'ate_30_dias';
    }),
    ate_90_dias: filteredProcesses.filter(p => {
      const isFinished = (p.status_processos && 'nome' in p.status_processos) 
        ? String(p.status_processos.nome).toLowerCase().includes('final') 
        : false;
      return getAlertCategory(p.vigencia_date, isFinished) === 'ate_90_dias';
    }),
    sem_prazo: filteredProcesses.filter(p => {
      const isFinished = (p.status_processos && 'nome' in p.status_processos) 
        ? String(p.status_processos.nome).toLowerCase().includes('final') 
        : false;
      return getAlertCategory(p.vigencia_date, isFinished) === 'sem_prazo';
    }),
    concluidas: filteredProcesses.filter(p => {
      const isFinished = (p.status_processos && 'nome' in p.status_processos) 
        ? String(p.status_processos.nome).toLowerCase().includes('final') 
        : false;
      return getAlertCategory(p.vigencia_date, isFinished) === 'concluidas';
    }),
  };

  const getStatusIcon = (category: AlertCategory) => {
    switch (category) {
      case 'vencidos':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'ate_7_dias':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case 'ate_30_dias':
        return <AlertTriangle className="h-5 w-5 text-orange-500" />;
      case 'ate_90_dias':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'sem_prazo':
        return <Clock className="h-5 w-5 text-gray-500" />;
      case 'concluidas':
        return <CheckCircle className="h-5 w-5 text-blue-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (category: AlertCategory) => {
    switch (category) {
      case 'vencidos':
        return 'bg-red-50 border-red-200';
      case 'ate_7_dias':
        return 'bg-red-50 border-red-200';
      case 'ate_30_dias':
        return 'bg-orange-50 border-orange-200';
      case 'ate_90_dias':
        return 'bg-yellow-50 border-yellow-200';
      case 'sem_prazo':
        return 'bg-gray-50 border-gray-200';
      case 'concluidas':
        return 'bg-blue-50 border-blue-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };


  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Alertas e Vencimentos</h1>
          <p className="text-muted-foreground">
            Monitoramento de prazos e vigências dos processos
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-8 bg-gray-200 rounded mb-2"></div>
                <div className="h-6 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Alertas e Vencimentos</h1>
          <p className="text-muted-foreground">
            Monitoramento de prazos e vigências dos processos
          </p>
        </div>
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6">
            <p className="text-red-600">Erro ao carregar dados dos processos</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Alertas e Vencimentos</h1>
        <p className="text-muted-foreground">
          Monitoramento de prazos e vigências dos processos
        </p>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Categoria de Alerta</label>
              <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v as AlertCategory)}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as categorias</SelectItem>
                  <SelectItem value="vencidos">Vencidos</SelectItem>
                  <SelectItem value="ate_7_dias">Vencendo em até 7 dias</SelectItem>
                  <SelectItem value="ate_30_dias">Vencendo em até 30 dias</SelectItem>
                  <SelectItem value="ate_90_dias">Vencendo em até 90 dias</SelectItem>
                  <SelectItem value="sem_prazo">Sem prazo informado</SelectItem>
                  <SelectItem value="concluidas">Concluídos</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Status do Processo</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {statusList.map((s: any) => (
                    <SelectItem key={s.nome} value={s.nome}>{s.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cards de Resumo */}
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
        <Card className={`border-2 ${groupedProcesses.vencidos.length > 0 ? 'border-red-400' : 'border-red-200'} bg-red-50`}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-600" />
              Vencidos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-700">{groupedProcesses.vencidos.length}</div>
            <p className="text-xs text-red-600 mt-1">Prazo expirado</p>
          </CardContent>
        </Card>

        <Card className={`border-2 ${groupedProcesses.ate_7_dias.length > 0 ? 'border-red-400' : 'border-red-200'} bg-red-50`}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              ≤ 7 dias
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-700">{groupedProcesses.ate_7_dias.length}</div>
            <p className="text-xs text-red-600 mt-1">Crítico</p>
          </CardContent>
        </Card>

        <Card className={`border-2 ${groupedProcesses.ate_30_dias.length > 0 ? 'border-orange-400' : 'border-orange-200'} bg-orange-50`}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              ≤ 30 dias
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-700">{groupedProcesses.ate_30_dias.length}</div>
            <p className="text-xs text-orange-600 mt-1">Atenção</p>
          </CardContent>
        </Card>

        <Card className={`border-2 ${groupedProcesses.ate_90_dias.length > 0 ? 'border-yellow-400' : 'border-yellow-200'} bg-yellow-50`}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              ≤ 90 dias
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-700">{groupedProcesses.ate_90_dias.length}</div>
            <p className="text-xs text-yellow-600 mt-1">Monitorar</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-gray-200 bg-gray-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-600" />
              Sem prazo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-700">{groupedProcesses.sem_prazo.length}</div>
            <p className="text-xs text-gray-600 mt-1">Não informado</p>
          </CardContent>
        </Card>

        <Card className="border-2 border-blue-200 bg-blue-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-blue-600" />
              Concluídos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-700">{groupedProcesses.concluidas.length}</div>
            <p className="text-xs text-blue-600 mt-1">Finalizados</p>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Processos por Categoria */}
      {(categoryFilter === 'all' || categoryFilter === 'vencidos') && groupedProcesses.vencidos.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700">
              <XCircle className="h-5 w-5" />
              Vencidos ({groupedProcesses.vencidos.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {groupedProcesses.vencidos.map((process) => {
                return (
                  <div key={process.id} className="p-4 bg-white rounded-lg border border-red-200">
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold">{process.process_number}</h3>
                          <Badge variant="secondary" className="text-xs">
                            {(process.municipalities && 'name' in process.municipalities) ? process.municipalities.name : 'N/A'}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-2 line-clamp-2">{process.object}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {getTimeUntilDescription(process.vigencia_date)}
                          </span>
                          <span>Valor: {formatCurrency(process.total_portaria_value)}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" asChild>
                          <Link to={`/processes`}>
                            Ver Detalhes
                          </Link>
                        </Button>
                        {process.link_plataforma_governo && (
                          <Button size="sm" variant="outline" onClick={() => window.open(process.link_plataforma_governo, '_blank')}>
                            <ExternalLink className="h-3 w-3 mr-1" />
                            Plataforma
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {(categoryFilter === 'all' || categoryFilter === 'ate_7_dias') && groupedProcesses.ate_7_dias.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-700">
              <AlertTriangle className="h-5 w-5" />
              Vencendo em até 7 dias ({groupedProcesses.ate_7_dias.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {groupedProcesses.ate_7_dias.map((process) => (
                <div key={process.id} className="p-4 bg-white rounded-lg border border-red-200">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold">{process.process_number}</h3>
                        <Badge variant="secondary" className="text-xs">
                          {(process.municipalities && 'name' in process.municipalities) ? process.municipalities.name : 'N/A'}
                        </Badge>
                        <Badge variant="outline" className="text-xs text-red-700 border-red-300">
                          {getTimeUntilDescription(process.vigencia_date)}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-2 line-clamp-2">{process.object}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDateDisplay(process.vigencia_date)}
                        </span>
                        <span>Valor: {formatCurrency(process.total_portaria_value)}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" asChild>
                        <Link to={`/processes`}>
                          Ver Detalhes
                        </Link>
                      </Button>
                      {process.link_plataforma_governo && (
                        <Button size="sm" variant="outline" onClick={() => window.open(process.link_plataforma_governo, '_blank')}>
                          <ExternalLink className="h-3 w-3 mr-1" />
                          Plataforma
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {(categoryFilter === 'all' || categoryFilter === 'ate_30_dias') && groupedProcesses.ate_30_dias.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-700">
              <AlertTriangle className="h-5 w-5" />
              Vencendo em até 30 dias ({groupedProcesses.ate_30_dias.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {groupedProcesses.ate_30_dias.map((process) => (
                <div key={process.id} className="p-4 bg-white rounded-lg border border-orange-200">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold">{process.process_number}</h3>
                        <Badge variant="secondary" className="text-xs">
                          {(process.municipalities && 'name' in process.municipalities) ? process.municipalities.name : 'N/A'}
                        </Badge>
                        <Badge variant="outline" className="text-xs text-orange-700 border-orange-300">
                          {getTimeUntilDescription(process.vigencia_date)}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-2 line-clamp-2">{process.object}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDateDisplay(process.vigencia_date)}
                        </span>
                        <span>Valor: {formatCurrency(process.total_portaria_value)}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" asChild>
                        <Link to={`/processes`}>
                          Ver Detalhes
                        </Link>
                      </Button>
                      {process.link_plataforma_governo && (
                        <Button size="sm" variant="outline" onClick={() => window.open(process.link_plataforma_governo, '_blank')}>
                          <ExternalLink className="h-3 w-3 mr-1" />
                          Plataforma
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {(categoryFilter === 'all' || categoryFilter === 'ate_90_dias') && groupedProcesses.ate_90_dias.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-700">
              <AlertTriangle className="h-5 w-5" />
              Vencendo em até 90 dias ({groupedProcesses.ate_90_dias.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {groupedProcesses.ate_90_dias.map((process) => (
                <div key={process.id} className="p-4 bg-white rounded-lg border border-yellow-200">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold">{process.process_number}</h3>
                        <Badge variant="secondary" className="text-xs">
                          {(process.municipalities && 'name' in process.municipalities) ? process.municipalities.name : 'N/A'}
                        </Badge>
                        <Badge variant="outline" className="text-xs text-yellow-700 border-yellow-300">
                          {getTimeUntilDescription(process.vigencia_date)}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-2 line-clamp-2">{process.object}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDateDisplay(process.vigencia_date)}
                        </span>
                        <span>Valor: {formatCurrency(process.total_portaria_value)}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" asChild>
                        <Link to={`/processes`}>
                          Ver Detalhes
                        </Link>
                      </Button>
                      {process.link_plataforma_governo && (
                        <Button size="sm" variant="outline" onClick={() => window.open(process.link_plataforma_governo, '_blank')}>
                          <ExternalLink className="h-3 w-3 mr-1" />
                          Plataforma
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {(categoryFilter === 'all' || categoryFilter === 'sem_prazo') && groupedProcesses.sem_prazo.length > 0 && (
        <Card className="border-gray-200 bg-gray-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-gray-700">
              <Clock className="h-5 w-5" />
              Sem prazo informado ({groupedProcesses.sem_prazo.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {groupedProcesses.sem_prazo.map((process) => (
                <div key={process.id} className="p-4 bg-white rounded-lg border border-gray-200">
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold">{process.process_number}</h3>
                        <Badge variant="secondary" className="text-xs">
                          {(process.municipalities && 'name' in process.municipalities) ? process.municipalities.name : 'N/A'}
                        </Badge>
                        <Badge variant="outline" className="text-xs text-gray-700 border-gray-300">
                          Sem prazo
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-2 line-clamp-2">{process.object}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Data não informada
                        </span>
                        <span>Valor: {formatCurrency(process.total_portaria_value)}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" asChild>
                        <Link to={`/processes`}>
                          Ver Detalhes
                        </Link>
                      </Button>
                      {process.link_plataforma_governo && (
                        <Button size="sm" variant="outline" onClick={() => window.open(process.link_plataforma_governo, '_blank')}>
                          <ExternalLink className="h-3 w-3 mr-1" />
                          Plataforma
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Estado vazio quando não há processos na categoria selecionada */}
      {categoryFilter !== 'all' && filteredProcesses.length === 0 && (
        <Card className="border-gray-200 bg-gray-50">
          <CardContent className="p-12 text-center">
            <Clock className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhum processo nesta categoria
            </h3>
            <p className="text-gray-600">
              Não há processos com o filtro selecionado.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Estado vazio quando não há processos em geral */}
      {categoryFilter === 'all' && filteredProcesses.length === 0 && (
        <Card className="border-gray-200 bg-gray-50">
          <CardContent className="p-12 text-center">
            <Clock className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Nenhum processo cadastrado
            </h3>
            <p className="text-gray-600">
              Não há processos no sistema para exibir alertas.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Navegação contextual para outras telas de Monitoramento */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Navegação Rápida</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-3">
            <Button variant="outline" className="justify-start" asChild>
              <Link to="/processes">
                <FileText className="h-4 w-4 mr-2" />
                Ver Todos os Processos
                <ArrowRight className="h-4 w-4 ml-auto" />
              </Link>
            </Button>
            <Button variant="outline" className="justify-start" asChild>
              <Link to="/process-timeline">
                <Clock className="h-4 w-4 mr-2" />
                Timeline de Processos
                <ArrowRight className="h-4 w-4 ml-auto" />
              </Link>
            </Button>
            <Button variant="outline" className="justify-start" asChild>
              <Link to="/process-calendar">
                <Calendar className="h-4 w-4 mr-2" />
                Calendário de Processos
                <ArrowRight className="h-4 w-4 ml-auto" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
