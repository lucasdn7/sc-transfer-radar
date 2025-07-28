import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ExternalLink } from "lucide-react";
import { useDashboardStats } from "@/hooks/useDashboardStats";

export function StatusProcessHorizontalCards() {
  const { data: stats, isLoading } = useDashboardStats();
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-2">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="min-w-[180px] animate-pulse">
            <CardContent className="p-4 flex flex-col items-center">
              <div className="h-6 w-20 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 w-10 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const statusData = stats?.statusData || [];
  const processes = stats?.processes || [];

  return (
    <div className="flex gap-4 overflow-x-auto pb-2">
      {statusData.map(({ status, count }) => (
        <Dialog key={status} open={modalOpen && selectedStatus === status} onOpenChange={open => { setModalOpen(open); if (!open) setSelectedStatus(null); }}>
          <DialogTrigger asChild>
            <Card
              className="min-w-[180px] cursor-pointer hover:shadow-lg transition-shadow flex flex-col items-center justify-center"
              onClick={() => { setSelectedStatus(status); setModalOpen(true); }}
            >
              <CardContent className="flex flex-col items-center p-4">
                <span className="font-semibold text-base mb-1">{status}</span>
                <Badge className="mb-1 text-lg px-3 py-1">{count}</Badge>
                <span className="text-xs text-muted-foreground">processos</span>
              </CardContent>
            </Card>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Processos com status: {status}</DialogTitle>
            </DialogHeader>
            <div className="max-h-[60vh] overflow-y-auto mt-2">
              {processes.filter((p: any) => (p.status_processos?.nome || p.status_nome) === status).length === 0 ? (
                <div className="text-center text-muted-foreground py-8">Nenhum processo encontrado.</div>
              ) : (
                <table className="w-full text-sm border-separate border-spacing-y-1">
                  <thead>
                    <tr className="text-left text-muted-foreground">
                      <th>Nº Processo</th>
                      <th>Município</th>
                      <th>Objeto</th>
                      <th>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {processes.filter((p: any) => (p.status_processos?.nome || p.status_nome) === status).map((p: any) => (
                      <tr key={p.id} className="bg-muted/50 hover:bg-muted">
                        <td className="py-1 px-2 font-mono">{p.process_number}</td>
                        <td className="py-1 px-2">{p.municipalities?.name || '-'}</td>
                        <td className="py-1 px-2 truncate max-w-[200px]">{p.object}</td>
                        <td className="py-1 px-2">
                          {p.link_plataforma_governo && (
                            <Button asChild variant="link" size="sm">
                              <a href={p.link_plataforma_governo} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="inline-block mr-1" />
                                Acessar
                              </a>
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </DialogContent>
        </Dialog>
      ))}
    </div>
  );
}