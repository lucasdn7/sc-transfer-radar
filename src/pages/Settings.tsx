import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Settings as SettingsIcon, Users, Bell, Database } from 'lucide-react';

export default function Settings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: settings = [], isLoading } = useQuery({
    queryKey: ['system-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('system_settings')
        .select('*')
        .order('setting_key');
      
      if (error) throw error;
      return data;
    },
  });

  const { data: profiles = [] } = useQuery({
    queryKey: ['user-profiles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  const updateSettingMutation = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: any }) => {
      const { error } = await supabase
        .from('system_settings')
        .update({ setting_value: value })
        .eq('setting_key', key);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-settings'] });
      toast({
        title: 'Configuração atualizada',
        description: 'A configuração foi salva com sucesso.',
      });
    },
  });

  const updateUserRoleMutation = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      const { error } = await supabase
        .from('profiles')
        .update({ role })
        .eq('id', userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-profiles'] });
      toast({
        title: 'Permissão atualizada',
        description: 'A permissão do usuário foi atualizada.',
      });
    },
  });

  const createNotificationsMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc('create_expiration_notifications');
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: 'Notificações criadas',
        description: 'Notificações de vencimento foram geradas.',
      });
    },
  });

  const handleSettingUpdate = (key: string, value: string) => {
    updateSettingMutation.mutate({ key, value: JSON.stringify(value) });
  };

  const getSettingValue = (settingValue: any): string => {
    if (typeof settingValue === 'string') {
      try {
        return JSON.parse(settingValue);
      } catch {
        return settingValue;
      }
    }
    return String(settingValue);
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800';
      case 'technical':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <SettingsIcon className="h-6 w-6 mr-2" />
        <h1 className="text-2xl font-bold text-gray-900">Configurações do Sistema</h1>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general">Geral</TabsTrigger>
          <TabsTrigger value="users">Usuários</TabsTrigger>
          <TabsTrigger value="notifications">Notificações</TabsTrigger>
          <TabsTrigger value="database">Banco de Dados</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configurações Gerais</CardTitle>
              <CardDescription>
                Configure as informações básicas do sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {settings.map((setting) => (
                <div key={setting.setting_key} className="space-y-2">
                  <Label htmlFor={setting.setting_key}>
                    {setting.description || setting.setting_key}
                  </Label>
                  <div className="flex space-x-2">
                    <Input
                      id={setting.setting_key}
                      defaultValue={getSettingValue(setting.setting_value)}
                      onBlur={(e) => handleSettingUpdate(setting.setting_key, e.target.value)}
                    />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Gerenciar Usuários
              </CardTitle>
              <CardDescription>
                Gerencie permissões e roles dos usuários do sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {profiles.map((profile) => (
                  <div key={profile.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <h3 className="font-medium">{profile.full_name || 'Sem nome'}</h3>
                      <p className="text-sm text-gray-600">{profile.email}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={getRoleColor(profile.role)}>
                        {profile.role === 'admin' ? 'Administrador' :
                         profile.role === 'technical' ? 'Técnico' : 'Visualizador'}
                      </Badge>
                      <select
                        value={profile.role}
                        onChange={(e) => updateUserRoleMutation.mutate({
                          userId: profile.id,
                          role: e.target.value
                        })}
                        className="text-sm border rounded p-1"
                      >
                        <option value="viewer">Visualizador</option>
                        <option value="technical">Técnico</option>
                        <option value="admin">Administrador</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Bell className="h-5 w-5 mr-2" />
                Sistema de Notificações
              </CardTitle>
              <CardDescription>
                Configure e gerencie as notificações do sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div>
                  <Label>Intervalos de Notificação</Label>
                  <p className="text-sm text-gray-600 mb-2">
                    Notificações são enviadas automaticamente nos seguintes intervalos antes do vencimento:
                  </p>
                  <div className="flex space-x-2">
                    <Badge>30 dias</Badge>
                    <Badge>15 dias</Badge>
                    <Badge>7 dias</Badge>
                  </div>
                </div>

                <div className="pt-4">
                  <Button
                    onClick={() => createNotificationsMutation.mutate()}
                    disabled={createNotificationsMutation.isPending}
                  >
                    {createNotificationsMutation.isPending 
                      ? 'Gerando...' 
                      : 'Gerar Notificações de Vencimento'
                    }
                  </Button>
                  <p className="text-sm text-gray-600 mt-2">
                    Clique para gerar notificações para processos próximos ao vencimento.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="database" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Database className="h-5 w-5 mr-2" />
                Informações do Banco de Dados
              </CardTitle>
              <CardDescription>
                Estatísticas e informações sobre o banco de dados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-900">Conectividade</h4>
                  <p className="text-sm text-blue-700">Sistema conectado ao Supabase</p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <h4 className="font-medium text-green-900">RLS Ativo</h4>
                  <p className="text-sm text-green-700">Segurança por linha habilitada</p>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg">
                  <h4 className="font-medium text-purple-900">Backup</h4>
                  <p className="text-sm text-purple-700">Backup automático ativo</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
