import axios from 'axios';
import { API_BASE_URL } from './apiConfig';
import { clearToken, getRefreshToken, getToken, setToken } from './session';

const Axios = axios.create({ baseURL: API_BASE_URL, timeout: 30000 });
// Plain client for the refresh call itself: it must not go through the interceptors below.
const bare = axios.create({ baseURL: API_BASE_URL, timeout: 30000 });

Axios.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
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
