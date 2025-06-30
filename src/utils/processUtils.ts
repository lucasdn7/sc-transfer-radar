
import type { Database } from "@/integrations/supabase/types";

type ProcessStatus = Database['public']['Enums']['process_status'];

export const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

export const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('pt-BR');
};

export const getStatusColor = (status: ProcessStatus) => {
  const colors = {
    'created': 'bg-blue-100 text-blue-800',
    'in_analysis': 'bg-yellow-100 text-yellow-800',
    'approved': 'bg-green-100 text-green-800',
    'in_execution': 'bg-purple-100 text-purple-800',
    'finished': 'bg-gray-100 text-gray-800',
    'cancelled': 'bg-red-100 text-red-800'
  } as const;
  return colors[status] || 'bg-gray-100 text-gray-800';
};

export const getStatusLabel = (status: ProcessStatus) => {
  const labels = {
    'created': 'Criado',
    'in_analysis': 'Em Análise',
    'approved': 'Aprovado',
    'in_execution': 'Em Execução',
    'finished': 'Finalizado',
    'cancelled': 'Cancelado'
  } as const;
  return labels[status] || status;
};
