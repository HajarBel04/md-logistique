import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { authApi } from '../flotte/api';

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [state, setState] = useState({ loading: true, user: null, needsSetup: false, error: '' });

  const refresh = useCallback(async () => {
    try {
      const user = await authApi.me();
      setState({ loading: false, user, needsSetup: false, error: '' });
    } catch (e) {
      if (e.status === 401) {
        let needsSetup = false;
        try { needsSetup = (await authApi.status()).needsSetup; } catch { /* serveur indisponible */ }
        setState({ loading: false, user: null, needsSetup, error: '' });
      } else {
        setState({ loading: false, user: null, needsSetup: false, error: e.message });
      }
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  // Session expirée pendant l'utilisation → retour à l'écran de connexion
  useEffect(() => {
    const onExpired = () => setState((s) => (s.user ? { ...s, user: null } : s));
    window.addEventListener('md:session-expired', onExpired);
    return () => window.removeEventListener('md:session-expired', onExpired);
  }, []);

  const login = async (identifier, password) => {
    const user = await authApi.login(identifier, password);
    setState({ loading: false, user, needsSetup: false, error: '' });
    return user;
  };
  const setup = async (data) => {
    const user = await authApi.setup(data);
    setState({ loading: false, user, needsSetup: false, error: '' });
    return user;
  };
  const logout = async () => {
    try { await authApi.logout(); } finally {
      setState({ loading: false, user: null, needsSetup: false, error: '' });
    }
  };

  return (
    <AuthCtx.Provider value={{ ...state, login, setup, logout, refresh }}>
      {children}
    </AuthCtx.Provider>
  );
}

export const useAuth = () => useContext(AuthCtx);
