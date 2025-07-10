
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface ProcessParcelsSummaryProps {
  processId: number;
  className?: string;
}

interface ParcelsSummary {
  totalValue: number;
  paidValue: number;
  remainingValue: number;
  totalParcels: number;
  paidParcels: number;
  progressText: string;
  progressPercentage: number;
}

export function ProcessParcelsSummary({ processId, className = "" }: ProcessParcelsSummaryProps) {
  const [summary, setSummary] = useState<ParcelsSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchParcelsSummary();
  }, [processId]);

  async function fetchParcelsSummary() {
    try {
      const { data, error } = await supabase
        .from('process_parcels')
        .select('value, payment_date')
        .eq('process_id', processId);
      
      if (error) throw error;

      if (!data || data.length === 0) {
        setSummary(null);
        return;
      }

      const totalValue = data.reduce((sum, parcel) => sum + parcel.value, 0);
      const paidParcels = data.filter(parcel => parcel.payment_date);
      const paidValue = paidParcels.reduce((sum, parcel) => sum + parcel.value, 0);
      const remainingValue = totalValue - paidValue;
      const progressPercentage = totalValue > 0 ? (paidValue / totalValue) * 100 : 0;

      setSummary({
        totalValue,
        paidValue,
        remainingValue,
        totalParcels: data.length,
        paidParcels: paidParcels.length,
        progressText: `${paidParcels.length}/${data.length}`,
        progressPercentage
      });
    } catch (error) {
      console.error('Erro ao buscar resumo das parcelas:', error);
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
        <div className="h-3 bg-gray-200 rounded w-24"></div>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className={`text-gray-500 text-sm ${className}`}>
        Nenhuma parcela cadastrada
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex justify-between items-center text-sm">
        <span className="text-gray-600">Saldo a repassar:</span>
        <span className="font-medium text-orange-600">
          R$ {summary.remainingValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
        </span>
      </div>
      
      <div className="flex justify-between items-center text-sm">
        <span className="text-gray-600">Valor repassado:</span>
        <span className="font-medium text-green-600">
          R$ {summary.paidValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
        </span>
      </div>
      
      <div className="flex justify-between items-center text-sm">
        <span className="text-gray-600">Parcelas pagas:</span>
        <span className="font-medium text-blue-600">
          {summary.progressText}
        </span>
      </div>

      {/* Barra de progresso compacta */}
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className="bg-green-500 h-2 rounded-full transition-all duration-300" 
          style={{ width: `${summary.progressPercentage}%` }}
        ></div>
      </div>
      
      <div className="text-xs text-gray-500 text-center">
        {Math.round(summary.progressPercentage)}% concluído
      </div>
    </div>
  );
}
