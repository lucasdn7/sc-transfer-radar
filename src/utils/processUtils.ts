


export const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

export const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('pt-BR');
};

export const getStatusColor = (status: string) => {
  const colors = {
    'TEV': 'bg-blue-100 text-blue-800',
    'Em tramitação': 'bg-yellow-100 text-yellow-800',
    'Concluído': 'bg-green-100 text-green-800',
    'Convênio Simplificado': 'bg-purple-100 text-purple-800',
    'Diligência': 'bg-red-100 text-red-800'
  } as const;
  return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
};

export const getStatusLabel = (status: string) => {
  // The status values are already in Portuguese, so we can return them directly
  return status;
};
