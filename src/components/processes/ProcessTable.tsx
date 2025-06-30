
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Eye, MapPin } from "lucide-react";
import { formatCurrency, formatDate, getStatusColor, getStatusLabel } from "@/utils/processUtils";
import type { Database } from "@/integrations/supabase/types";

type Process = Database['public']['Tables']['processes']['Row'] & {
  municipalities: { name: string; region: string | null } | null;
  regional_nuclei: { name: string; acronym: string } | null;
};

interface ProcessTableProps {
  processes: Process[] | undefined;
}

export function ProcessTable({ processes }: ProcessTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Lista de Processos ({processes?.length || 0})</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Processo</TableHead>
                <TableHead>Município</TableHead>
                <TableHead>Objeto</TableHead>
                <TableHead>Valor Portaria</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Vigência</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {processes?.map((process) => (
                <TableRow key={process.id}>
                  <TableCell className="font-medium">
                    {process.process_number}
                    {process.portaria_number && (
                      <div className="text-xs text-gray-500">
                        Portaria: {process.portaria_number}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <div>
                        <div className="font-medium">{process.municipalities?.name}</div>
                        {process.municipalities?.region && (
                          <div className="text-xs text-gray-500 flex items-center">
                            <MapPin className="h-3 w-3 mr-1" />
                            {process.municipalities.region}
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-xs truncate" title={process.object}>
                      {process.object}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    {formatCurrency(process.total_portaria_value)}
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(process.current_status)}>
                      {getStatusLabel(process.current_status)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {formatDate(process.vigencia_date)}
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        
        {processes?.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            Nenhum processo encontrado
          </div>
        )}
      </CardContent>
    </Card>
  );
}
