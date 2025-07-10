
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

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
  const [editingParcels, setEditingParcels] = useState<Record<number, boolean>>({});
  const { toast } = useToast();

  useEffect(() => {
    fetchParcels();
  }, [processId]);

  async function fetchParcels() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('process_parcels')
        .select('*')
        .eq('process_id', processId)
        .order('parcel_number');
      
      if (error) throw error;
      setParcels(data || []);
    } catch (error) {
      console.error('Erro ao buscar parcelas:', error);
      toast({
        title: "Erro ao carregar parcelas",
        description: "Não foi possível carregar as parcelas do processo.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  async function addParcels() {
    if (newParcels.value <= 0) {
      toast({
        title: "Valor inválido",
        description: "O valor da parcela deve ser maior que zero.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const inserts = Array.from({ length: newParcels.count }).map((_, i) => ({
        parcel_number: parcels.length + i + 1,
        value: newParcels.value,
        process_id: processId,
        payment_date: null,
      }));
      
      const { error } = await supabase.from('process_parcels').insert(inserts);
      if (error) throw error;
      
      setNewParcels({ count: 1, value: 0 });
      await fetchParcels();
      
      toast({
        title: "Parcelas adicionadas",
        description: `${newParcels.count} parcela(s) adicionada(s) com sucesso.`,
      });
    } catch (error) {
      console.error('Erro ao adicionar parcelas:', error);
      toast({
        title: "Erro ao adicionar parcelas",
        description: "Não foi possível adicionar as parcelas.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  async function updateParcelPayment(parcel: Parcel, paid: boolean, date?: string) {
    try {
      const paymentDate = paid ? (date || format(new Date(), 'yyyy-MM-dd')) : null;
      const { error } = await supabase
        .from('process_parcels')
        .update({ payment_date: paymentDate })
        .eq('id', parcel.id);
      
      if (error) throw error;
      await fetchParcels();
      
      toast({
        title: paid ? "Parcela marcada como paga" : "Pagamento removido",
        description: `Parcela ${parcel.parcel_number} atualizada com sucesso.`,
      });
    } catch (error) {
      console.error('Erro ao atualizar pagamento:', error);
      toast({
        title: "Erro ao atualizar pagamento",
        description: "Não foi possível atualizar o status de pagamento.",
        variant: "destructive",
      });
    }
  }

  async function updateParcelValue(parcelId: number, newValue: number) {
    if (newValue <= 0) {
      toast({
        title: "Valor inválido",
        description: "O valor da parcela deve ser maior que zero.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('process_parcels')
        .update({ value: newValue })
        .eq('id', parcelId);
      
      if (error) throw error;
      await fetchParcels();
      
      toast({
        title: "Valor atualizado",
        description: "Valor da parcela atualizado com sucesso.",
      });
    } catch (error) {
      console.error('Erro ao atualizar valor:', error);
      toast({
        title: "Erro ao atualizar valor",
        description: "Não foi possível atualizar o valor da parcela.",
        variant: "destructive",
      });
    }
  }

  async function deleteParcel(parcelId: number) {
    try {
      const { error } = await supabase
        .from('process_parcels')
        .delete()
        .eq('id', parcelId);
      
      if (error) throw error;
      await fetchParcels();
      
      toast({
        title: "Parcela removida",
        description: "Parcela removida com sucesso.",
      });
    } catch (error) {
      console.error('Erro ao remover parcela:', error);
      toast({
        title: "Erro ao remover parcela",
        description: "Não foi possível remover a parcela.",
        variant: "destructive",
      });
    }
  }

  const totalValue = parcels.reduce((sum, parcel) => sum + parcel.value, 0);
  const paidValue = parcels
    .filter(parcel => parcel.payment_date)
    .reduce((sum, parcel) => sum + parcel.value, 0);
  const remainingValue = totalValue - paidValue;

  if (loading && parcels.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse text-center">Carregando parcelas...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Parcelas do Processo</span>
          <div className="text-sm font-normal space-x-4">
            <span className="text-green-600">Pago: R$ {paidValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
            <span className="text-yellow-600">Restante: R$ {remainingValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
            <span className="text-blue-600">Total: R$ {totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
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
              className={`flex items-center gap-4 border rounded-lg p-4 transition-colors ${
                parcel.payment_date ? 'bg-green-50 border-green-200' : 'bg-white'
              }`}
            >
              <div className="w-20 font-medium">
                Parcela {parcel.parcel_number}
              </div>
              
              <div className="w-40">
                {editingParcels[parcel.id!] ? (
                  <div className="flex gap-1">
                    <Input
                      type="number"
                      step="0.01"
                      min={0.01}
                      defaultValue={parcel.value}
                      className="w-32"
                      onBlur={(e) => {
                        const newValue = Number(e.target.value);
                        if (newValue !== parcel.value && newValue > 0) {
                          updateParcelValue(parcel.id!, newValue);
                        }
                        setEditingParcels(prev => ({ ...prev, [parcel.id!]: false }));
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.currentTarget.blur();
                        }
                      }}
                      autoFocus
                    />
                  </div>
                ) : (
                  <div 
                    className="font-mono cursor-pointer hover:bg-gray-100 px-2 py-1 rounded"
                    onClick={() => setEditingParcels(prev => ({ ...prev, [parcel.id!]: true }))}
                    title="Clique para editar o valor"
                  >
                    R$ {parcel.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                <Checkbox
                  id={`paid-${parcel.id}`}
                  checked={!!parcel.payment_date}
                  onCheckedChange={(checked) => updateParcelPayment(parcel, !!checked)}
                />
                <Label htmlFor={`paid-${parcel.id}`} className="text-sm cursor-pointer">
                  Pago
                </Label>
              </div>
              
              {parcel.payment_date && (
                <div className="flex flex-col space-y-1">
                  <Label htmlFor={`date-${parcel.id}`} className="text-xs text-gray-600">
                    Data de Pagamento
                  </Label>
                  <Input
                    id={`date-${parcel.id}`}
                    type="date"
                    value={parcel.payment_date}
                    onChange={e => updateParcelPayment(parcel, true, e.target.value)}
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
                <div className="col-span-2">
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full transition-all duration-300" 
                      style={{ width: totalValue > 0 ? `${(paidValue / totalValue) * 100}%` : '0%' }}
                    ></div>
                  </div>
                  <div className="text-center mt-1">
                    {totalValue > 0 ? Math.round((paidValue / totalValue) * 100) : 0}% pago
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
