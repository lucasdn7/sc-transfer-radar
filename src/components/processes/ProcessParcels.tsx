
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Parcel {
  id?: number;
  parcel_number: number;
  value: number;
  payment_date: string | null;
  process_id: number;
}

export function ProcessParcels({ processId }: { processId: number }) {
  const [parcels, setParcels] = useState<Parcel[]>([]);
  const [newParcels, setNewParcels] = useState<{ count: number; value: number }>({ count: 1, value: 0 });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchParcels();
    // eslint-disable-next-line
  }, [processId]);

  async function fetchParcels() {
    setLoading(true);
    const { data } = await supabase
      .from('process_parcels')
      .select('*')
      .eq('process_id', processId)
      .order('parcel_number');
    setParcels(data || []);
    setLoading(false);
  }

  async function addParcels() {
    setLoading(true);
    const inserts = Array.from({ length: newParcels.count }).map((_, i) => ({
      parcel_number: parcels.length + i + 1,
      value: newParcels.value,
      process_id: processId,
      payment_date: null,
    }));
    await supabase.from('process_parcels').insert(inserts);
    setNewParcels({ count: 1, value: 0 });
    fetchParcels();
  }

  async function updateParcel(parcel: Parcel, paid: boolean, date?: string) {
    const paymentDate = paid ? (date || format(new Date(), 'yyyy-MM-dd')) : null;
    await supabase.from('process_parcels').update({
      payment_date: paymentDate,
    }).eq('id', parcel.id);
    fetchParcels();
  }

  async function deleteParcel(parcelId: number) {
    await supabase.from('process_parcels').delete().eq('id', parcelId);
    fetchParcels();
  }

  const totalValue = parcels.reduce((sum, parcel) => sum + parcel.value, 0);
  const paidValue = parcels
    .filter(parcel => parcel.payment_date)
    .reduce((sum, parcel) => sum + parcel.value, 0);
  const remainingValue = totalValue - paidValue;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Parcelas do Processo</span>
          <div className="text-sm font-normal space-x-4">
            <span className="text-green-600">Pago: R$ {paidValue.toLocaleString('pt-BR')}</span>
            <span className="text-yellow-600">Restante: R$ {remainingValue.toLocaleString('pt-BR')}</span>
            <span className="text-blue-600">Total: R$ {totalValue.toLocaleString('pt-BR')}</span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Adicionar novas parcelas */}
        <div className="flex gap-2 items-end p-4 bg-gray-50 rounded-lg">
          <div className="space-y-2">
            <Label htmlFor="parcel-count">Quantidade</Label>
            <Input
              id="parcel-count"
              type="number"
              min={1}
              value={newParcels.count}
              onChange={e => setNewParcels(p => ({ ...p, count: Number(e.target.value) }))}
              className="w-20"
              placeholder="Qtd."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="parcel-value">Valor da Parcela</Label>
            <Input
              id="parcel-value"
              type="number"
              min={0}
              step="0.01"
              value={newParcels.value}
              onChange={e => setNewParcels(p => ({ ...p, value: Number(e.target.value) }))}
              className="w-40"
              placeholder="Valor da parcela"
            />
          </div>
          <Button 
            onClick={addParcels} 
            disabled={loading || newParcels.value <= 0}
            className="mb-0"
          >
            Adicionar Parcelas
          </Button>
        </div>

        {/* Lista de parcelas */}
        <div className="space-y-3">
          {parcels.length === 0 && (
            <div className="text-sm text-muted-foreground text-center py-4">
              Nenhuma parcela cadastrada.
            </div>
          )}
          {parcels.map(parcel => (
            <div 
              key={parcel.id} 
              className={`flex items-center gap-4 border rounded-lg p-3 transition-colors ${
                parcel.payment_date ? 'bg-green-50 border-green-200' : 'bg-white'
              }`}
            >
              <div className="w-20 font-medium">
                Parcela {parcel.parcel_number}
              </div>
              
              <div className="w-32 font-mono">
                R$ {parcel.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
              
              <div className="flex items-center gap-2">
                <Checkbox
                  id={`paid-${parcel.id}`}
                  checked={!!parcel.payment_date}
                  onCheckedChange={(checked) => updateParcel(parcel, !!checked)}
                />
                <Label htmlFor={`paid-${parcel.id}`} className="text-sm cursor-pointer">
                  Pago
                </Label>
              </div>
              
              {parcel.payment_date && (
                <div className="space-y-1">
                  <Label htmlFor={`date-${parcel.id}`} className="text-xs text-gray-600">
                    Data de Pagamento
                  </Label>
                  <Input
                    id={`date-${parcel.id}`}
                    type="date"
                    value={parcel.payment_date}
                    onChange={e => updateParcel(parcel, true, e.target.value)}
                    className="w-40"
                  />
                </div>
              )}
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => deleteParcel(parcel.id!)}
                className="ml-auto text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                Remover
              </Button>
            </div>
          ))}
        </div>

        {parcels.length > 0 && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <div className="text-sm text-blue-800">
              <div className="font-medium mb-1">Resumo das Parcelas:</div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>Total de parcelas: {parcels.length}</div>
                <div>Parcelas pagas: {parcels.filter(p => p.payment_date).length}</div>
                <div>Valor total: R$ {totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                <div>Valor pago: R$ {paidValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
