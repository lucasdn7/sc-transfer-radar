
import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface TechnicalAuthContextType {
  isAuthenticated: boolean;
  sessionToken: string | null;
  loading: boolean;
  signIn: (password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const TechnicalAuthContext = createContext<TechnicalAuthContextType | undefined>(undefined);

export function TechnicalAuthProvider({ children }: { children: React.ReactNode }) {
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Verificar se existe sessão salva no localStorage
    const savedToken = localStorage.getItem('technical_session_token');
    if (savedToken) {
      validateSession(savedToken);
    } else {
      setLoading(false);
    }
  }, []);

  const validateSession = async (token: string) => {
    try {
      const { data, error } = await supabase.rpc('validate_technical_session', {
        token_input: token
      });

      if (error || !data) {
        localStorage.removeItem('technical_session_token');
        setSessionToken(null);
      } else {
        setSessionToken(token);
      }
    } catch (error) {
      console.error('Erro ao validar sessão:', error);
      localStorage.removeItem('technical_session_token');
      setSessionToken(null);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (password: string) => {
    try {
      const { data, error } = await supabase.rpc('create_technical_session', {
        password_input: password
      });

      if (error) {
        toast({
          title: 'Erro no login',
          description: 'Senha incorreta para área técnica',
          variant: 'destructive',
        });
        return { error };
      }

      const token = data[0]?.session_token;
      if (token) {
        setSessionToken(token);
        localStorage.setItem('technical_session_token', token);

        toast({
          title: 'Login realizado com sucesso',
          description: 'Bem-vindo à área técnica!',
        });
      }

      return { error: null };
    } catch (error: any) {
      toast({
        title: 'Erro no login',
        description: error.message || 'Erro interno do servidor',
        variant: 'destructive',
      });
      return { error };
    }
  };

  const signOut = async () => {
    if (sessionToken) {
      try {
        await supabase.rpc('invalidate_technical_session', {
          token_input: sessionToken
        });
      } catch (error) {
        console.error('Erro ao invalidar sessão:', error);
      }
    }

    setSessionToken(null);
    localStorage.removeItem('technical_session_token');
    
    toast({
      title: 'Logout realizado',
      description: 'Sessão técnica encerrada',
    });
  };

  const value = {
    isAuthenticated: !!sessionToken,
    sessionToken,
    loading,
    signIn,
    signOut,
  };

  return (
    <TechnicalAuthContext.Provider value={value}>
      {children}
    </TechnicalAuthContext.Provider>
  );
}

export function useTechnicalAuth() {
  const context = useContext(TechnicalAuthContext);
  if (context === undefined) {
    throw new Error('useTechnicalAuth must be used within a TechnicalAuthProvider');
  }
  return context;
}
