import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Button } from '@/components/ui/button';
import { Settings, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from '@/utils/processUtils';
import { MAP_CONFIG, getTileUrl, setupDefaultToken, testMapTilesToken } from '@/utils/mapConfig';

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
  const initializationRef = useRef<boolean>(false); // Para controlar inicializações múltiplas

  // Configurar token automaticamente se necessário
  useEffect(() => {
    setupDefaultToken();
  }, []);

  const MAPTILES_API_KEY = token || MAP_CONFIG.DEFAULT_TOKEN;

  const initializeMap = () => {
    // Evitar inicialização múltipla simultânea
    if (initializationRef.current) {
      console.log('Inicialização já em andamento, ignorando...');
      return;
    }
    
    initializationRef.current = true;
    setRetryCount(prev => prev + 1);
    setError(null);
    setIsLoaded(false);
    setIsInitializing(true);
    
    console.log('Limpando mapa existente...');
    
    // Clear existing map more thoroughly
    if (map.current) {
      try {
        map.current.remove();
        console.log('Mapa anterior removido com sucesso');
      } catch (error) {
        console.warn('Erro ao remover mapa anterior:', error);
      }
      map.current = null;
    }
    
    // Clear markers
    markersRef.current.forEach(marker => {
      try {
        marker.remove();
      } catch (error) {
        console.warn('Erro ao remover marker:', error);
      }
    });
    markersRef.current = [];
    
    // Clear any existing Leaflet containers in the element
    if (mapContainer.current) {
      mapContainer.current.innerHTML = '';
      // Remove any Leaflet-added classes
      mapContainer.current.className = mapContainer.current.className
        .split(' ')
        .filter(cls => !cls.startsWith('leaflet-'))
        .join(' ');
    }
    
    // Chamar a inicialização assíncrona após a limpeza
    setTimeout(() => {
      initializeMapAsync();
    }, 100);
  };

  // Função assíncrona para inicialização do mapa
  const initializeMapAsync = async () => {
    try {
      // Verificar se o container está disponível
      if (!mapContainer.current) {
        setError('Erro interno: container do mapa não encontrado.');
        setIsInitializing(false);
        return;
      }

      // Verificar se o container tem dimensões adequadas
      const containerRect = mapContainer.current.getBoundingClientRect();
      console.log('Dimensões do container:', {
        width: containerRect.width,
        height: containerRect.height,
        offsetHeight: mapContainer.current.offsetHeight,
        offsetWidth: mapContainer.current.offsetWidth,
        clientHeight: mapContainer.current.clientHeight,
        clientWidth: mapContainer.current.clientWidth,
        isInDOM: document.contains(mapContainer.current)
      });
      
      // Verificar múltiplas medidas para garantir que o container está pronto
      const hasWidth = containerRect.width > 0 || mapContainer.current.offsetWidth > 0 || mapContainer.current.clientWidth > 0;
      const hasHeight = containerRect.height > 0 || mapContainer.current.offsetHeight > 0 || mapContainer.current.clientHeight > 0;
      
      if (!hasWidth || !hasHeight) {
        console.warn('Container do mapa não tem dimensões adequadas, tentando aguardar...');
        
        // Tentar aguardar um pouco mais e verificar novamente
        let retryCount = 0;
        const checkDimensions = () => {
          retryCount++;
          if (!mapContainer.current) {
            setError('Container removido durante verificação de dimensões.');
            setIsInitializing(false);
            return;
          }
          
          const newRect = mapContainer.current.getBoundingClientRect();
          const newHasWidth = newRect.width > 0 || mapContainer.current.offsetWidth > 0;
          const newHasHeight = newRect.height > 0 || mapContainer.current.offsetHeight > 0;
          
          if (newHasWidth && newHasHeight) {
            console.log(`Container tem dimensões após ${retryCount} tentativas, continuando...`);
            setIsInitializing(false); // Isso fará o useEffect tentar novamente
          } else if (retryCount < 5) {
            console.log(`Tentativa ${retryCount}/5: aguardando dimensões...`);
            setTimeout(checkDimensions, 200 * retryCount); // Delay crescente
          } else {
            setError('Container do mapa não conseguiu obter dimensões adequadas. Verifique os estilos CSS.');
            setIsInitializing(false);
          }
        };
        
        setTimeout(checkDimensions, 200);
        return;
      }

      // Testar token antes de gerar URL
      console.log('Testando token do MapTiles...');
      const isTokenValid = await testMapTilesToken(MAPTILES_API_KEY);
      console.log('Token válido:', isTokenValid);

      // Usar função utilitária para gerar URL do tile
      // Se o token for inválido, forçar uso do OpenStreetMap
      const tileUrl = getTileUrl(mapStyle, MAPTILES_API_KEY, !isTokenValid);
      
      if (!isTokenValid) {
        console.warn('Token inválido, usando OpenStreetMap como fallback');
        // Não mostrar como erro, apenas como informação
      }

      // Aguardar mais tempo para garantir que o DOM está estável
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Verificar novamente se o container ainda existe
              if (!mapContainer.current) {
          setError('Container do mapa foi removido durante a inicialização.');
          setIsInitializing(false);
          initializationRef.current = false;
          return;
        }

      // Verificar se o container está no DOM
              if (!document.contains(mapContainer.current)) {
          console.warn('Container não está no DOM, aguardando...');
          setTimeout(() => {
            setIsInitializing(false);
            initializationRef.current = false;
          }, 500);
          return;
        }

      console.log('Criando instância do mapa Leaflet...');
      
      // Garantir que o container está limpo e pronto
      const containerElement = mapContainer.current;
      
      // Verificar se já existe um mapa Leaflet no container
      if (containerElement._leaflet_id) {
        console.warn('Container já tem um mapa Leaflet, limpando...');
        delete containerElement._leaflet_id;
      }
      
      // Criar o mapa Leaflet com verificação adicional
      let mapInstance;
      try {
        mapInstance = L.map(containerElement, {
          center: MAP_CONFIG.DEFAULT_CENTER,
          zoom: MAP_CONFIG.DEFAULT_ZOOM,
          zoomControl: true,
          attributionControl: true,
        });
        console.log('Mapa Leaflet criado com sucesso');
        
        // Aguardar um pouco para garantir que a inicialização foi completa
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Verificar se o mapa ainda está válido após a criação
        if (!mapInstance || !mapInstance.getContainer()) {
          throw new Error('Mapa criado mas container inválido');
        }
        
      } catch (error) {
        console.error('Erro ao criar mapa Leaflet:', error);
        
        // Tentar limpar qualquer resíduo
        try {
          if (containerElement._leaflet_id) {
            delete containerElement._leaflet_id;
          }
          containerElement.innerHTML = '';
        } catch (cleanupError) {
          console.warn('Erro ao limpar após falha:', cleanupError);
        }
        
        setError(`Erro ao criar instância do mapa: ${error.message}. Tente recarregar a página.`);
        setIsInitializing(false);
        initializationRef.current = false;
        return;
      }

      // Adicionar camada de tiles
      const attribution = tileUrl.includes('openstreetmap')
        ? '© <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap contributors</a>'
        : '© <a href="https://www.maptiler.com/copyright/" target="_blank">MapTiler</a> © <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap contributors</a>';
        
      const tileLayer = L.tileLayer(tileUrl, {
        tileSize: 256,
        zoomOffset: 0,
        attribution: attribution,
        crossOrigin: true
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

      // Debug: Log da configuração atual
      console.log('Configuração do mapa:', {
        token: token ? token.substring(0, 20) + '...' : 'usando token padrão',
        finalKey: MAPTILES_API_KEY ? MAPTILES_API_KEY.substring(0, 20) + '...' : 'não disponível',
        mapStyle,
        tileUrl: tileUrl.substring(0, 100) + '...'
      });

      // Marcar como carregado imediatamente após adicionar a camada
      setTimeout(async () => {
        console.log('Mapa carregado com sucesso');
        
        // Invalidar o tamanho do mapa para garantir renderização correta
        if (mapInstance) {
          // Múltiplas tentativas para garantir o redimensionamento
          setTimeout(() => {
            try {
              mapInstance.invalidateSize(true); // true = reset
              console.log('Tamanho do mapa invalidado (tentativa 1)');
            } catch (error) {
              console.warn('Erro ao invalidar tamanho (tentativa 1):', error);
            }
          }, 100);
          
          setTimeout(() => {
            try {
              mapInstance.invalidateSize(true);
              console.log('Tamanho do mapa invalidado (tentativa 2)');
            } catch (error) {
              console.warn('Erro ao invalidar tamanho (tentativa 2):', error);
            }
          }, 500);
          
          setTimeout(() => {
            try {
              mapInstance.invalidateSize(true);
              console.log('Tamanho do mapa invalidado (tentativa 3)');
            } catch (error) {
              console.warn('Erro ao invalidar tamanho (tentativa 3):', error);
            }
          }, 1000);
        }
        
        setIsLoaded(true);
        setIsInitializing(false);
        initializationRef.current = false; // Reset da flag de inicialização
        
        // Limpar o timeout quando o mapa carregar com sucesso
        clearTimeout(loadTimeout);

        // Buscar processos da base de dados (opcional - mapa funciona sem dados)
        console.log('Tentando carregar dados dos processos...');
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
            console.warn('Erro ao buscar processos:', error.message);
            console.log('Mapa carregado sem dados dos processos - funcionando em modo básico');
            
            // Adicionar marcadores de exemplo para testar
            console.log('Adicionando marcadores de exemplo...');
            const exampleMarkers = [
              { lat: -27.5954, lng: -48.5482, title: "Florianópolis - Exemplo", description: "Marcador de teste" },
              { lat: -26.9194, lng: -49.0661, title: "Blumenau - Exemplo", description: "Marcador de teste" },
              { lat: -27.0934, lng: -52.6143, title: "Chapecó - Exemplo", description: "Marcador de teste" }
            ];
            
            exampleMarkers.forEach((example, index) => {
              const marker = L.marker([example.lat, example.lng]);
              marker.bindPopup(`
                <div style="font-family: Inter, sans-serif;">
                  <h3 style="margin: 0 0 8px 0; font-size: 14px; font-weight: bold;">${example.title}</h3>
                  <p style="margin: 0; font-size: 12px; color: #666;">${example.description}</p>
                  <p style="margin: 4px 0 0 0; font-size: 11px; color: #999;">Dados de exemplo - banco não disponível</p>
                </div>
              `);
              marker.addTo(mapInstance);
              markersRef.current.push(marker);
            });
            
            console.log(`${exampleMarkers.length} marcadores de exemplo adicionados`);
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

      // Tratamento de erros mais tolerante
      let tileErrorCount = 0;
      let tileLoadCount = 0;
      let consecutiveErrors = 0;
      
      tileLayer.on('tileload', () => {
        tileLoadCount++;
        consecutiveErrors = 0; // Reset consecutive errors on successful load
        if (tileLoadCount >= 3) {
          console.log('Tiles carregando com sucesso');
        }
      });

      tileLayer.on('tileerror', (e) => {
        tileErrorCount++;
        consecutiveErrors++;
        console.warn(`Erro ao carregar tile ${tileErrorCount} (consecutivos: ${consecutiveErrors}):`, e.tile?.src);
        
        // Só mostrar erro se houver muitos erros consecutivos
        if (consecutiveErrors > 5 && tileLoadCount === 0) {
          console.error('Muitos erros consecutivos de tiles, possível problema com a API');
          
          // Limpar o timeout quando há erro crítico
          clearTimeout(loadTimeout);
          
          // Analisar o tipo de erro baseado na URL
          const tileUrl = e.tile?.src || '';
          if (tileUrl.includes('maptiler.com')) {
            if (tileUrl.includes('unauthorized') || e.error?.status === 401 || e.error?.status === 403) {
              setError('Token do MapTiles inválido ou expirado. Verifique sua chave API.');
            } else if (e.error?.status === 429) {
              setError('Limite de requisições excedido. Tente novamente mais tarde.');
            } else {
              setError('Erro ao carregar tiles do MapTiles. Verifique sua chave API e conexão.');
            }
          } else {
            setError('Erro ao carregar o mapa. Verifique sua conexão com a internet.');
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
      initializationRef.current = false; // Reset da flag de inicialização em caso de erro
    }
  };

  // UseEffect para inicialização do mapa
  useEffect(() => {
    // Aguardar um tick para garantir que o DOM está pronto
    const initTimer = setTimeout(() => {
      if (!mapContainer.current) {
        console.warn('Container não disponível, tentando novamente...');
        return;
      }
      
      // Evitar re-inicialização se o mapa já está carregado e não houve mudança significativa
      if (map.current && isLoaded && !error) {
        console.log('Mapa já carregado, evitando re-inicialização');
        return;
      }

      // Só inicializar se não estiver já inicializando
      if (isInitializing) {
        console.log('Mapa já inicializando, aguardando...');
        return;
      }

      console.log('Iniciando processo de inicialização do mapa...');
      initializeMap();
    }, 50); // Pequeno delay para garantir que o DOM está pronto

    return () => clearTimeout(initTimer);
  }, [token, mapStyle, statusFilter, regionFilter, searchTerm]);

  // UseEffect para garantir que o mapa seja redimensionado corretamente
  useEffect(() => {
    if (map.current && isLoaded) {
      const timers: NodeJS.Timeout[] = [];
      
      // Múltiplas tentativas de redimensionamento
      [100, 300, 600, 1000].forEach((delay) => {
        const timer = setTimeout(() => {
          try {
            if (map.current) {
              map.current.invalidateSize(true);
              console.log(`Redimensionamento automático (${delay}ms)`);
            }
          } catch (error) {
            console.warn(`Erro no redimensionamento automático (${delay}ms):`, error);
          }
        }, delay);
        timers.push(timer);
      });
      
      return () => {
        timers.forEach(timer => clearTimeout(timer));
      };
    }
  }, [isLoaded, mapStyle]); // Incluir mapStyle para redimensionar quando mudar

  const handleRetry = () => {
    setError(null);
    setIsLoaded(false);
    setIsInitializing(false);
    initializationRef.current = false; // Reset da flag para permitir nova inicialização
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
      <div ref={mapContainer} className="map-container w-full h-full" />
      
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
