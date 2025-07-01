import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface RegionalNucleusFormData {
  id?: number;
  name: string;
  acronym: string;
  geographic_region?: string;
  technical_responsible_name?: string;
  phone?: string;
  email?: string;
  observations?: string;
}

interface RegionalNucleusFormProps {
  onSuccess: () => void;
  onCancel: () => void;
  initialData?: Partial<RegionalNucleusFormData>;
  isEdit?: boolean;
}

export function RegionalNucleusForm({ onSuccess, onCancel, initialData, isEdit = false }: RegionalNucleusFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  
  const { register, handleSubmit, formState: { errors } } = useForm<RegionalNucleusFormData>({
    defaultValues: initialData || {},
  });

  const onSubmit = async (data: RegionalNucleusFormData) => {
    setIsSubmitting(true);
    
    try {
      if (isEdit && initialData?.id) {
        const { error } = await supabase
          .from('regional_nuclei')
          .update(data)
          .eq('id', initialData.id);

        if (error) throw error;
        
        toast({
          title: 'Núcleo regional atualizado com sucesso',
          description: 'As informações do núcleo regional foram atualizadas.',
        });
      } else {
        const { error } = await supabase
          .from('regional_nuclei')
          .insert([data]);

        if (error) throw error;
        
        toast({
          title: 'Núcleo regional criado com sucesso',
          description: 'O novo núcleo regional foi adicionado ao sistema.',
        });
      }

      onSuccess();
    } catch (error: any) {
      toast({
        title: 'Erro ao salvar núcleo regional',
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
          {isEdit ? 'Editar Núcleo Regional' : 'Novo Núcleo Regional'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                {...register('name', { required: 'Campo obrigatório' })}
                placeholder="Nome do núcleo regional"
              />
              {errors.name && (
                <p className="text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="acronym">Sigla *</Label>
              <Input
                id="acronym"
                {...register('acronym', { required: 'Campo obrigatório' })}
                placeholder="Ex: NR01"
              />
              {errors.acronym && (
                <p className="text-sm text-red-600">{errors.acronym.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="geographic_region">Região Geográfica</Label>
            <Input
              id="geographic_region"
              {...register('geographic_region')}
              placeholder="Ex: Grande Florianópolis"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="technical_responsible_name">Responsável Técnico</Label>
            <Input
              id="technical_responsible_name"
              {...register('technical_responsible_name')}
              placeholder="Nome do responsável técnico"
            />
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
                placeholder="contato@nucleo.sc.gov.br"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="observations">Observações</Label>
            <Textarea
              id="observations"
              {...register('observations')}
              placeholder="Observações sobre o núcleo regional..."
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-4 pt-4">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Salvando...' : (isEdit ? 'Atualizar' : 'Criar Núcleo')}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
