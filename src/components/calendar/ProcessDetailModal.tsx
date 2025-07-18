
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, MapPin, Calendar, DollarSign } from "lucide-react";
import { formatCurrency } from "@/utils/processUtils";
import { useNavigate } from "react-router-dom";
import { useProcessParcels } from "@/hooks/useProcessParcels";
import { formatCurrencyBR } from "@/utils/parcelUtils";

interface ProcessDetailModalProps {
  process: any;
  isOpen: boolean;
  onClose: () => void;
}

export function ProcessDetailModal({ process, isOpen, onClose }: ProcessDetailModalProps) {
  const navigate = useNavigate();
  const parcelsHook = process && process.id ? useProcessParcels(process.id) : { summary: { progressText: '0/0', paidValue: 0, remainingValue: 0 } };
  const summary = parcelsHook.summary;

  if (!process) return null;

  // Função segura para acessar campos do processo
  const safe = (fn: () => any, fallback: any = 'N/A') => {
    try {
      const v = fn();
      return v !== undefined && v !== null && v !== '' ? v : fallback;
    } catch {
      return fallback;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'finalizado':
        return 'bg-green-500';
      case 'em andamento':
      case 'aprovado':
        return 'bg-yellow-500';
      case 'em análise':
        return 'bg-blue-500';
      case 'cancelado':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const addToGoogleCalendar = () => {
    const startDate = new Date(process.vigencia_date);
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 1);
    
    const googleUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(process.process_number)}&dates=${startDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z/${endDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z&details=${encodeURIComponent(process.object)}&location=${encodeURIComponent(process.municipalities?.name || '')}`;
    
    window.open(googleUrl, '_blank');
  };

  const handleViewProcess = () => {
    navigate('/processes');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {safe(() => process.process_number)}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <h3 className="font-semibold">Objeto do Processo</h3>
            <p className="text-sm text-gray-600">{safe(() => process.object)}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Município
              </h4>
              <p className="text-sm">{safe(() => process.municipalities?.name)}</p>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium">Núcleo Regional</h4>
              <p className="text-sm">{safe(() => process.regional_nuclei?.name)}</p>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium">Status</h4>
            <Badge 
              variant="outline" 
              className={`${getStatusColor(safe(() => process.status_processos?.nome, ''))} text-white border-0`}
            >
              {safe(() => process.status_processos?.nome, 'Não definido')}
            </Badge>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Valores
            </h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Valor Total:</span>
                <div className="text-green-600 font-bold">
                  {formatCurrency(safe(() => process.total_portaria_value, 0))}
                </div>
              </div>
              <div>
                <span className="font-medium">Valor Concedente:</span>
                <div>{formatCurrency(safe(() => process.total_concedente_value, 0))}</div>
              </div>
              <div>
                <span className="font-medium">Valor Proponente:</span>
                <div>{formatCurrency(safe(() => process.total_proponente_value, 0))}</div>
              </div>
              {safe(() => process.licitado_value) && (
                <div>
                  <span className="font-medium">Valor Licitado:</span>
                  <div>{formatCurrency(safe(() => process.licitado_value, 0))}</div>
                </div>
              )}
            </div>
          </div>

          {/* Resumo das Parcelas */}
          <div className="space-y-2">
            <h4 className="font-medium">Resumo das Parcelas</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Parcelas Pagas:</span>
                <div className="text-blue-600 font-bold">
                  {summary.progressText}
                </div>
              </div>
              <div>
                <span className="font-medium">Valor Repassado:</span>
                <div className="text-green-600 font-bold">
                  {formatCurrencyBR(summary.paidValue)}
                </div>
              </div>
              <div>
                <span className="font-medium">Saldo a Repassar:</span>
                <div className="text-orange-600 font-bold">
                  {formatCurrencyBR(summary.remainingValue)}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium">Data de Vigência</h4>
            <p className="text-sm">
              {new Date(safe(() => process.vigencia_date, new Date())).toLocaleDateString('pt-BR')}
            </p>
          </div>

          {safe(() => process.address) && (
            <div className="space-y-2">
              <h4 className="font-medium">Endereço</h4>
              <p className="text-sm text-gray-600">{safe(() => process.address)}</p>
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <Button onClick={handleViewProcess} className="flex-1">
              Ver Processo Completo
            </Button>
            <Button 
              variant="outline" 
              onClick={addToGoogleCalendar}
              className="flex items-center gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              Google Calendar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
