import { useCallback, useEffect, useMemo, useState } from 'react';
import * as authApi from '../api';
import { clearToken, getRefreshToken, getToken, setToken } from '../../../shared/api/session';
import { clearActingTenant, getActingTenantId, getActingTenantStatus, setActingTenant } from '../../../shared/lib/actingTenant';
import { AuthContext } from './authContext';

/**
 * Holds "who is logged in". `me` is exactly what GET /me returns: the user, their role, the permissions of that
 * role and (for organisation users) which modules are switched on. The whole UI (menu, guards) reads from it.
 *
 * Platform staff can also ACT AS an organisation: while an acting id is stored, the API answers /me in the organisation's
 * shape (scope 'tenant', that organisation's modules, the permissions of the platform-support role, plus `actingAs`,
 * `organisation` and `platformUser`). Because `me` then looks like an organisation user, the menu, Guard, can() and
 * hasModule() need no special cases.
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
    const hadActing = !!getActingTenantId();
    authApi
      .me()
      .catch((err) => {
        // the API refused the acting header: Axios already cleared it, so the plain platform profile loads instead
        if (hadActing && !getActingTenantId()) return authApi.me();
        throw err;
      })
      .then(({ data }) => live && setMe(data))
      .catch(() => live && setMe(null))
      .finally(() => live && setLoading(false));
    return () => {
      live = false;
    };
  }, []);

  useEffect(() => {
    const onExpired = () => {
      clearActingTenant();
      setMe(null);
    };
    // Axios dropped the acting header (organisation removed / not allowed): reload the platform profile, Layout goes home.
    const onActingEnded = () => {
      authApi.me().then(({ data }) => setMe(data)).catch(() => {});
    };
    window.addEventListener('auth:expired', onExpired);
    window.addEventListener('acting:ended', onActingEnded);
    return () => {
      window.removeEventListener('auth:expired', onExpired);
      window.removeEventListener('acting:ended', onActingEnded);
    };
  }, []);

  const finish = useCallback(
    async (data) => {
      clearActingTenant(); // a fresh sign-in never inherits an old acting session
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
    clearActingTenant();
    setMe(null);
  }, []);

  /** Platform staff: start acting as an organisation ({ id, name }). Resolves with the organisation the API confirmed. */
  const startActing = useCallback(
    async (org) => {
      const { data } = await authApi.startActing(org.id);
      const tenant = data.tenant || { id: org.id, name: org.name };
      setActingTenant(tenant.id, tenant.name, tenant.status);
      try {
        await loadMe();
      } catch (err) {
        clearActingTenant();
        await loadMe().catch(() => {});
        throw err;
      }
      return tenant;
    },
    [loadMe],
  );

  /** Leave the organisation and return to the platform console profile. */
  const stopActing = useCallback(async () => {
    clearActingTenant();
    return loadMe();
  }, [loadMe]);

  const value = useMemo(() => {
    const acting = me?.actingAs || null;
    return {
      me,
      loading,
      login,
      verifyMfa,
      logout,
      refresh: loadMe,
      can: (permission) => !!me?.permissions?.includes(permission),
      // platform staff have no organisation, so "module on" only applies to organisation users (and to staff acting as one)
      hasModule: (key) => (me?.modules ? !!me.modules[key] : false),
      // acting as an organisation: { tenantId, tenantName, byUserId } or null
      acting,
      // the organisation being worked in (own organisation for its users, the acted-as one for platform staff): { name, logoUrl, brandColor }
      organisation: me?.organisation || null,
      // 'active' | 'suspended' of the organisation being acted in (from the API when /me carries it, else from the switch response)
      actingStatus: acting ? me?.organisation?.status || getActingTenantStatus() : '',
      // the real signed-in person: platform staff keep their own name while acting, everyone else is `me.user`
      staff: me?.platformUser || me?.user || null,
      canSwitchOrganisation: !!acting || (me?.scope === 'platform' && !!me?.permissions?.includes('platform:tenants:manage')),
      startActing,
      stopActing,
    };
  }, [me, loading, login, verifyMfa, logout, loadMe, startActing, stopActing]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
