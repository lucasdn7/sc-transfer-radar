import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Button } from '@/components/ui/button';
import { Settings, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from '@/utils/processUtils';

// Fix for default markers in Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface LeafletMapProps {
  token: string;
  mapStyle: string;
  showLabels: boolean;
  onConfigureToken: () => void;
  statusFilter?: string;
  regionFilter?: string;
  searchTerm?: string;
}

export function LeafletMap({ token, mapStyle, showLabels, onConfigureToken, statusFilter, regionFilter, searchTerm }: LeafletMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  // MapTiles API key - você pode configurar isso através de uma variável de ambiente
  const MAPTILES_API_KEY = token || 'your-maptiles-api-key';

  const initializeMap = () => {
    setRetryCount(prev => prev + 1);
    setError(null);
    setIsLoaded(false);
    setIsInitializing(true);
    
    // Clear existing map
    if (map.current) {
      map.current.remove();
      map.current = null;
    }
    
    // Clear markers
    markersRef.current = [];
  };

  useEffect(() => {
    if (!mapContainer.current || !token) return;
    
    // Evitar re-inicialização se o mapa já está carregado e não houve mudança significativa
    if (map.current && isLoaded && !error) {
      return;
    }

    // Só inicializar se não estiver já inicializando
    if (isInitializing) return;

    initializeMap();

    try {
      // Verificar se o token é válido (formato básico)
      if (!token || token.length < 10) {
        setError('Token inválido. Verifique sua chave API do MapTiles.');
        setIsInitializing(false);
        return;
      }

      // Verificar se o container está disponível
      if (!mapContainer.current) {
        setError('Erro interno: container do mapa não encontrado.');
        setIsInitializing(false);
        return;
      }

      // Configurar estilos baseado na seleção
      const getMapTileUrl = (style: string) => {
        const styleMap: { [key: string]: string } = {
          satellite: 'satellite-v2',
          street: 'streets-v2',
          terrain: 'outdoor-v2',
          dark: 'dark-v2'
        };
        
        const selectedStyle = styleMap[style] || styleMap.satellite;
        return `https://api.maptiler.com/maps/${selectedStyle}/256/{z}/{x}/{y}.png?key=${MAPTILES_API_KEY}`;
      };

      // Criar o mapa Leaflet
      const mapInstance = L.map(mapContainer.current, {
        center: [-27.5954, -48.5482], // Centro de Santa Catarina
        zoom: 7,
        zoomControl: true,
        attributionControl: true,
      });

      // Adicionar camada de tiles
      const tileLayer = L.tileLayer(getMapTileUrl(mapStyle), {
        attribution: '© <a href="https://www.maptiler.com/copyright/" target="_blank">MapTiler</a> © <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap contributors</a>',
        maxZoom: 18,
      });

      tileLayer.addTo(mapInstance);

      map.current = mapInstance;

      // Timeout para detectar problemas de carregamento
      const loadTimeout = setTimeout(() => {
        // Verificar se o mapa ainda existe e não foi carregado
        if (!isLoaded && map.current && !error) {
          console.warn('Mapa demorou muito para carregar');
          
          // Check network connectivity
          if (!navigator.onLine) {
            setError('Sem conexão com a internet. Verifique sua conexão e tente novamente.');
          } else {
            setError('O mapa está demorando para carregar. Verifique sua conexão e chave API.');
          }
          setIsInitializing(false);
        }
      }, 30000); // 30 segundos

      // Evento quando as tiles carregam
      tileLayer.on('load', async () => {
        console.log('Mapa carregado com sucesso');
        setIsLoaded(true);
        setIsInitializing(false);
        
        // Limpar o timeout quando o mapa carregar com sucesso
        clearTimeout(loadTimeout);

        // Buscar processos da base de dados
        try {
          let query: any = supabase
            .from('processes')
            .select(`
              *,
              municipalities(name),
              status_processos(nome, cor)
            `)
            .not('latitude', 'is', null)
            .not('longitude', 'is', null);
            
          if (statusFilter && statusFilter !== 'all') {
            query = query.eq('current_status', statusFilter);
          }
          if (regionFilter && regionFilter !== 'all') {
            query = query.ilike('municipalities.region', `%${regionFilter}%`);
          }
          if (searchTerm) {
            query = query.ilike('municipalities.name', `%${searchTerm}%`);
          }
          
          const result = await query as any;
          const data = result.data;
          const error = result.error;
          const processes = (Array.isArray(data) ? data : []) as any[];

          if (error) {
            console.error('Erro ao buscar processos:', error);
            console.warn('Mapa carregado sem dados dos processos devido a erro na consulta');
            return;
          }

          console.log('Processos encontrados para o mapa:', processes?.length || 0);

          // Limpar marcadores anteriores
          markersRef.current.forEach(marker => marker.remove());
          markersRef.current = [];

          // Adicionar marcadores para cada processo
          processes.forEach((process: any) => {
            if (process.latitude && process.longitude) {
              const statusColor = process.status_processos?.cor || '#3b82f6';
              
              // Criar ícone customizado baseado no status
              const customIcon = L.divIcon({
                className: 'custom-div-icon',
                html: `<div style="
                  background-color: ${statusColor};
                  width: 20px;
                  height: 20px;
                  border-radius: 50%;
                  border: 2px solid white;
                  box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                "></div>`,
                iconSize: [20, 20],
                iconAnchor: [10, 10]
              });

              const marker = L.marker([process.latitude, process.longitude], {
                icon: customIcon
              });

              // Popup com informações do processo
              const popupContent = `
                <div style="min-width: 200px;">
                  <h3 style="margin: 0 0 8px 0; font-size: 14px; font-weight: bold;">
                    ${process.municipalities?.name || 'Município não informado'}
                  </h3>
                  <p style="margin: 4px 0; font-size: 12px;">
                    <strong>Processo:</strong> ${process.numero_processo || 'N/A'}
                  </p>
                  <p style="margin: 4px 0; font-size: 12px;">
                    <strong>Status:</strong> ${process.status_processos?.nome || 'N/A'}
                  </p>
                  <p style="margin: 4px 0; font-size: 12px;">
                    <strong>Valor:</strong> ${process.valor_repasse ? formatCurrency(process.valor_repasse) : 'N/A'}
                  </p>
                  <p style="margin: 4px 0; font-size: 12px;">
                    <strong>Modalidade:</strong> ${process.modalidade || 'N/A'}
                  </p>
                </div>
              `;

              marker.bindPopup(popupContent);
              marker.addTo(mapInstance);
              markersRef.current.push(marker);
            }
          });

        } catch (error) {
          console.error('Erro ao carregar processos no mapa:', error);
        }
      });

      // Tratamento de erros
      tileLayer.on('tileerror', (e) => {
        console.error('Erro ao carregar tiles:', e);
        
        // Limpar o timeout quando há erro
        clearTimeout(loadTimeout);
        
        if (e.error?.status === 401 || e.error?.status === 403) {
          setError('Token do MapTiles inválido ou expirado. Verifique sua chave API.');
        } else if (e.error?.status === 429) {
          setError('Limite de requisições excedido. Tente novamente mais tarde.');
        } else {
          setError('Erro ao carregar o mapa. Verifique sua chave API e conexão.');
        }
        
        setIsInitializing(false);
      });

      // Simular carregamento inicial
      setTimeout(() => {
        if (map.current && !error) {
          tileLayer.fire('load');
        }
      }, 1000);

      return () => {
        clearTimeout(loadTimeout);
        if (map.current) {
          map.current.remove();
          map.current = null;
        }
        markersRef.current = [];
      };

    } catch (error) {
      console.error('Erro ao inicializar o mapa:', error);
      setError('Erro ao inicializar o mapa. Tente recarregar a página ou verificar sua chave API.');
      setIsInitializing(false);
    }
  }, [token, mapStyle, statusFilter, regionFilter, searchTerm]);

  const handleRetry = () => {
    setError(null);
    setIsLoaded(false);
    setIsInitializing(false);
  };

  if (error) {
    return (
      <div className="w-full h-[600px] flex flex-col items-center justify-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
        <Alert className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="mb-4">
            {error}
            {retryCount > 1 && (
              <div className="mt-2 text-sm text-gray-600">
                Tentativa {retryCount} - Conexão pode estar lenta
              </div>
            )}
          </AlertDescription>
        </Alert>
        <div className="flex gap-2 mt-4">
          <Button onClick={handleRetry} variant="outline">
            Tentar Novamente
          </Button>
          <Button onClick={onConfigureToken} variant="outline">
            <Settings className="w-4 h-4 mr-2" />
            Reconfigurar Token
          </Button>
        </div>
      </div>
    );
  }

  if (isInitializing) {
    return (
      <div className="w-full h-[600px] flex items-center justify-center bg-gray-50 rounded-lg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">
            Carregando mapa... (Tentativa {retryCount})
            {retryCount > 2 && <span className="block text-sm">Conexão pode estar lenta</span>}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-[600px] rounded-lg overflow-hidden border">
      <div ref={mapContainer} className="w-full h-full" />
      
      {!isLoaded && (
        <div className="absolute inset-0 bg-gray-50 bg-opacity-75 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">Inicializando mapa...</p>
          </div>
        </div>
      )}
    </div>
  );
}