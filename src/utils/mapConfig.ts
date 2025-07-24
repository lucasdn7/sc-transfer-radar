// Configuração do MapTiles
export const MAP_CONFIG = {
  // Token extraído da URL fornecida pelo usuário
  DEFAULT_TOKEN: 'e3VWogbibNO6050syxrN',
  
  // URLs base para diferentes estilos
  TILE_URLS: {
    satellite: 'satellite-v2',
    street: 'streets-v2',
    terrain: 'outdoor-v2',
    dark: 'dark-v2'
  },
  
  // Configuração padrão do mapa
  DEFAULT_CENTER: [-27.5954, -48.5482] as [number, number], // Santa Catarina
  DEFAULT_ZOOM: 7,
  
  // Fallback para OpenStreetMap
  OSM_URL: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
};

/**
 * Extrai o token de uma URL do MapTiles ou retorna o token diretamente
 */
export const extractTokenFromUrl = (tokenOrUrl: string): string => {
  if (!tokenOrUrl) return '';
  
  // Se for uma URL completa, extrair o token
  const urlMatch = tokenOrUrl.match(/[?&]key=([^&]+)/);
  if (urlMatch) {
    return urlMatch[1];
  }
  
  // Se for apenas o token, retornar diretamente
  return tokenOrUrl.trim();
};

/**
 * Testa se um token do MapTiles é válido fazendo uma requisição de teste
 */
export const testMapTilesToken = async (token: string): Promise<boolean> => {
  try {
    const extractedToken = extractTokenFromUrl(token);
    if (!extractedToken || extractedToken.length < 10) {
      return false;
    }
    
    // Testar com uma tile específica (zoom baixo para ser rápido)
    const testUrl = `https://api.maptiler.com/maps/streets-v2/0/0/0.png?key=${extractedToken}`;
    const response = await fetch(testUrl);
    return response.ok;
  } catch (error) {
    console.error('Erro ao testar token:', error);
    return false;
  }
};

/**
 * Gera a URL do tile baseada no estilo e token com fallback inteligente
 */
export const getTileUrl = (style: string, token: string, forceOSM: boolean = false): string => {
  const extractedToken = extractTokenFromUrl(token);
  
  console.log('Gerando URL do tile:', {
    style,
    originalToken: token ? token.substring(0, 20) + '...' : 'não fornecido',
    extractedToken: extractedToken ? extractedToken.substring(0, 20) + '...' : 'não extraído',
    tokenLength: extractedToken?.length || 0,
    forceOSM
  });
  
  // Forçar OpenStreetMap se solicitado ou se token é inválido
  if (forceOSM || !extractedToken || extractedToken.length < 10) {
    console.warn(forceOSM ? 'Forçando uso do OpenStreetMap' : 'Token do MapTiles inválido, usando OpenStreetMap como fallback');
    return MAP_CONFIG.OSM_URL;
  }
  
  const styleKey = MAP_CONFIG.TILE_URLS[style as keyof typeof MAP_CONFIG.TILE_URLS] || MAP_CONFIG.TILE_URLS.satellite;
  const finalUrl = `https://api.maptiler.com/maps/${styleKey}/{z}/{x}/{y}.png?key=${extractedToken}`;
  
  console.log('URL final gerada:', finalUrl.substring(0, 100) + '...');
  return finalUrl;
};

/**
 * Configura automaticamente o token padrão se não houver nenhum configurado
 */
export const setupDefaultToken = (): boolean => {
  try {
    const existingToken = localStorage.getItem('maptiles_api_token');
    if (!existingToken) {
      localStorage.setItem('maptiles_api_token', MAP_CONFIG.DEFAULT_TOKEN);
      console.log('Token padrão configurado automaticamente');
      return true;
    }
    return false;
  } catch (error) {
    console.error('Erro ao configurar token padrão:', error);
    return false;
  }
};