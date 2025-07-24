import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Map, Key, ExternalLink, AlertCircle, CheckCircle } from "lucide-react";

interface MapTilesTokenFormProps {
  onTokenSave: (token: string) => boolean;
  onCancel?: () => void;
  initialToken?: string;
}

export function MapTilesTokenForm({ onTokenSave, onCancel, initialToken = "" }: MapTilesTokenFormProps) {
  const [token, setToken] = useState(initialToken);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const trimmedToken = token.trim();
      
      if (!trimmedToken) {
        setError("Por favor, insira um token válido.");
        return;
      }

      if (trimmedToken.length < 10) {
        setError("Token muito curto. Verifique se copiou corretamente a chave API do MapTiles.");
        return;
      }

      const success = onTokenSave(trimmedToken);
      
      if (success) {
        setSuccess(true);
        setTimeout(() => {
          onCancel?.();
        }, 1500);
      } else {
        setError("Falha ao salvar o token. Tente novamente.");
      }
    } catch (err) {
      setError("Erro inesperado ao salvar token.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestToken = () => {
    window.open('https://cloud.maptiler.com/account/keys/', '_blank');
  };

  return (
    <div className="flex items-center justify-center min-h-[600px] p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
            <Map className="h-6 w-6 text-blue-600" />
          </div>
          <CardTitle className="text-2xl">Configurar MapTiles</CardTitle>
          <p className="text-muted-foreground">
            Configure sua chave API do MapTiles para visualizar o mapa interativo
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {success && (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Token configurado com sucesso! Redirecionando...
              </AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <div className="rounded-lg bg-blue-50 p-4">
              <h3 className="font-semibold text-blue-900 mb-2">Como obter sua chave API do MapTiles:</h3>
              <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800">
                <li>Acesse <a href="https://cloud.maptiler.com/" target="_blank" rel="noopener noreferrer" className="underline hover:no-underline">MapTiler Cloud</a></li>
                <li>Crie uma conta gratuita ou faça login</li>
                <li>Vá para a seção "Account" → "Keys"</li>
                <li>Copie sua chave API padrão ou crie uma nova</li>
                <li>Cole a chave no campo abaixo</li>
              </ol>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-3 text-blue-700 border-blue-200 hover:bg-blue-100"
                onClick={handleTestToken}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Abrir MapTiler Cloud
              </Button>
            </div>

            <Separator />

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="token" className="flex items-center gap-2">
                  <Key className="h-4 w-4" />
                  Chave API do MapTiles
                </Label>
                <Input
                  id="token"
                  type="password"
                  placeholder="Cole sua chave API do MapTiles aqui..."
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  disabled={isLoading || success}
                  className="font-mono"
                />
                <p className="text-xs text-muted-foreground">
                  Sua chave será armazenada localmente no navegador e não será compartilhada.
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <Button 
                  type="submit" 
                  disabled={isLoading || success || !token.trim()}
                  className="flex-1"
                >
                  {isLoading ? "Salvando..." : success ? "Salvo!" : "Salvar Token"}
                </Button>
                {onCancel && (
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={onCancel}
                    disabled={isLoading || success}
                  >
                    Cancelar
                  </Button>
                )}
              </div>
            </form>
          </div>

          <div className="text-center pt-4 border-t">
            <p className="text-xs text-muted-foreground">
              O MapTiles oferece 100.000 carregamentos de mapa gratuitos por mês.
              <br />
              Perfeito para projetos pequenos e médios.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}