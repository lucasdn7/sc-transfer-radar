
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, CheckCircle, Clock, AlertTriangle, Play, Pause } from "lucide-react";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { getStatusColor, getStatusLabel } from "@/utils/processUtils";
import type { Database } from "@/integrations/supabase/types";

type ProcessStatus = Database['public']['Enums']['process_status'];

export function StatusDistribution() {
  const { data: stats, isLoading } = useDashboardStats();

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'finished':
        return <CheckCircle className="h-4 w-4" />;
      case 'cancelled':
        return <AlertTriangle className="h-4 w-4" />;
      case 'in_execution':
        return <Play className="h-4 w-4" />;
      case 'approved':
        return <CheckCircle className="h-4 w-4" />;
      case 'in_analysis':
        return <Clock className="h-4 w-4" />;
      default:
        return <Pause className="h-4 w-4" />;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="h-5 w-5 mr-2" />
            Distribuição por Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 animate-pulse">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-6 bg-gray-200 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const statusData = stats?.statusDistribution || {};
  const totalProcesses = Object.values(statusData).reduce((sum, count) => sum + count, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <TrendingUp className="h-5 w-5 mr-2" />
          Distribuição por Status
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {Object.entries(statusData).map(([status, count]) => {
            const percentage = totalProcesses > 0 ? (count / totalProcesses) * 100 : 0;
            
            return (
              <div key={status} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(status)}
                    <span className="text-sm font-medium">
                      {getStatusLabel(status as ProcessStatus)}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge className={getStatusColor(status as ProcessStatus)}>
                      {count}
                    </Badge>
                    <span className="text-xs text-gray-500">
                      {percentage.toFixed(1)}%
                    </span>
                  </div>
                </div>
                <Progress value={percentage} className="h-2" />
              </div>
            );
          })}
        </div>
        
        {totalProcesses === 0 && (
          <div className="text-center py-4 text-gray-500">
            Nenhum processo encontrado
          </div>
        )}
      </CardContent>
    </Card>
  );
}
