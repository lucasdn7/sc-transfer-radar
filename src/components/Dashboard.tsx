
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  FileText, 
  DollarSign, 
  Building, 
  MapPin, 
  TrendingUp, 
  Clock,
  CheckCircle,
  AlertTriangle
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { formatCurrency, getStatusColor, getStatusLabel } from "@/utils/processUtils";
import { SystemNotifications } from "@/components/notifications/SystemNotifications";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import type { Database } from "@/integrations/supabase/types";

type TransferStatus = Database['public']['Enums']['transfer_status'];

export function Dashboard() {
  const { data: stats, isLoading } = useDashboardStats();

  const { data: recentProcesses } = useQuery({
    queryKey: ['recent-processes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('processes')
        .select(`
          *,
          municipalities (name),
          status_processos (nome, cor)
        `)
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Finalizado':
        return <CheckCircle className="h-4 w-4" />;
      case 'Cancelado':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Visão geral das transferências financeiras</p>
        </div>
        <Button>
          <FileText className="h-4 w-4 mr-2" />
          Novo Processo
        </Button>
      </div>

      <SystemNotifications />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total de Processos</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.totalProcesses || 0}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Valor Total</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(stats?.totalValue || 0)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Municípios</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.activeMunicipalities || 0}</p>
              </div>
              <Building className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Núcleos Regionais</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.regionalNucleiCount || 0}</p>
              </div>
              <MapPin className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="h-5 w-5 mr-2" />
              Distribuição por Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(stats?.statusDistribution || {}).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(status)}
                    <span className="text-sm font-medium">
                      {status}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="secondary">
                      {count}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Processes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="h-5 w-5 mr-2" />
              Processos Recentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentProcesses?.map((process) => (
                <div key={process.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium">{process.process_number}</p>
                    <p className="text-xs text-gray-600">{process.municipalities?.name}</p>
                  </div>
                  <Badge variant="secondary">
                    {process.status_processos?.nome || 'Não definido'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
