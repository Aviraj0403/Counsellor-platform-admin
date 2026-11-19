import { useCallback, useEffect, useMemo, useState } from 'react';
import * as authApi from '../api';
import { clearToken, getRefreshToken, getToken, setToken } from '../../../shared/api/session';
import { AuthContext } from './authContext';

/**
 * Holds "who is logged in". `me` is exactly what GET /me returns: the user, their role, the permissions of that
 * role and (for organisation users) which modules are switched on. The whole UI (menu, guards) reads from it.
 */
export default function AuthProvider({ children }) {
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(() => !!getToken());

  const loadMe = useCallback(async () => {
    const { data } = await authApi.me();
    setMe(data);
    return data;
  }, []);

  useEffect(() => {
    if (!getToken()) return undefined;
    let live = true;
    authApi
      .me()
      .then(({ data }) => live && setMe(data))
      .catch(() => live && setMe(null))
      .finally(() => live && setLoading(false));
    return () => {
      live = false;
    };
  }, []);

  useEffect(() => {
    const onExpired = () => setMe(null);
    window.addEventListener('auth:expired', onExpired);
    return () => window.removeEventListener('auth:expired', onExpired);
  }, []);

  const finish = useCallback(
    async (data) => {
      setToken(data.token, data.refreshToken);
      return loadMe();
    },
    [loadMe],
  );

  // Returns { mfaRequired, mfaToken } when a second step is needed, otherwise the loaded profile.
  const login = useCallback(
    async (email, password) => {
      const { data } = await authApi.login(email, password);
      if (data.mfaRequired) return { mfaRequired: true, mfaToken: data.mfaToken };
      return finish(data);
    },
    [finish],
  );

  const verifyMfa = useCallback(async (mfaToken, payload) => finish((await authApi.verifyMfa(mfaToken, payload)).data), [finish]);

  const logout = useCallback(() => {
    const refreshToken = getRefreshToken();
    if (refreshToken) authApi.logout(refreshToken).catch(() => {}); // best effort: ends this login on the server
    clearToken();
    setMe(null);
  }, []);

  const value = useMemo(
    () => ({
      me,
      loading,
      login,
      verifyMfa,
      logout,
      refresh: loadMe,
      can: (permission) => !!me?.permissions?.includes(permission),
      // platform staff have no organisation, so "module on" only applies to organisation users
      hasModule: (key) => (me?.modules ? !!me.modules[key] : false),
    }),
    [me, loading, login, verifyMfa, logout, loadMe],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
