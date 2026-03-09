
import { useState } from 'react';
import { Bell, X, AlertCircle, Info, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const { isAuthenticated } = useAuth();

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
    refetchInterval: 10000,
  });

  const unreadCount = notifications?.filter(n => !n.is_read).length || 0;

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
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
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
                      <div className="font-medium truncate">{'Notificação'}</div>
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
              <div className="text-sm text-gray-500">Nenhuma notificação</div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
