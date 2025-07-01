
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

interface DashboardStats {
  totalProcesses: number;
  totalValue: number;
  activeMunicipalities: number;
  regionalNuclei: number;
  processesByStatus: Record<string, number>;
  recentProcesses: any[];
}

export function Dashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async (): Promise<DashboardStats> => {
      console.log('Fetching dashboard statistics...');
      
      // Fetch total processes
      const { data: processes, error: processError } = await supabase
        .from('processes')
        .select('*');
      
      if (processError) {
        console.error('Error fetching processes:', processError);
        throw processError;
      }

      // Fetch municipalities
      const { data: municipalities, error: munError } = await supabase
        .from('municipalities')
        .select('*');
      
      if (munError) {
        console.error('Error fetching municipalities:', munError);
        throw munError;
      }

      // Fetch regional nuclei
      const { data: nuclei, error: nucleiError } = await supabase
        .from('regional_nuclei')
        .select('*');
      
      if (nucleiError) {
        console.error('Error fetching regional nuclei:', nucleiError);
        throw nucleiError;
      }

      // Calculate statistics
      const totalValue = processes?.reduce((sum, p) => sum + (p.total_portaria_value || 0), 0) || 0;
      
      const processesByStatus = processes?.reduce((acc, p) => {
        acc[p.current_status] = (acc[p.current_status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      const recentProcesses = processes?.slice(0, 5) || [];

      return {
        totalProcesses: processes?.length || 0,
        totalValue,
        activeMunicipalities: municipalities?.length || 0,
        regionalNuclei: nuclei?.length || 0,
        processesByStatus,
        recentProcesses
      };
    }
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'finished':
        return <CheckCircle className="h-4 w-4" />;
      case 'cancelled':
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

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
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

        <Card>
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

        <Card>
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

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Núcleos Regionais</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.regionalNuclei || 0}</p>
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
              {Object.entries(stats?.processesByStatus || {}).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(status)}
                    <span className="text-sm font-medium">
                      {getStatusLabel(status)}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={getStatusColor(status)}>
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
              {stats?.recentProcesses?.map((process) => (
                <div key={process.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium">{process.process_number}</p>
                    <p className="text-xs text-gray-600">{process.object}</p>
                  </div>
                  <Badge className={getStatusColor(process.current_status)}>
                    {getStatusLabel(process.current_status)}
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
