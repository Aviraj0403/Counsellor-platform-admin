// Login tokens live in sessionStorage (per tab, cleared when the tab closes). Wrapped in try/catch because
// storage can be blocked (private windows, strict browsers): the app then simply asks to sign in again.
const KEY = 'cp_admin_token';
const REFRESH_KEY = 'cp_admin_refresh';

const read = (key) => {
  try {
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
};
const write = (key, value) => {
  try {
    sessionStorage.setItem(key, value);
  } catch {
    /* storage blocked: user will sign in again on reload */
  }
};
const remove = (key) => {
  try {
    sessionStorage.removeItem(key);
  } catch {
    /* nothing to clear */
  }
};

export const getToken = () => read(KEY);
export const getRefreshToken = () => read(REFRESH_KEY);
/** Stores the access token and, when the server sent one, the refresh token. */
export const setToken = (token, refreshToken) => {
  write(KEY, token);
  if (refreshToken) write(REFRESH_KEY, refreshToken);
};
export const clearToken = () => {
  remove(KEY);
  remove(REFRESH_KEY);
};
