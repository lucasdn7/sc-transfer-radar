
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, CheckCircle, Clock, AlertTriangle } from "lucide-react";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { getStatusColor, getStatusLabel } from "@/utils/processUtils";
import type { Database } from "@/integrations/supabase/types";

type ProcessStatus = Database['public']['Enums']['process_status'];

export function StatusDistribution() {
  const { data: stats, isLoading, error } = useDashboardStats();

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
      <Card>
        <CardHeader>
          <CardTitle>Distribuição por Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-6 bg-gray-200 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Distribuição por Status</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-600">Erro ao carregar dados</p>
        </CardContent>
      </Card>
    );
  }

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
          {Object.entries(stats?.statusDistribution || {}).map(([status, count]) => (
            <div key={status} className="flex items-center justify-between">
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
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
