
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Key, ExternalLink } from 'lucide-react';

interface MapboxTokenFormProps {
  onTokenSave: (token: string) => void;
}

export function MapboxTokenForm({ onTokenSave }: MapboxTokenFormProps) {
  const [token, setToken] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!token.trim()) {
      setError('Por favor, insira sua chave API do Mapbox');
      return;
    }

    if (!token.startsWith('pk.')) {
      setError('A chave pública do Mapbox deve começar com "pk."');
      return;
    }

    try {
      onTokenSave(token);
      setError('');
    } catch (error) {
      setError('Erro ao salvar a chave API');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <Key className="h-5 w-5" />
            Configurar Mapbox
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertDescription>
              Para usar o mapa interativo, você precisa inserir sua chave pública do Mapbox.
            </AlertDescription>
          </Alert>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="token">Chave Pública do Mapbox</Label>
              <Input
                id="token"
                type="password"
                placeholder="pk.ey..."
                value={token}
                onChange={(e) => setToken(e.target.value)}
                className="font-mono"
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full">
              Salvar Chave API
            </Button>
          </form>

          <div className="text-center">
            <a
              href="https://account.mapbox.com/access-tokens/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
            >
              <ExternalLink className="h-4 w-4" />
              Obter chave no Mapbox
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
