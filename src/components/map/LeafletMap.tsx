import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Button } from '@/components/ui/button';
import { Settings, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from '@/utils/processUtils';

// Função para calcular a cor baseada na vigência
const getVigenciaColor = (vigenciaDate: string) => {
  if (!vigenciaDate) return '#6b7280'; // Cinza para data não informada
  
  const today = new Date();
  const vigencia = new Date(vigenciaDate);
  const diffTime = vigencia.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays < 0) {
    return '#ef4444'; // Vermelho para vencidos
  } else if (diffDays <= 30) {
    return '#f59e0b'; // Amarelo para próximos ao vencimento (30 dias)
  } else {
    return '#10b981'; // Verde para vigentes
  }
};

// Função para formatar data
const formatDate = (dateString: string) => {
  if (!dateString) return 'N/A';
  try {
    return new Date(dateString).toLocaleDateString('pt-BR');
  } catch {
    return 'Data inválida';
  }
};

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
  const MAPTILES_API_KEY = token || 'get_your_own_OpIi9ZULNHzrESv6T2vL';

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
    if (!mapContainer.current) return;
    
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
        console.warn('Token do MapTiles não configurado ou inválido, usando OpenStreetMap como fallback');
      }

      // Verificar se o container está disponível
      if (!mapContainer.current) {
        setError('Erro interno: container do mapa não encontrado.');
        setIsInitializing(false);
        return;
      }

      // Configurar estilos baseado na seleção
      const getMapTileUrl = (style: string) => {
        // Se não há token válido, usar OpenStreetMap como fallback
        if (!token || token.length < 10) {
          return 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
        }
        
        const styleMap: { [key: string]: string } = {
          satellite: 'satellite-v2',
          street: 'streets-v2', 
          terrain: 'outdoor-v2',
          dark: 'dark-v2'
        };
        
        const selectedStyle = styleMap[style] || styleMap.satellite;
        return `https://api.maptiler.com/maps/${selectedStyle}/{z}/{x}/{y}.png?key=${MAPTILES_API_KEY}`;
      };

      // Criar o mapa Leaflet
      const mapInstance = L.map(mapContainer.current, {
        center: [-27.5954, -48.5482], // Centro de Santa Catarina
        zoom: 7,
        zoomControl: true,
        attributionControl: true,
      });

      // Adicionar camada de tiles
      const attribution = (!token || token.length < 10) 
        ? '© <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap contributors</a>'
        : '© <a href="https://www.maptiler.com/copyright/" target="_blank">MapTiler</a> © <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap contributors</a>';
        
      const tileLayer = L.tileLayer('https://api.maptiler.com/maps/streets-v2/{z}/{x}/{y}.png?key=e3VWogbibNO6050syxrN', {
      tileSize: 512,
      zoomOffset: -1,
      attribution: '&copy; <a href="https://www.maptiler.com/">MapTiler</a> contributors',
      }).addTo(map);

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

      // Marcar como carregado imediatamente após adicionar a camada
      setTimeout(async () => {
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
              status_processos(nome, cor),
              regional_nuclei(name)
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
              // Usar cor baseada na vigência em vez do status
              const vigenciaColor = getVigenciaColor(process.vigencia_date);
              
              // Criar ícone customizado baseado na vigência
              const customIcon = L.divIcon({
                className: 'custom-div-icon',
                html: `<div style="
                  background-color: ${vigenciaColor};
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

              // Popup com informações completas do processo
              const popupContent = `
                <div style="min-width: 250px; font-family: Inter, sans-serif;">
                  <h3 style="margin: 0 0 12px 0; font-size: 16px; font-weight: bold; color: #1f2937; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px;">
                    ${process.municipalities?.name || 'Município não informado'}
                  </h3>
                  
                  <div style="display: grid; gap: 8px;">
                    <p style="margin: 0; font-size: 12px; display: flex; justify-content: space-between;">
                      <strong style="color: #374151;">Processo:</strong> 
                      <span style="color: #6b7280;">${process.process_number || 'N/A'}</span>
                    </p>
                    
                    <p style="margin: 0; font-size: 12px; display: flex; justify-content: space-between;">
                      <strong style="color: #374151;">Status:</strong> 
                      <span style="color: #6b7280;">${process.status_processos?.nome || 'N/A'}</span>
                    </p>
                    
                    <p style="margin: 0; font-size: 12px; display: flex; justify-content: space-between;">
                      <strong style="color: #374151;">Valor (Concedente):</strong> 
                      <span style="color: #059669; font-weight: 600;">${process.total_concedente_value ? formatCurrency(process.total_concedente_value) : 'N/A'}</span>
                    </p>
                    
                    <div style="margin: 8px 0; padding: 8px; background-color: #f9fafb; border-radius: 4px; border-left: 3px solid ${vigenciaColor};">
                      <p style="margin: 0; font-size: 12px; display: flex; justify-content: space-between;">
                        <strong style="color: #374151;">Data de Vigência:</strong> 
                        <span style="color: #6b7280;">${formatDate(process.vigencia_date)}</span>
                      </p>
                    </div>
                    
                    <p style="margin: 0; font-size: 12px; display: flex; justify-content: space-between;">
                      <strong style="color: #374151;">Núcleo:</strong> 
                      <span style="color: #6b7280;">${process.regional_nuclei?.name || 'N/A'}</span>
                    </p>
                  </div>
                  
                  <div style="margin-top: 12px; padding-top: 8px; border-top: 1px solid #e5e7eb;">
                    <p style="margin: 0; font-size: 11px; color: #9ca3af;">
                      <strong>Objeto:</strong>
                    </p>
                    <p style="margin: 4px 0 0 0; font-size: 11px; color: #6b7280; line-height: 1.4;">
                      ${process.object || 'Objeto não informado'}
                    </p>
                  </div>
                </div>
              `;

              marker.bindPopup(popupContent, {
                maxWidth: 300,
                className: 'custom-popup'
              });
              marker.addTo(mapInstance);
              markersRef.current.push(marker);
            }
          });

        } catch (error) {
          console.error('Erro ao carregar processos no mapa:', error);
        }
      }, 1000);

      // Tratamento de erros
      let tileErrorCount = 0;
      tileLayer.on('tileerror', (e) => {
        tileErrorCount++;
        console.warn(`Erro ao carregar tile ${tileErrorCount}:`, e.tile?.src);
        
        // Só mostrar erro se houver muitos tiles falhando
        if (tileErrorCount > 5) {
          console.error('Muitos erros de tiles, possível problema com a API');
          
          // Limpar o timeout quando há erro crítico
          clearTimeout(loadTimeout);
          
          if (e.error?.status === 401 || e.error?.status === 403) {
            setError('Token do MapTiles inválido ou expirado. Verifique sua chave API.');
          } else if (e.error?.status === 429) {
            setError('Limite de requisições excedido. Tente novamente mais tarde.');
          } else {
            setError('Erro ao carregar o mapa. Verifique sua chave API e conexão.');
          }
          
          setIsInitializing(false);
        }
      });



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
