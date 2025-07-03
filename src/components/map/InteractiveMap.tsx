
import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Button } from '@/components/ui/button';
import { Settings, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface InteractiveMapProps {
  token: string;
  mapStyle: string;
  showLabels: boolean;
  onConfigureToken: () => void;
}

export function InteractiveMap({ token, mapStyle, showLabels, onConfigureToken }: InteractiveMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);

  useEffect(() => {
    if (!mapContainer.current || !token || isInitializing) return;

    // Limpar mapa existente
    if (map.current) {
      map.current.remove();
      map.current = null;
    }

    setIsInitializing(true);
    setError(null);
    setIsLoaded(false);

    try {
      // Verificar se o token é válido
      if (!token.startsWith('pk.')) {
        throw new Error('Token inválido. Deve começar com "pk."');
      }

      mapboxgl.accessToken = token;

      // Verificar suporte ao WebGL
      if (!mapboxgl.supported()) {
        throw new Error('Seu navegador não suporta WebGL, necessário para o Mapbox');
      }

      // Configurar estilos baseado na seleção
      const styleMap: { [key: string]: string } = {
        satellite: 'mapbox://styles/mapbox/satellite-v9',
        street: 'mapbox://styles/mapbox/streets-v12',
        terrain: 'mapbox://styles/mapbox/outdoors-v12',
        dark: 'mapbox://styles/mapbox/dark-v11'
      };

      const mapInstance = new mapboxgl.Map({
        container: mapContainer.current,
        style: styleMap[mapStyle] || styleMap.satellite,
        center: [-48.5482, -27.5954], // Centro de Santa Catarina
        zoom: 7,
        pitch: 0, // Reduzir pitch inicial para evitar problemas de WebGL
        bearing: 0,
        antialias: true,
        failIfMajorPerformanceCaveat: false, // Permitir renderização mesmo com performance limitada
      });

      map.current = mapInstance;

      // Adicionar controles de navegação
      map.current.addControl(
        new mapboxgl.NavigationControl({
          visualizePitch: true,
        }),
        'top-right'
      );

      // Adicionar controle de escala
      map.current.addControl(new mapboxgl.ScaleControl());

      // Evento quando o mapa carrega
      map.current.on('load', () => {
        console.log('Mapa carregado com sucesso');
        setIsLoaded(true);
        setIsInitializing(false);

        // Adicionar dados dos municípios e processos
        const municipios = [
          { lng: -48.5482, lat: -27.5954, nome: 'Florianópolis', processos: 5 },
          { lng: -49.0647, lat: -26.9194, nome: 'Blumenau', processos: 3 },
          { lng: -49.2712, lat: -25.4284, nome: 'Joinville', processos: 8 },
          { lng: -49.6408, lat: -26.8412, nome: 'Pomerode', processos: 2 },
          { lng: -48.8095, lat: -26.6332, nome: 'Itajaí', processos: 4 },
        ];

        municipios.forEach((municipio) => {
          const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
            <div style="padding: 8px;">
              <h3 style="margin: 0 0 4px 0; font-weight: bold;">${municipio.nome}</h3>
              <p style="margin: 0; color: #666;">${municipio.processos} processos</p>
            </div>
          `);

          const markerColor = municipio.processos > 5 ? '#ef4444' : 
                             municipio.processos > 2 ? '#f59e0b' : '#10b981';

          new mapboxgl.Marker({
            color: markerColor,
            scale: 0.8
          })
            .setLngLat([municipio.lng, municipio.lat])
            .setPopup(popup)
            .addTo(map.current!);
        });
      });

      // Tratamento de erros
      map.current.on('error', (e) => {
        console.error('Erro no Mapbox:', e.error);
        setError('Erro ao carregar o mapa. Verifique sua chave API.');
        setIsInitializing(false);
      });

      // Timeout para detectar problemas de carregamento
      const loadTimeout = setTimeout(() => {
        if (!isLoaded && map.current) {
          console.warn('Mapa demorou muito para carregar');
          setError('O mapa está demorando para carregar. Verifique sua conexão e chave API.');
          setIsInitializing(false);
        }
      }, 15000);

      return () => {
        clearTimeout(loadTimeout);
        if (map.current) {
          map.current.remove();
          map.current = null;
        }
      };

    } catch (error) {
      console.error('Erro ao inicializar o mapa:', error);
      setError(error instanceof Error ? error.message : 'Erro desconhecido ao inicializar o mapa');
      setIsInitializing(false);
    }
  }, [token, mapStyle]);

  // Atualizar visibilidade dos rótulos
  useEffect(() => {
    if (map.current && isLoaded) {
      const visibility = showLabels ? 'visible' : 'none';
      
      try {
        const style = map.current.getStyle();
        style.layers?.forEach((layer) => {
          if (layer.type === 'symbol' && layer.layout && 'text-field' in layer.layout) {
            map.current?.setLayoutProperty(layer.id, 'visibility', visibility);
          }
        });
      } catch (error) {
        console.log('Não foi possível alterar a visibilidade dos rótulos:', error);
      }
    }
  }, [showLabels, isLoaded]);

  if (!token) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-green-50">
        <div className="text-center space-y-4">
          <p className="text-gray-600">Token do Mapbox não configurado</p>
          <Button onClick={onConfigureToken}>
            <Settings className="h-4 w-4 mr-2" />
            Configurar Token
          </Button>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center p-4">
        <div className="text-center space-y-4 max-w-md">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-left">
              {error}
            </AlertDescription>
          </Alert>
          <div className="space-y-2">
            <Button onClick={onConfigureToken} variant="outline">
              <Settings className="h-4 w-4 mr-2" />
              Reconfigurar Token
            </Button>
            <p className="text-sm text-muted-foreground">
              Certifique-se de que sua chave API está correta e ativa.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainer} className="absolute inset-0 rounded-lg" />
      
      {(isInitializing || !isLoaded) && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="text-center space-y-3">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
            <div className="space-y-1">
              <p className="text-sm font-medium">Carregando mapa...</p>
              <p className="text-xs text-muted-foreground">
                Inicializando Mapbox GL JS
              </p>
            </div>
          </div>
        </div>
      )}

      <Button
        variant="outline"
        size="sm"
        className="absolute top-4 left-4 bg-background/90 backdrop-blur-sm"
        onClick={onConfigureToken}
      >
        <Settings className="h-4 w-4 mr-2" />
        Reconfigurar
      </Button>
    </div>
  );
}
