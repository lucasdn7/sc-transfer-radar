
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

interface MunicipalityFormData {
  name: string;
  cnpj: string;
  region?: string;
  regional_nucleus_id?: number;
  mayor_name?: string;
  secretary_name?: string;
  phone?: string;
  email?: string;
  population?: number;
  classification?: string;
}

interface MunicipalityFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  initialData?: Partial<MunicipalityFormData>;
  isEdit?: boolean;
}

export function MunicipalityForm({ onSuccess, onCancel, initialData, isEdit = false }: MunicipalityFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  
  const { register, handleSubmit, setValue, formState: { errors } } = useForm<MunicipalityFormData>({
    defaultValues: initialData || {},
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

  const onSubmit = async (data: MunicipalityFormData) => {
    setIsSubmitting(true);
    
    try {
      const municipalityData = {
        ...data,
        regional_nucleus_id: data.regional_nucleus_id ? Number(data.regional_nucleus_id) : null,
        population: data.population ? Number(data.population) : null,
      };

      if (isEdit && initialData?.id) {
        const { error } = await supabase
          .from('municipalities')
          .update(municipalityData)
          .eq('id', initialData.id);

        if (error) throw error;
        
        toast({
          title: 'Município atualizado com sucesso',
          description: 'As informações do município foram atualizadas.',
        });
      } else {
        const { error } = await supabase
          .from('municipalities')
          .insert([municipalityData]);

        if (error) throw error;
        
        toast({
          title: 'Município criado com sucesso',
          description: 'O novo município foi adicionado ao sistema.',
        });
      }

      onSuccess();
    } catch (error: any) {
      toast({
        title: 'Erro ao salvar município',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>
          {isEdit ? 'Editar Município' : 'Novo Município'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome do Município *</Label>
              <Input
                id="name"
                {...register('name', { required: 'Campo obrigatório' })}
                placeholder="Nome do município"
              />
              {errors.name && (
                <p className="text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="cnpj">CNPJ *</Label>
              <Input
                id="cnpj"
                {...register('cnpj', { required: 'Campo obrigatório' })}
                placeholder="00.000.000/0000-00"
              />
              {errors.cnpj && (
                <p className="text-sm text-red-600">{errors.cnpj.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="region">Região</Label>
              <Input
                id="region"
                {...register('region')}
                placeholder="Ex: Grande Florianópolis"
              />
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="mayor_name">Nome do Prefeito</Label>
              <Input
                id="mayor_name"
                {...register('mayor_name')}
                placeholder="Nome completo do prefeito"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="secretary_name">Nome do Secretário</Label>
              <Input
                id="secretary_name"
                {...register('secretary_name')}
                placeholder="Nome do secretário responsável"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                {...register('phone')}
                placeholder="(48) 9999-9999"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                {...register('email')}
                placeholder="contato@municipio.sc.gov.br"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="population">População</Label>
              <Input
                id="population"
                type="number"
                min="0"
                {...register('population', { valueAsNumber: true })}
                placeholder="Número de habitantes"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="classification">Classificação</Label>
              <Input
                id="classification"
                {...register('classification')}
                placeholder="Ex: Pequeno Porte"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-4 pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Salvando...' : (isEdit ? 'Atualizar' : 'Criar Município')}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
