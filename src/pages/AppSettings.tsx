
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useTheme } from '@/hooks/useTheme';
import { useTechnicalAuth } from '@/hooks/useTechnicalAuth';
import { Settings, Monitor, Palette, Type, Layout, LogOut } from 'lucide-react';

export default function AppSettings() {
  const { theme, layoutPosition, fontSize, setTheme, setLayoutPosition, setFontSize } = useTheme();
  const { isAuthenticated, signOut } = useTechnicalAuth();

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <Settings className="h-6 w-6 mr-2" />
        <h1 className="text-2xl font-bold text-gray-900">Configurações</h1>
      </div>

      <div className="grid gap-6">
        {/* Configurações de Layout */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Layout className="h-5 w-5 mr-2" />
              Layout e Navegação
            </CardTitle>
            <CardDescription>
              Configure a aparência e posicionamento do menu de navegação
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="layout-position">Posição do Menu</Label>
              <Select value={layoutPosition} onValueChange={setLayoutPosition}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a posição do menu" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sidebar">Barra Lateral (Esquerda)</SelectItem>
                  <SelectItem value="top">Barra Superior</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Configurações de Tema */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Palette className="h-5 w-5 mr-2" />
              Aparência
            </CardTitle>
            <CardDescription>
              Personalize o tema e cores da interface
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="dark-mode">Modo Escuro</Label>
                <p className="text-sm text-gray-600">
                  Alterna entre modo claro e escuro
                </p>
              </div>
              <Switch
                id="dark-mode"
                checked={theme === 'dark'}
                onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
              />
            </div>
          </CardContent>
        </Card>

        {/* Configurações de Tipografia */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Type className="h-5 w-5 mr-2" />
              Tipografia
            </CardTitle>
            <CardDescription>
              Ajuste o tamanho da fonte para melhor legibilidade
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="font-size">Tamanho da Fonte</Label>
              <Select value={fontSize} onValueChange={setFontSize}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tamanho da fonte" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="small">Pequena</SelectItem>
                  <SelectItem value="medium">Média</SelectItem>
                  <SelectItem value="large">Grande</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Área Técnica */}
        {isAuthenticated && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Monitor className="h-5 w-5 mr-2" />
                Área Técnica
              </CardTitle>
              <CardDescription>
                Configurações e ações para usuários técnicos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Status de Autenticação</Label>
                  <p className="text-sm text-green-600">
                    Conectado como usuário técnico
                  </p>
                </div>
                <Button variant="outline" onClick={signOut}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Sair da Área Técnica
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Informações do Sistema */}
        <Card>
          <CardHeader>
            <CardTitle>Sobre o Sistema</CardTitle>
            <CardDescription>
              Informações sobre o Transfer Radar SC
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <Label>Versão:</Label>
                <p className="text-gray-600">1.0.0</p>
              </div>
              <div>
                <Label>Desenvolvido por:</Label>
                <p className="text-gray-600">GEINFRA</p>
              </div>
              <div>
                <Label>Última Atualização:</Label>
                <p className="text-gray-600">Julho 2025</p>
              </div>
              <div>
                <Label>Suporte Técnico:</Label>
                <p className="text-gray-600">GEINFRA/SETUR</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
