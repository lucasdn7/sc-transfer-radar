import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatCurrency } from "@/utils/processUtils";

interface TransferStats {
  valorTotalPortarias: number;
  valorContratos: number;
  valorRepassado: number;
  saldoARepassar: number;
  valorContrapartida: number;
  pctContratosPagos: number;
  pctPortariaPaga: number;
}

const toNumber = (value: unknown) => {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = Number(value.replace(/\./g, "").replace(",", "."));
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
};

const clampPercent = (value: number) => Math.min(Math.max(value, 0), 100);

export function TransferProgressBar() {
  const { data: stats, isLoading } = useQuery<TransferStats>({
    queryKey: ['transfer-progress'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('vw_dashboard_obras')
        .select('valor_total_portarias, valor_contratos, valor_repassado, saldo_a_repassar, valor_contrapartida, pct_contratos_pagos, pct_portaria_paga')
        .maybeSingle();

      if (error) throw error;

      return {
        valorTotalPortarias: toNumber(data?.valor_total_portarias),
        valorContratos: toNumber(data?.valor_contratos),
        valorRepassado: toNumber(data?.valor_repassado),
        saldoARepassar: toNumber(data?.saldo_a_repassar),
        valorContrapartida: toNumber(data?.valor_contrapartida),
        pctContratosPagos: toNumber(data?.pct_contratos_pagos),
        pctPortariaPaga: toNumber(data?.pct_portaria_paga),
      };
    },
    refetchInterval: 30000, // Atualizar a cada 30 segundos
  });

  if (isLoading || !stats) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Status das Transferências (Portarias publicadas no DOE)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const percentualPortariaPago = clampPercent(stats.pctPortariaPaga);

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="text-lg flex items-center justify-between">
          <span>Status das Transferências (Portarias publicadas no DOE)</span>
          <span className="text-sm font-normal text-gray-500">
            {stats.pctPortariaPaga.toFixed(1)}% da portaria pago
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Barra de Progressão Principal */}
        <div className="space-y-3">
          <div className="flex justify-between items-center text-sm">
            <span className="font-medium">Progresso dos Repasses sobre Portarias</span>
            <span className="text-gray-600">
              {formatCurrency(stats.valorRepassado)} de {formatCurrency(stats.valorTotalPortarias)}
            </span>
          </div>

          <div className="relative">
            <Progress
              value={percentualPortariaPago}
              className="h-4"
            />
            <div
              className="absolute top-0 left-0 h-4 rounded transition-all duration-500 ease-out"
              style={{
                width: `${percentualPortariaPago}%`,
                background: `linear-gradient(90deg,
                  ${stats.pctPortariaPaga >= 75 ? '#10b981' :
                    stats.pctPortariaPaga >= 50 ? '#f59e0b' : '#3b82f6'} 0%,
                  ${stats.pctPortariaPaga >= 75 ? '#059669' :
                    stats.pctPortariaPaga >= 50 ? '#d97706' : '#1d4ed8'} 100%)`
              }}
            />
          </div>

          <div className="text-center">
            <span className="text-2xl font-bold text-green-600">
              {stats.pctPortariaPaga.toFixed(1)}%
            </span>
          </div>
        </div>

        {/* Grid com Métricas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Valor Repassado */}
          <div className="bg-green-50 p-3 rounded-lg">
            <div className="text-sm font-medium text-green-700">Valor Repassado</div>
            <div className="text-lg font-bold text-green-800">
              {formatCurrency(stats.valorRepassado)}
            </div>
            <div className="text-xs text-green-600">
              {stats.pctPortariaPaga.toFixed(1)}% do total
            </div>
          </div>

          {/* Saldo a Repassar */}
          <div className="bg-orange-50 p-3 rounded-lg">
            <div className="text-sm font-medium text-orange-700">Saldo a Repassar</div>
            <div className="text-lg font-bold text-orange-800">
              {formatCurrency(stats.saldoARepassar)}
            </div>
            <div className="text-xs text-orange-600">
              {Math.max(100 - stats.pctContratosPagos, 0).toFixed(1)}% dos contratos
            </div>
          </div>

          {/* Total das Portarias */}
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="text-sm font-medium text-blue-700">Total das Portarias</div>
            <div className="text-lg font-bold text-blue-800">
              {formatCurrency(stats.valorTotalPortarias)}
            </div>
            <div className="text-xs text-blue-600">Valor total publicado</div>
          </div>



          {/* Valor dos Contratos */}
          <div className="bg-sky-50 p-3 rounded-lg">
            <div className="text-sm font-medium text-sky-700">Contratos Assinados</div>
            <div className="text-lg font-bold text-sky-800">
              {formatCurrency(stats.valorContratos)}
            </div>
            <div className="text-xs text-sky-600">
              {stats.pctContratosPagos.toFixed(1)}% pago
            </div>
          </div>

          {/* Contrapartida */}
          <div className="bg-purple-50 p-3 rounded-lg">
            <div className="text-sm font-medium text-purple-700">Contrapartida</div>
            <div className="text-lg font-bold text-purple-800">
              {formatCurrency(stats.valorContrapartida)}
            </div>
            <div className="text-xs text-purple-600">Contrapartida</div>
          </div>
        </div>

        {/* Indicadores Visuais */}
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span>Repassado</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
            <span>Pendente</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
            <span>Total</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
