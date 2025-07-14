import React, { useState } from 'react';
import { supabase } from '../integrations/supabase/client';

export default function TechnicalAuth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError('E-mail ou senha inválidos.');
    } else {
      window.location.href = '/'; // Redireciona para a home ou dashboard
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleLogin} style={{ maxWidth: 320, margin: 'auto', marginTop: 80, background: '#fff', padding: 24, borderRadius: 8, boxShadow: '0 2px 8px #0001' }}>
      <h2 style={{ textAlign: 'center', marginBottom: 24 }}>Acesso Área Técnica</h2>
      <input
        type="email"
        placeholder="E-mail"
        value={email}
        onChange={e => setEmail(e.target.value)}
        required
        style={{ width: '100%', marginBottom: 12, padding: 8, borderRadius: 4, border: '1px solid #ccc' }}
      />
      <input
        type="password"
        placeholder="Senha"
        value={password}
        onChange={e => setPassword(e.target.value)}
        required
        style={{ width: '100%', marginBottom: 12, padding: 8, borderRadius: 4, border: '1px solid #ccc' }}
      />
      <button type="submit" disabled={loading} style={{ width: '100%', padding: 10, borderRadius: 4, background: '#1a237e', color: '#fff', border: 'none', fontWeight: 600 }}>
        {loading ? 'Entrando...' : 'Entrar'}
      </button>
      {error && <div style={{ color: 'red', marginTop: 12, textAlign: 'center' }}>{error}</div>}
    </form>
  );
} 