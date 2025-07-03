
import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Button } from '@/components/ui/button';
import { Settings } from 'lucide-react';

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

  useEffect(() => {
    if (!mapContainer.current || !token) return;

    try {
      mapboxgl.accessToken = token;

      // Configurar estilos baseado na seleção
      const styleMap: { [key: string]: string } = {
        satellite: 'mapbox://styles/mapbox/satellite-v9',
        street: 'mapbox://styles/mapbox/streets-v12',
        terrain: 'mapbox://styles/mapbox/outdoors-v12',
        dark: 'mapbox://styles/mapbox/dark-v11'
      };

      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: styleMap[mapStyle] || styleMap.satellite,
        center: [-48.5482, -27.5954], // Centro de Santa Catarina
        zoom: 7,
        pitch: 45,
      });

      // Adicionar controles de navegação
      map.current.addControl(
        new mapboxgl.NavigationControl({
          visualizePitch: true,
        }),
        'top-right'
      );

      // Adicionar controle de escala
      map.current.addControl(new mapboxgl.ScaleControl());

      map.current.on('load', () => {
        console.log('Mapa carregado com sucesso');
        setIsLoaded(true);

        // Adicionar dados dos municípios e processos aqui
        // Simulação de marcadores para municípios
        const municipios = [
          { lng: -48.5482, lat: -27.5954, nome: 'Florianópolis', processos: 5 },
          { lng: -49.0647, lat: -26.9194, nome: 'Blumenau', processos: 3 },
          { lng: -49.2712, lat: -25.4284, nome: 'Curitiba', processos: 8 },
        ];

        municipios.forEach((municipio) => {
          const popup = new mapboxgl.Popup({ offset: 25 }).setText(
            `${municipio.nome} - ${municipio.processos} processos`
          );

          const marker = new mapboxgl.Marker({
            color: municipio.processos > 5 ? '#ef4444' : municipio.processos > 2 ? '#f59e0b' : '#10b981'
          })
            .setLngLat([municipio.lng, municipio.lat])
            .setPopup(popup)
            .addTo(map.current!);
        });
      });

      map.current.on('error', (e) => {
        console.error('Erro no Mapbox:', e.error);
      });

    } catch (error) {
      console.error('Erro ao inicializar o mapa:', error);
    }

    return () => {
      map.current?.remove();
    };
  }, [token, mapStyle]);

  // Atualizar visibilidade dos rótulos
  useEffect(() => {
    if (map.current && isLoaded) {
      const visibility = showLabels ? 'visible' : 'none';
      
      // Tentar ocultar/mostrar camadas de texto
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

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainer} className="absolute inset-0 rounded-lg" />
      
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80">
          <div className="text-center space-y-2">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
            <p className="text-sm text-muted-foreground">Carregando mapa...</p>
          </div>
        </div>
      )}

      <Button
        variant="outline"
        size="sm"
        className="absolute top-4 left-4 bg-background/90"
        onClick={onConfigureToken}
      >
        <Settings className="h-4 w-4 mr-2" />
        Reconfigurar
      </Button>
    </div>
  );
}
