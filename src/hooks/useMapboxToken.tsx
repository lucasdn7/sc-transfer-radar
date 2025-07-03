
import { useState, useEffect } from 'react';

export function useMapboxToken() {
  const [token, setToken] = useState<string | null>(null);
  const [isTokenSet, setIsTokenSet] = useState(false);

  useEffect(() => {
    // Verificar se já existe um token salvo no localStorage
    const savedToken = localStorage.getItem('mapbox_public_token');
    if (savedToken) {
      setToken(savedToken);
      setIsTokenSet(true);
    }
  }, []);

  const saveToken = (newToken: string) => {
    if (newToken.trim()) {
      localStorage.setItem('mapbox_public_token', newToken.trim());
      setToken(newToken.trim());
      setIsTokenSet(true);
      return true;
    }
    return false;
  };

  const clearToken = () => {
    localStorage.removeItem('mapbox_public_token');
    setToken(null);
    setIsTokenSet(false);
  };

  return {
    token,
    isTokenSet,
    saveToken,
    clearToken,
  };
}
