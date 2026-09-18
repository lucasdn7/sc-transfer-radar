
import { useState } from 'react';
import { Bell, X, AlertCircle, Info, CheckCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';

export function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  const { data: notifications, isLoading, refetch } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);
      if (error) throw error;
      return data || [];
    },
    enabled: isAuthenticated,
    refetchInterval: 30000, // Refetch a cada 30 segundos
  });

  const unreadCount = notifications?.filter(n => !n.is_read).length || 0;

  // Mutation para disparar notificações de vencimento
  const triggerExpirationNotifications = useMutation({
    mutationFn: async () => {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const response = await fetch(`${API_URL}/api/notifications/expiration`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Erro ao disparar notificações de vencimento');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Notificações criadas',
        description: `${data.notifications?.length || 0} notificações de vencimento foram criadas.`,
      });
      refetch();
    },
    onError: (error) => {
      toast({
        title: 'Erro ao criar notificações',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Função para marcar como lida
  const markAsRead = async (id: number) => {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    refetch();
  };

  // Ícone por tipo
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'critical': return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'important': return <Bell className="h-4 w-4 text-orange-500" />;
      case 'informative': return <Info className="h-4 w-4 text-blue-500" />;
      default: return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
  };

  // Título por tipo
  const getNotificationTitle = (type: string) => {
    switch (type) {
      case 'critical': return 'Vencimento Crítico';
      case 'important': return 'Vencimento Próximo';
      case 'informative': return 'Informação';
      default: return 'Notificação';
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="relative"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs"
          >
            {unreadCount}
          </Badge>
        )}
      </Button>

      {isOpen && (
        <Card className="absolute right-0 top-full mt-2 w-96 z-50 shadow-lg">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Notificações</CardTitle>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => triggerExpirationNotifications.mutate()}
                disabled={triggerExpirationNotifications.isPending}
                title="Disparar notificações de vencimento"
              >
                <RefreshCw className={`h-4 w-4 ${triggerExpirationNotifications.isPending ? 'animate-spin' : ''}`} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="text-sm text-gray-500">Carregando...</div>
            ) : notifications && notifications.length > 0 ? (
              <div className="space-y-2">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-2 rounded text-sm flex gap-2 items-start ${!notification.is_read ? 'bg-blue-50' : 'bg-gray-50'}`}
                  >
                    <div className="pt-1">{getNotificationIcon(notification.type)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{getNotificationTitle(notification.type)}</div>
                      <div className="text-xs text-gray-700 truncate">{notification.message}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {new Date(notification.created_at).toLocaleString('pt-BR')}
                      </div>
                    </div>
                    {!notification.is_read && (
                      <Button size="icon" variant="ghost" onClick={() => markAsRead(notification.id)} title="Marcar como lida">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-gray-500 text-center py-4">
                Nenhuma notificação
                <div className="mt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => triggerExpirationNotifications.mutate()}
                    disabled={triggerExpirationNotifications.isPending}
                  >
                    <RefreshCw className={`h-4 w-4 mr-2 ${triggerExpirationNotifications.isPending ? 'animate-spin' : ''}`} />
                    Verificar vencimentos
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
