
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Trash2 } from "lucide-react";

interface Parcel {
  id?: number;
  parcel_number: number;
  value: number;
  payment_date: string | null;
  process_id: number;
}

interface ProcessParcelsProps {
  processId: number;
  onParcelsUpdate?: (summary: {
    totalValue: number;
    paidValue: number;
    remainingValue: number;
    totalParcels: number;
    paidParcels: number;
    progressText: string;
  }) => void;
}

export function ProcessParcels({ processId, onParcelsUpdate }: ProcessParcelsProps) {
  const [parcels, setParcels] = useState<Parcel[]>([]);
  const [newParcels, setNewParcels] = useState<{ count: number; value: number }>({ count: 1, value: 0 });
  const [loading, setLoading] = useState(false);
  const [editingParcels, setEditingParcels] = useState<Record<number, boolean>>({});
  const { toast } = useToast();

  useEffect(() => {
    fetchParcels();
  }, [processId]);

  // Calcular resumo e notificar componente pai sempre que parcelas mudarem
  useEffect(() => {
    const totalValue = parcels.reduce((sum, parcel) => sum + parcel.value, 0);
    const paidParcels = parcels.filter(parcel => parcel.payment_date);
    const paidValue = paidParcels.reduce((sum, parcel) => sum + parcel.value, 0);
    const remainingValue = totalValue - paidValue;

    const summary = {
      totalValue,
      paidValue,
      remainingValue,
      totalParcels: parcels.length,
      paidParcels: paidParcels.length,
      progressText: `${paidParcels.length}/${parcels.length}`
    };

    onParcelsUpdate?.(summary);
  }, [parcels, onParcelsUpdate]);

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
  const paidCount = parcels.filter(p => p.payment_date).length;

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
          <span>Gerenciar Parcelas</span>
          <div className="text-sm font-normal space-x-4">
            <span className="text-green-600">Repassado: R$ {paidValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
            <span className="text-orange-600">Saldo a repassar: R$ {remainingValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
            <span className="text-blue-600">Total: R$ {totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Formulário para adicionar novas parcelas */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-medium text-gray-900 mb-3">Adicionar Parcelas</h3>
          <div className="flex gap-3 items-end">
            <div className="space-y-2">
              <Label htmlFor="parcel-count">Quantidade</Label>
              <Input
                id="parcel-count"
                type="number"
                min={1}
                value={newParcels.count}
                onChange={e => setNewParcels(p => ({ ...p, count: Number(e.target.value) }))}
                className="w-24"
              />
            </div>
            <div className="space-y-2 flex-1">
              <Label htmlFor="parcel-value">Valor por Parcela (R$)</Label>
              <Input
                id="parcel-value"
                type="number"
                min={0}
                step="0.01"
                value={newParcels.value}
                onChange={e => setNewParcels(p => ({ ...p, value: Number(e.target.value) }))}
                placeholder="0,00"
              />
            </div>
            <Button 
              onClick={addParcels} 
              disabled={loading || newParcels.value <= 0}
              className="mb-0"
            >
              Adicionar
            </Button>
          </div>
        </div>

        {/* Lista de parcelas existentes */}
        {parcels.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-medium text-gray-900">Parcelas Cadastradas</h3>
            <div className="space-y-2">
              {parcels.map(parcel => (
                <div 
                  key={parcel.id} 
                  className={`flex items-center gap-4 border rounded-lg p-4 transition-all ${
                    parcel.payment_date 
                      ? 'bg-green-50 border-green-200' 
                      : 'bg-white border-gray-200'
                  }`}
                >
                  {/* Checkbox para marcar como pago */}
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={`paid-${parcel.id}`}
                      checked={!!parcel.payment_date}
                      onCheckedChange={(checked) => updateParcelPayment(parcel, !!checked)}
                    />
                    <Label htmlFor={`paid-${parcel.id}`} className="text-sm cursor-pointer whitespace-nowrap">
                      Parcela {parcel.parcel_number}
                    </Label>
                  </div>
                  
                  {/* Valor da parcela (editável) */}
                  <div className="flex-1">
                    {editingParcels[parcel.id!] ? (
                      <Input
                        type="number"
                        step="0.01"
                        min={0.01}
                        defaultValue={parcel.value}
                        className="w-40"
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
                    ) : (
                      <div 
                        className="font-mono cursor-pointer hover:bg-gray-100 px-3 py-2 rounded border text-center w-40"
                        onClick={() => setEditingParcels(prev => ({ ...prev, [parcel.id!]: true }))}
                        title="Clique para editar o valor"
                      >
                        R$ {parcel.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </div>
                    )}
                  </div>
                  
                  {/* Campo de data (só aparece quando pago) */}
                  {parcel.payment_date && (
                    <div className="space-y-1">
                      <Label htmlFor={`date-${parcel.id}`} className="text-xs text-gray-600">
                        Data do Pagamento
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
                  
                  {/* Status visual */}
                  <div className="flex items-center">
                    {parcel.payment_date ? (
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                        Pago
                      </span>
                    ) : (
                      <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full">
                        Pendente
                      </span>
                    )}
                  </div>
                  
                  {/* Botão de remover */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteParcel(parcel.id!)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Resumo das parcelas */}
        {parcels.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-medium text-blue-900 mb-3">Resumo Financeiro</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-blue-700">Total de parcelas:</span>
                <span className="font-medium ml-2">{parcels.length}</span>
              </div>
              <div>
                <span className="text-blue-700">Parcelas pagas:</span>
                <span className="font-medium ml-2">{paidCount}/{parcels.length}</span>
              </div>
              <div>
                <span className="text-blue-700">Valor total:</span>
                <span className="font-medium ml-2">R$ {totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
              <div>
                <span className="text-blue-700">Valor repassado:</span>
                <span className="font-medium ml-2 text-green-700">R$ {paidValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
              <div className="col-span-2">
                <span className="text-blue-700">Saldo a repassar:</span>
                <span className="font-medium ml-2 text-orange-700">R$ {remainingValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
              </div>
            </div>
            
            {/* Barra de progresso */}
            <div className="mt-4">
              <div className="flex justify-between text-xs text-blue-700 mb-1">
                <span>Progresso das parcelas</span>
                <span>{totalValue > 0 ? Math.round((paidValue / totalValue) * 100) : 0}%</span>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-3">
                <div 
                  className="bg-blue-600 h-3 rounded-full transition-all duration-300" 
                  style={{ width: totalValue > 0 ? `${(paidValue / totalValue) * 100}%` : '0%' }}
                ></div>
              </div>
            </div>
          </div>
        )}

        {parcels.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <p>Nenhuma parcela cadastrada ainda.</p>
            <p className="text-sm">Use o formulário acima para adicionar parcelas.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
