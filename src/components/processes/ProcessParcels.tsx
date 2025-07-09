import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

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
    await supabase.from('process_parcels').update({
      payment_date: paid ? (date || format(new Date(), 'yyyy-MM-dd')) : null,
    }).eq('id', parcel.id);
    fetchParcels();
  }

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-lg">Parcelas</h3>
      <div className="flex gap-2 items-end">
        <Input
          type="number"
          min={1}
          value={newParcels.count}
          onChange={e => setNewParcels(p => ({ ...p, count: Number(e.target.value) }))}
          className="w-20"
          placeholder="Qtd."
        />
        <Input
          type="number"
          min={0}
          value={newParcels.value}
          onChange={e => setNewParcels(p => ({ ...p, value: Number(e.target.value) }))}
          className="w-32"
          placeholder="Valor da parcela"
        />
        <Button onClick={addParcels} disabled={loading || newParcels.value <= 0}>Adicionar</Button>
      </div>
      <div className="space-y-2">
        {parcels.length === 0 && <div className="text-sm text-muted-foreground">Nenhuma parcela cadastrada.</div>}
        {parcels.map(parcel => (
          <div key={parcel.id} className="flex items-center gap-4 border rounded p-2">
            <div className="w-20">Parcela {parcel.parcel_number}</div>
            <div className="w-32">R$ {parcel.value.toLocaleString('pt-BR')}</div>
            <label className="flex items-center gap-1 cursor-pointer">
              <input
                type="checkbox"
                checked={!!parcel.payment_date}
                onChange={e => updateParcel(parcel, e.target.checked)}
              />
              Pago
            </label>
            {parcel.payment_date && (
              <Input
                type="date"
                value={parcel.payment_date}
                onChange={e => updateParcel(parcel, true, e.target.value)}
                className="w-40"
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
} 