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
 * Gera a URL do tile baseada no estilo e token
 */
export const getTileUrl = (style: string, token: string): string => {
  const extractedToken = extractTokenFromUrl(token);
  
  // Se não há token válido, usar OpenStreetMap como fallback
  if (!extractedToken || extractedToken.length < 10) {
    console.warn('Token do MapTiles inválido, usando OpenStreetMap como fallback');
    return MAP_CONFIG.OSM_URL;
  }
  
  const styleKey = MAP_CONFIG.TILE_URLS[style as keyof typeof MAP_CONFIG.TILE_URLS] || MAP_CONFIG.TILE_URLS.satellite;
  return `https://api.maptiler.com/maps/${styleKey}/{z}/{x}/{y}.png?key=${extractedToken}`;
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