
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

interface ProcessFormData {
  process_number: string;
  object: string;
  municipality_id: number;
  regional_nucleus_id?: number;
  total_portaria_value: number;
  total_concedente_value: number;
  total_proponente_value: number;
  licitado_value?: number;
  vigencia_date: string;
  current_status: string;
  portaria_number?: string;
  latitude?: number;
  longitude?: number;
}

interface ProcessFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  initialData?: Partial<ProcessFormData>;
  isEdit?: boolean;
}

export function ProcessForm({ onSuccess, onCancel, initialData, isEdit = false }: ProcessFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  
  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<ProcessFormData>({
    defaultValues: initialData || {
      current_status: 'created',
    },
  });

  const { data: municipalities = [] } = useQuery({
    queryKey: ['municipalities'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('municipalities')
        .select('id, name')
        .order('name');
      
      if (error) throw error;
      return data;
    },
  });

  const { data: regionalNuclei = [] } = useQuery({
    queryKey: ['regional-nuclei'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('regional_nuclei')
        .select('id, name, acronym')
        .order('name');
      
      if (error) throw error;
      return data;
    },
  });

  const statusOptions = [
    { value: 'created', label: 'Criado' },
    { value: 'in_analysis', label: 'Em Análise' },
    { value: 'approved', label: 'Aprovado' },
    { value: 'in_execution', label: 'Em Execução' },
    { value: 'finished', label: 'Finalizado' },
    { value: 'cancelled', label: 'Cancelado' },
  ];

  const onSubmit = async (data: ProcessFormData) => {
    setIsSubmitting(true);
    
    try {
      const processData = {
        ...data,
        municipality_id: Number(data.municipality_id),
        regional_nucleus_id: data.regional_nucleus_id ? Number(data.regional_nucleus_id) : null,
        total_portaria_value: Number(data.total_portaria_value),
        total_concedente_value: Number(data.total_concedente_value),
        total_proponente_value: Number(data.total_proponente_value),
        licitado_value: data.licitado_value ? Number(data.licitado_value) : null,
        latitude: data.latitude ? Number(data.latitude) : null,
        longitude: data.longitude ? Number(data.longitude) : null,
      };

      if (isEdit && initialData?.id) {
        const { error } = await supabase
          .from('processes')
          .update(processData)
          .eq('id', initialData.id);

        if (error) throw error;
        
        toast({
          title: 'Processo atualizado com sucesso',
          description: 'As informações do processo foram atualizadas.',
        });
      } else {
        const { error } = await supabase
          .from('processes')
          .insert([processData]);

        if (error) throw error;
        
        toast({
          title: 'Processo criado com sucesso',
          description: 'O novo processo foi adicionado ao sistema.',
        });
      }

      onSuccess();
    } catch (error: any) {
      toast({
        title: 'Erro ao salvar processo',
        description: error.message,
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
          {isEdit ? 'Editar Processo' : 'Novo Processo'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="process_number">Número do Processo *</Label>
              <Input
                id="process_number"
                {...register('process_number', { required: 'Campo obrigatório' })}
                placeholder="Ex: 2024.0001.00001"
              />
              {errors.process_number && (
                <p className="text-sm text-red-600">{errors.process_number.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="portaria_number">Número da Portaria</Label>
              <Input
                id="portaria_number"
                {...register('portaria_number')}
                placeholder="Ex: 001/2024"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="object">Objeto *</Label>
            <Textarea
              id="object"
              {...register('object', { required: 'Campo obrigatório' })}
              placeholder="Descreva o objeto do processo..."
              rows={3}
            />
            {errors.object && (
              <p className="text-sm text-red-600">{errors.object.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="municipality_id">Município *</Label>
              <Select onValueChange={(value) => setValue('municipality_id', Number(value))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o município" />
                </SelectTrigger>
                <SelectContent>
                  {municipalities.map((municipality) => (
                    <SelectItem key={municipality.id} value={municipality.id.toString()}>
                      {municipality.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="regional_nucleus_id">Núcleo Regional</Label>
              <Select onValueChange={(value) => setValue('regional_nucleus_id', Number(value))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o núcleo regional" />
                </SelectTrigger>
                <SelectContent>
                  {regionalNuclei.map((nucleus) => (
                    <SelectItem key={nucleus.id} value={nucleus.id.toString()}>
                      {nucleus.acronym} - {nucleus.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="total_portaria_value">Valor Total da Portaria (R$) *</Label>
              <Input
                id="total_portaria_value"
                type="number"
                step="0.01"
                min="0"
                {...register('total_portaria_value', { 
                  required: 'Campo obrigatório',
                  valueAsNumber: true 
                })}
              />
              {errors.total_portaria_value && (
                <p className="text-sm text-red-600">{errors.total_portaria_value.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="total_concedente_value">Valor Concedente (R$) *</Label>
              <Input
                id="total_concedente_value"
                type="number"
                step="0.01"
                min="0"
                {...register('total_concedente_value', { 
                  required: 'Campo obrigatório',
                  valueAsNumber: true 
                })}
              />
              {errors.total_concedente_value && (
                <p className="text-sm text-red-600">{errors.total_concedente_value.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="total_proponente_value">Valor Proponente (R$) *</Label>
              <Input
                id="total_proponente_value"
                type="number"
                step="0.01"
                min="0"
                {...register('total_proponente_value', { 
                  required: 'Campo obrigatório',
                  valueAsNumber: true 
                })}
              />
              {errors.total_proponente_value && (
                <p className="text-sm text-red-600">{errors.total_proponente_value.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="licitado_value">Valor Licitado (R$)</Label>
              <Input
                id="licitado_value"
                type="number"
                step="0.01"
                min="0"
                {...register('licitado_value', { valueAsNumber: true })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="vigencia_date">Data de Vigência *</Label>
              <Input
                id="vigencia_date"
                type="date"
                {...register('vigencia_date', { required: 'Campo obrigatório' })}
              />
              {errors.vigencia_date && (
                <p className="text-sm text-red-600">{errors.vigencia_date.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="current_status">Status *</Label>
              <Select 
                onValueChange={(value) => setValue('current_status', value)}
                defaultValue={watch('current_status')}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="latitude">Latitude</Label>
              <Input
                id="latitude"
                type="number"
                step="any"
                {...register('latitude', { valueAsNumber: true })}
                placeholder="Ex: -27.5954"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="longitude">Longitude</Label>
              <Input
                id="longitude"
                type="number"
                step="any"
                {...register('longitude', { valueAsNumber: true })}
                placeholder="Ex: -48.5480"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-4 pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Salvando...' : (isEdit ? 'Atualizar' : 'Criar Processo')}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
