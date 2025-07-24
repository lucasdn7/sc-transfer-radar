import { useState, useEffect } from 'react';

export function useMapTilesToken() {
  const [token, setToken] = useState<string | null>(null);
  const [isTokenSet, setIsTokenSet] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Verificar se já existe um token salvo no localStorage
    try {
      const savedToken = localStorage.getItem('maptiles_api_token');
      if (savedToken && savedToken.trim() && savedToken.length > 10) {
        setToken(savedToken.trim());
        setIsTokenSet(true);
      }
    } catch (error) {
      console.error('Erro ao carregar token do localStorage:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const saveToken = (newToken: string): boolean => {
    try {
      const trimmedToken = newToken.trim();
      
      if (!trimmedToken) {
        console.error('Token vazio');
        return false;
      }

      if (trimmedToken.length < 10) {
        console.error('Token muito curto. Verifique se é um token válido do MapTiles.');
        return false;
      }

      localStorage.setItem('maptiles_api_token', trimmedToken);
      setToken(trimmedToken);
      setIsTokenSet(true);
      console.log('Token MapTiles salvo com sucesso');
      return true;
    } catch (error) {
      console.error('Erro ao salvar token:', error);
      return false;
    }
  };

  const clearToken = () => {
    try {
      localStorage.removeItem('maptiles_api_token');
      setToken(null);
      setIsTokenSet(false);
      console.log('Token MapTiles removido com sucesso');
    } catch (error) {
      console.error('Erro ao remover token:', error);
    }
  };

  const validateToken = (tokenToValidate: string): boolean => {
    const trimmed = tokenToValidate.trim();
    return trimmed.length > 10; // MapTiles tokens são geralmente mais longos que 10 caracteres
  };

  return {
    token,
    isTokenSet,
    isLoading,
    saveToken,
    clearToken,
    validateToken,
  };
}