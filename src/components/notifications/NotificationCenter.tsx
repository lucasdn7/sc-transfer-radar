
import { useState } from 'react';
import { Bell, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface Notification {
  id: number;
  message: string;
  type: 'critical' | 'important' | 'informative';
  is_read: boolean;
  created_at: string;
}

export function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const { isTechnical } = useAuth();
  const queryClient = useQueryClient();

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: async (): Promise<Notification[]> => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      return data || [];
    },
    enabled: isTechnical,
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: number) => {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'critical':
        return 'bg-red-100 border-red-200 text-red-800';
      case 'important':
        return 'bg-yellow-100 border-yellow-200 text-yellow-800';
      default:
        return 'bg-blue-100 border-blue-200 text-blue-800';
    }
  };

  if (!isTechnical) {
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
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <Badge
            variant="destructive"
            className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </Button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-96 max-h-96 overflow-auto bg-white border rounded-lg shadow-lg z-50">
          <div className="p-4 border-b">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Notificações</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {isLoading ? (
              <div className="p-4 text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                Nenhuma notificação
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-3 border-b cursor-pointer hover:bg-gray-50 ${
                    !notification.is_read ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => {
                    if (!notification.is_read) {
                      markAsReadMutation.mutate(notification.id);
                    }
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm text-gray-900 mb-1">
                        {notification.message}
                      </p>
                      <div className="flex items-center space-x-2">
                        <Badge className={getNotificationColor(notification.type)}>
                          {notification.type === 'critical' ? 'Crítico' :
                           notification.type === 'important' ? 'Importante' : 'Info'}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {new Date(notification.created_at).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    </div>
                    {!notification.is_read && (
                      <div className="w-2 h-2 bg-blue-600 rounded-full ml-2 mt-1"></div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
