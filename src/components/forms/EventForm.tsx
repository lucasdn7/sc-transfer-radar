import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface EventFormData {
  process_number: string;
  nome: string;
  municipio_nome: string;
  nucleo_origem_texto?: string;
  contrato_assinado: string;
  valor_concedente: number;
  valor_proponente: number;
  plano_de_trabalho_inicio?: string;
  plano_de_trabalho_final?: string;
  link_plataforma_governo?: string;
  data_assinatura?: string;
  em_prestacao_contas?: boolean;
  data_prestacao_contas?: string;
  numero_transferencia_especial?: string;
  tipo_de_repasse?: string;
  tipo?: string;
  ano?: string;
}

interface EventFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  initialData?: any;
  isEdit?: boolean;
}

export function EventForm({ onSuccess, onCancel, initialData, isEdit = false }: EventFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [municipalities, setMunicipalities] = useState<{ id: number; name: string }[]>([]);
  const [contratoAssinado, setContratoAssinado] = useState(initialData ? initialData.contrato_assinado : 'nao');
  const [emPrestacaoContas, setEmPrestacaoContas] = useState(initialData ? !!initialData.em_prestacao_contas : false);
  const { toast } = useToast();
  
  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<EventFormData>({
    defaultValues: initialData ? {
      process_number: initialData.process_number || '',
      nome: initialData.nome || '',
      municipio_nome: initialData.municipio_nome || '',
      nucleo_origem_texto: initialData.nucleo_origem_texto || '',
      contrato_assinado: initialData.contrato_assinado || 'nao',
      valor_concedente: initialData.valor_concedente || 0,
      valor_proponente: initialData.valor_proponente || 0,
      plano_de_trabalho_inicio: initialData.plano_de_trabalho_inicio || '',
      plano_de_trabalho_final: initialData.plano_de_trabalho_final || '',
      link_plataforma_governo: initialData.link_plataforma_governo || '',
      data_assinatura: initialData.data_assinatura || '',
      data_prestacao_contas: initialData.data_prestacao_contas || '',
      numero_transferencia_especial: initialData.numero_transferencia_especial || '',
      tipo_de_repasse: initialData.tipo_de_repasse || '',
      tipo: initialData.tipo || '',
      ano: initialData.ano || '',
    } : {
      contrato_assinado: 'nao',
    },
  });

  useEffect(() => {
    fetchMunicipalities();
  }, []);

  const fetchMunicipalities = async () => {
    try {
      const { data } = await supabase
        .from('municipalities')
        .select('*')
        .order('name');
      setMunicipalities(data || []);
    } catch (error) {
      console.error('Erro ao buscar municípios:', error);
    }
  };

  const onSubmit = async (data: EventFormData) => {
    setIsSubmitting(true);
    
    try {
      const eventData = {
        process_number: data.process_number,
        nome: data.nome,
        municipio_nome: data.municipio_nome,
        nucleo_origem_texto: data.nucleo_origem_texto || null,
        contrato_assinado: data.contrato_assinado,
        valor_concedente: data.valor_concedente,
        valor_proponente: data.valor_proponente,
        plano_de_trabalho_inicio: data.plano_de_trabalho_inicio || null,
        plano_de_trabalho_final: data.plano_de_trabalho_final || null,
        link_plataforma_governo: data.link_plataforma_governo || null,
        data_assinatura: data.contrato_assinado === 'sim' ? (data.data_assinatura || null) : null,
        em_prestacao_contas: emPrestacaoContas,
        data_prestacao_contas: emPrestacaoContas ? (data.data_prestacao_contas || null) : null,
        numero_transferencia_especial: data.numero_transferencia_especial || null,
        tipo_de_repasse: data.tipo_de_repasse || null,
        tipo: data.tipo || null,
        ano: data.ano || null,
      } as any;

      if (isEdit && initialData?.id) {
        const { error } = await (supabase as any)
          .from('events')
          .update(eventData)
          .eq('id', initialData.id);

        if (error) throw error;
      } else {
        const { error } = await (supabase as any)
          .from('events')
          .insert([eventData]);

        if (error) throw error;
      }

      toast({
        title: isEdit ? 'Evento atualizado com sucesso' : 'Evento criado com sucesso',
        description: isEdit ? 'As informações do evento foram atualizadas.' : 'O novo evento foi adicionado ao sistema.',
      });

      onSuccess();
    } catch (error: any) {
      console.error('Erro ao salvar evento:', error);
      toast({
        title: 'Erro ao salvar evento',
        description: error.message || 'Ocorreu um erro ao salvar o evento. Tente novamente mais tarde.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>
          {isEdit ? 'Editar Evento' : 'Novo Evento'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="flex justify-end space-x-4 pb-4 border-b mb-4 bg-white sticky top-0 left-0 z-20">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Salvando...' : (isEdit ? 'Atualizar' : 'Criar Evento')}
            </Button>
          </div>
          <div className="max-h-[80vh] overflow-y-auto pr-2">
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="process_number">Número do Processo *</Label>
                  <Input
                    id="process_number"
                    {...register('process_number', { required: 'Campo obrigatório' })}
                    placeholder="Ex: 2024/001"
                  />
                  {errors.process_number && (
                    <p className="text-sm text-red-600">{errors.process_number.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ano">Ano</Label>
                  <Input
                    id="ano"
                    {...register('ano')}
                    placeholder="Ex: 2024"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="nome">Nome do Evento *</Label>
                <Textarea
                  id="nome"
                  {...register('nome', { required: 'Campo obrigatório' })}
                  placeholder="Descreva o nome do evento..."
                  rows={3}
                />
                {errors.nome && (
                  <p className="text-sm text-red-600">{errors.nome.message}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="municipio_nome">Município *</Label>
                  <Input
                    id="municipio_nome"
                    {...register('municipio_nome', { required: 'Campo obrigatório' })}
                    placeholder="Digite o nome do município"
                    list="municipalities-list"
                  />
                  <datalist id="municipalities-list">
                    {municipalities.map((municipality) => (
                      <option key={municipality.id} value={municipality.name} />
                    ))}
                  </datalist>
                  {errors.municipio_nome && (
                    <p className="text-sm text-red-600">{errors.municipio_nome.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nucleo_origem_texto">Núcleo de Origem</Label>
                  <Input
                    id="nucleo_origem_texto"
                    {...register('nucleo_origem_texto')}
                    placeholder="Digite o nome do núcleo"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="contrato_assinado">Status do Contrato *</Label>
                <Select
                  value={watch('contrato_assinado')}
                  onValueChange={(value) => {
                    setValue('contrato_assinado', value);
                    setContratoAssinado(value);
                    if (value !== 'sim') {
                      setValue('data_assinatura', '');
                    }
                  }}
                >
                  <SelectTrigger id="contrato_assinado">
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nao">Não assinado</SelectItem>
                    <SelectItem value="sim">Assinado</SelectItem>
                    <SelectItem value="arquivado">Arquivado</SelectItem>
                  </SelectContent>
                </Select>
                <input
                  type="hidden"
                  {...register('contrato_assinado', { required: 'Campo obrigatório' })}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="valor_concedente">Valor Concedente *</Label>
                  <Input
                    id="valor_concedente"
                    type="number"
                    step="0.01"
                    {...register('valor_concedente', { required: 'Campo obrigatório', min: 0 })}
                    placeholder="0.00"
                  />
                  {errors.valor_concedente && (
                    <p className="text-sm text-red-600">{errors.valor_concedente.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="valor_proponente">Valor Proponente *</Label>
                  <Input
                    id="valor_proponente"
                    type="number"
                    step="0.01"
                    {...register('valor_proponente', { required: 'Campo obrigatório', min: 0 })}
                    placeholder="0.00"
                  />
                  {errors.valor_proponente && (
                    <p className="text-sm text-red-600">{errors.valor_proponente.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="plano_de_trabalho_inicio">Início do Evento</Label>
                  <Input
                    id="plano_de_trabalho_inicio"
                    type="date"
                    {...register('plano_de_trabalho_inicio')}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="plano_de_trabalho_final">Fim do Evento</Label>
                  <Input
                    id="plano_de_trabalho_final"
                    type="date"
                    {...register('plano_de_trabalho_final')}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tipo">Tipo de Evento</Label>
                <Input
                  id="tipo"
                  {...register('tipo')}
                  placeholder="Ex: Cultural, Esportivo, etc."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tipo_de_repasse">Modalidade do Repasse</Label>
                <Select
                  value={watch('tipo_de_repasse') || undefined}
                  onValueChange={(value) => setValue('tipo_de_repasse', value)}
                >
                  <SelectTrigger id="tipo_de_repasse">
                    <SelectValue placeholder="Selecione a modalidade (opcional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Convênio">Convênio</SelectItem>
                    <SelectItem value="Convênio Simplificado">Convênio Simplificado</SelectItem>
                    <SelectItem value="Termo de Fomento">Termo de Fomento</SelectItem>
                    <SelectItem value="Patrocínio">Patrocínio</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="link_plataforma_governo">Link para Plataforma do Governo</Label>
                <Input
                  id="link_plataforma_governo"
                  type="url"
                  {...register('link_plataforma_governo')}
                  placeholder="https://plataforma.gov.br/evento/123"
                />
              </div>

              {/* Checkbox Contrato Assinado com Data de Assinatura */}
              <div className="mt-6 p-4 border-2 border-primary/30 rounded-lg bg-primary/5">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id="contrato_assinado_check"
                      checked={contratoAssinado === 'sim'}
                      onCheckedChange={(checked) => {
                        const newValue = checked ? 'sim' : 'nao';
                        setContratoAssinado(newValue);
                        setValue('contrato_assinado', newValue);
                        if (!checked) {
                          setValue('data_assinatura', '');
                        }
                      }}
                      className="h-5 w-5"
                    />
                    <Label htmlFor="contrato_assinado_check" className="text-base font-semibold cursor-pointer">
                      Contrato Assinado
                </Label>
                  </div>
                  {contratoAssinado === 'sim' && (
                    <div className="flex-1 max-w-xs">
                      <Label htmlFor="data_assinatura" className="text-sm">Data de Assinatura *</Label>
                      <Input
                        id="data_assinatura"
                        type="date"
                        {...register('data_assinatura', { required: 'Campo obrigatório ao marcar "Contrato Assinado"' })}
                        className="mt-1"
                      />
                      {errors.data_assinatura && (
                        <p className="text-sm text-red-600 mt-1">{errors.data_assinatura.message}</p>
                      )}
                    </div>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-1 ml-8">
                  Marque se o contrato deste evento já foi assinado
                </p>
              </div>

              {/* Checkbox Em prestação de contas */}
              <div className="mt-6 p-4 border-2 border-primary/30 rounded-lg bg-primary/5">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id="em_prestacao_contas"
                      checked={emPrestacaoContas}
                      onCheckedChange={(checked) => {
                        setEmPrestacaoContas(!!checked);
                        if (!checked) {
                          setValue('data_prestacao_contas', '');
                        }
                      }}
                      className="h-5 w-5"
                    />
                    <Label htmlFor="em_prestacao_contas" className="text-base font-semibold cursor-pointer">
                      Em prestação de contas?
                    </Label>
                  </div>
                  {emPrestacaoContas && (
                    <div className="flex-1 max-w-xs">
                      <Label htmlFor="data_prestacao_contas" className="text-sm">Data de entrada em prestação de contas *</Label>
                      <Input
                        id="data_prestacao_contas"
                        type="date"
                        {...register('data_prestacao_contas', { required: 'Campo obrigatório ao marcar "Em prestação de contas"' })}
                        className="mt-1"
                      />
                      {errors.data_prestacao_contas && (
                        <p className="text-sm text-red-600 mt-1">{errors.data_prestacao_contas.message}</p>
                      )}
                    </div>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-1 ml-8">
                  Marque se o evento está em fase de prestação de contas
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="numero_transferencia_especial">Número da Transferência Especial</Label>
                <Input
                  id="numero_transferencia_especial"
                  {...register('numero_transferencia_especial')}
                  placeholder="Ex: TE-001/2024"
                />
              </div>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
