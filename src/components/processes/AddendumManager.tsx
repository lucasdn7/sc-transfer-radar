import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Trash2, Edit } from "lucide-react";

interface Addendum {
  id?: number;
  process_id?: number;
  numero_aditivo: string;
  data_assinatura?: string;
  nova_vigencia: string;
  created_at?: string;
}

interface AddendumManagerProps {
  processId?: number;
  isEdit?: boolean;
  onAddendumChange?: () => void;
}

export function AddendumManager({ processId, isEdit = false, onAddendumChange }: AddendumManagerProps) {
  const [addendums, setAddendums] = useState<Addendum[]>([]);
  const [loading, setLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAddendum, setEditingAddendum] = useState<Addendum | null>(null);
  const [formData, setFormData] = useState<Addendum>({
    numero_aditivo: '',
    data_assinatura: '',
    nova_vigencia: '',
  });
  const { toast } = useToast();

  useEffect(() => {
    if (processId && isEdit) {
      loadAddendums();
    }
  }, [processId, isEdit]);

  const loadAddendums = async () => {
    if (!processId) return;
    
    setLoading(true);
    try {
      const { data, error } = await (supabase as any)
        .from('process_addendums')
        .select('*')
        .eq('process_id', processId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setAddendums(data || []);
    } catch (error) {
      console.error('Erro ao carregar aditivos:', error);
      toast({
        title: "Erro ao carregar aditivos",
        description: "Não foi possível carregar os aditivos do processo.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.nova_vigencia) {
      toast({
        title: "Campo obrigatório",
        description: "A nova vigência é obrigatória.",
        variant: "destructive",
      });
      return;
    }

    if (!processId) {
      toast({
        title: "Erro",
        description: "Processo não identificado.",
        variant: "destructive",
      });
      return;
    }

    try {
      if (editingAddendum?.id) {
        // Editar aditivo existente
        const { error } = await (supabase as any)
          .from('process_addendums')
          .update({
            numero_aditivo: formData.numero_aditivo,
            data_assinatura: formData.data_assinatura || null,
            nova_vigencia: formData.nova_vigencia,
          })
          .eq('id', editingAddendum.id);

        if (error) throw error;

        toast({
          title: "Aditivo atualizado",
          description: "O aditivo foi atualizado com sucesso.",
        });
      } else {
        // Criar novo aditivo
        const { error } = await (supabase as any)
          .from('process_addendums')
          .insert([{
            process_id: processId,
            numero_aditivo: formData.numero_aditivo,
            data_assinatura: formData.data_assinatura || null,
            nova_vigencia: formData.nova_vigencia,
          }]);

        if (error) throw error;

        toast({
          title: "Aditivo adicionado",
          description: "O aditivo foi adicionado com sucesso.",
        });
      }

      setIsDialogOpen(false);
      setEditingAddendum(null);
      setFormData({ numero_aditivo: '', data_assinatura: '', nova_vigencia: '' });
      loadAddendums();
      
      // Notificar o componente pai para refetch o processo
      if (onAddendumChange) {
        onAddendumChange();
      }
    } catch (error) {
      console.error('Erro ao salvar aditivo:', error);
      toast({
        title: "Erro ao salvar aditivo",
        description: "Não foi possível salvar o aditivo.",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (addendum: Addendum) => {
    setEditingAddendum(addendum);
    setFormData({
      numero_aditivo: addendum.numero_aditivo,
      data_assinatura: addendum.data_assinatura || '',
      nova_vigencia: addendum.nova_vigencia,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir este aditivo?')) return;

    try {
      const { error } = await (supabase as any)
        .from('process_addendums')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Aditivo removido",
        description: "O aditivo foi removido com sucesso.",
      });

      loadAddendums();
      
      // Notificar o componente pai para refetch o processo
      if (onAddendumChange) {
        onAddendumChange();
      }
    } catch (error) {
      console.error('Erro ao remover aditivo:', error);
      toast({
        title: "Erro ao remover aditivo",
        description: "Não foi possível remover o aditivo.",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'Não informada';
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR');
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Carregando aditivos...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Aditivos de Contrato</span>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                type="button"
                onClick={() => {
                  setEditingAddendum(null);
                  setFormData({ numero_aditivo: '', data_assinatura: '', nova_vigencia: '' });
                }}
                variant="outline" 
                size="sm"
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Adicionar Aditivo
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingAddendum ? 'Editar Aditivo' : 'Novo Aditivo'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="numero_aditivo">Número do Aditivo</Label>
                  <Input
                    id="numero_aditivo"
                    value={formData.numero_aditivo}
                    onChange={(e) => setFormData({ ...formData, numero_aditivo: e.target.value })}
                    placeholder="Ex: 1º Termo Aditivo"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="data_assinatura">Data de Assinatura (opcional)</Label>
                  <Input
                    id="data_assinatura"
                    type="date"
                    value={formData.data_assinatura}
                    onChange={(e) => setFormData({ ...formData, data_assinatura: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nova_vigencia">Nova Vigência *</Label>
                  <Input
                    id="nova_vigencia"
                    type="date"
                    value={formData.nova_vigencia}
                    onChange={(e) => setFormData({ ...formData, nova_vigencia: e.target.value })}
                    required
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit">
                    {editingAddendum ? 'Atualizar' : 'Salvar'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {addendums.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>Nenhum aditivo cadastrado</p>
          </div>
        ) : (
          <div className="space-y-3">
            {addendums.map((addendum) => (
              <div 
                key={addendum.id} 
                className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 border rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex-1 space-y-1">
                  <div className="font-medium">{addendum.numero_aditivo || 'Sem número'}</div>
                  <div className="text-sm text-gray-600">
                    {addendum.data_assinatura && (
                      <span>Assinado em: {formatDate(addendum.data_assinatura)}</span>
                    )}
                    {addendum.data_assinatura && addendum.nova_vigencia && ' • '}
                    {addendum.nova_vigencia && (
                      <span>Nova vigência: {formatDate(addendum.nova_vigencia)}</span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    onClick={() => handleEdit(addendum)}
                    variant="outline"
                    size="sm"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    onClick={() => handleDelete(addendum.id!)}
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
