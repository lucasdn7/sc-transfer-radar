

import { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  userRole: string | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isTechnical: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Configuração simplificada para desenvolvimento
    const initializeAuth = async () => {
      try {
        // Set up auth state listener
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            console.log('Auth state changed:', event, session);
            setSession(session);
            setUser(session?.user ?? null);
            
            if (session?.user) {
              // Para desenvolvimento, usar role padrão
              setUserRole('admin');
            } else {
              setUserRole(null);
            }
            
            setLoading(false);
          }
        );

        // Check for existing session
        const { data: { session: existingSession } } = await supabase.auth.getSession();
        setSession(existingSession);
        setUser(existingSession?.user ?? null);
        
        if (existingSession?.user) {
          setUserRole('admin'); // Role padrão para desenvolvimento
        }
        
        setLoading(false);

        return () => subscription.unsubscribe();
      } catch (error) {
        console.error('Erro ao inicializar auth:', error);
        setLoading(false);
        // Em caso de erro, permitir que a aplicação continue funcionando
        setUserRole('admin'); // Role padrão para desenvolvimento
      }
    };

    initializeAuth();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast({
          title: 'Erro no login',
          description: error.message,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Login realizado com sucesso',
          description: 'Bem-vindo ao sistema!',
        });
      }

      return { error };
    } catch (error) {
      console.error('Erro no signIn:', error);
      return { error };
    }
  };

  const signUp = async (email: string, password: string, fullName?: string) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) {
        toast({
          title: 'Erro no cadastro',
          description: error.message,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Cadastro realizado com sucesso',
          description: 'Verifique seu email para confirmar a conta.',
        });
      }

      return { error };
    } catch (error) {
      console.error('Erro no signUp:', error);
      return { error };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      toast({
        title: 'Logout realizado',
        description: 'Você foi desconectado com sucesso.',
      });
    } catch (error) {
      console.error('Erro no signOut:', error);
    }
  };

  const isAuthenticated = !!user;
  const isAdmin = userRole === 'admin';
  const isTechnical = userRole === 'technical';

  const value = {
    user,
    session,
    userRole,
    loading,
    signIn,
    signUp,
    signOut,
    isAuthenticated,
    isAdmin,
    isTechnical,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
