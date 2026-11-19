import axios from 'axios';
import { API_BASE_URL } from './apiConfig';
import toast from 'react-hot-toast';
import { clearActingTenant, getActingTenantId } from '../lib/actingTenant';
import { clearToken, getRefreshToken, getToken, setToken } from './session';

const Axios = axios.create({ baseURL: API_BASE_URL, timeout: 30000 });
// Plain client for the refresh call itself: it must not go through the interceptors below.
const bare = axios.create({ baseURL: API_BASE_URL, timeout: 30000 });

Axios.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  // Platform staff acting as an organisation: every call is made on that organisation's behalf. Sign-in/refresh/MFA never carry it.
  const acting = getActingTenantId();
  if (acting && !/^\/?auth\//.test(config.url || '')) config.headers['x-acting-tenant'] = acting;
  return config;
});

// One refresh at a time: parallel 401s all wait for the same promise.
let inflight = null;
const refreshTokens = () => {
  if (!inflight) {
    const refreshToken = getRefreshToken();
    inflight = (refreshToken ? bare.post('/auth/refresh', { refreshToken }) : Promise.reject(new Error('no refresh token')))
      .then(({ data }) => {
        setToken(data.token, data.refreshToken);
        return data.token;
      })
      .finally(() => {
        inflight = null;
      });
  }
  return inflight;
};

const NO_REFRESH = ['/auth/login', '/auth/refresh', '/auth/mfa/verify'];

// A 401 means the access token ended. Refresh once and retry the original request; if that fails the session is
// gone (revoked, expired, blocked): drop it and tell AuthProvider, which sends the user to /signin.
Axios.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config;
    // The API refused the acting header (organisation gone, or no longer allowed): leave acting mode, back to the console.
    const status = err.response?.status;
    const code = String(err.response?.data?.error?.code || '');
    const sentActing = !!original?.headers?.['x-acting-tenant'];
    if (sentActing && (status === 403 || status === 404) && (/(^|\/)me$/.test(original.url || '') || /ACTING|TENANT/i.test(code))) {
      clearActingTenant();
      toast.error('That organisation is no longer available. You are back in the platform console.');
      window.dispatchEvent(new Event('acting:ended'));
      return Promise.reject(err);
    }
    const skip = !original || NO_REFRESH.some((p) => original.url?.includes(p));
    if (err.response?.status !== 401 || skip) return Promise.reject(err);
    if (!original._retried) {
      original._retried = true;
      try {
        const token = await refreshTokens();
        original.headers.Authorization = `Bearer ${token}`;
        return Axios(original);
      } catch {
        /* fall through: sign out */
      }
    }
    clearToken();
    window.dispatchEvent(new Event('auth:expired'));
    return Promise.reject(err);
  },
);

export default Axios;
