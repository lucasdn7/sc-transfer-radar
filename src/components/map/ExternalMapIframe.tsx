import { useState, useEffect, useRef } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ExternalMapIframeProps {
  mapUrl?: string;
  onLoad?: () => void;
  onError?: () => void;
}

export function ExternalMapIframe({ 
  mapUrl = import.meta.env.VITE_MAPA_URL || 'https://mapa-de-convenios.vercel.app/',
  onLoad,
  onError 
}: ExternalMapIframeProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    // Limpar timeout anterior se existir
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Definir timeout de 30 segundos para carregamento
    timeoutRef.current = setTimeout(() => {
      if (!hasLoaded && isLoading) {
        console.warn('Mapa externo não carregou dentro do tempo limite');
        setHasError(true);
        setIsLoading(false);
        onError?.();
      }
    }, 30000);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isLoading, hasLoaded, onError]);

  const handleLoad = () => {
    console.log('Mapa externo carregado com sucesso');
    setIsLoading(false);
    setHasLoaded(true);
    setHasError(false);
    onLoad?.();
  };

  const handleError = () => {
    console.error('Erro ao carregar mapa externo');
    setHasError(true);
    setIsLoading(false);
    onError?.();
  };

  const handleRetry = () => {
    setHasError(false);
    setIsLoading(true);
    setHasLoaded(false);
    
    // Recarregar o iframe
    if (iframeRef.current) {
      iframeRef.current.src = mapUrl;
    }
  };

  if (hasError) {
    return (
      <div className="w-full h-full flex items-center justify-center p-6">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erro ao carregar mapa</AlertTitle>
          <AlertDescription>
            Não foi possível carregar o mapa no momento. Verifique sua conexão com a internet ou tente novamente mais tarde.
          </AlertDescription>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRetry}
            className="mt-4"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Tentar novamente
          </Button>
        </Alert>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative">
      {isLoading && (
        <div className="absolute inset-0 z-10">
          <Skeleton className="w-full h-full" />
        </div>
      )}
      
      <iframe
        ref={iframeRef}
        src={mapUrl}
        className="w-full h-full border-0"
        onLoad={handleLoad}
        onError={handleError}
        sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-pointer-lock"
        allow="geolocation; accelerometer; gyroscope"
        title="Mapa Interativo de Convênios"
        loading="lazy"
      />
    </div>
  );
}