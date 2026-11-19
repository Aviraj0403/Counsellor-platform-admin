import Axios from '../../shared/api/Axios';

export const login = (email, password) => Axios.post('/auth/login', { email, password });
export const verifyMfa = (mfaToken, payload) => Axios.post('/auth/mfa/verify', { mfaToken, ...payload });
export const logout = (refreshToken) => Axios.post('/auth/logout', { refreshToken });
export const me = () => Axios.get('/me');
export const changePassword = (currentPassword, newPassword) => Axios.post('/auth/change-password', { currentPassword, newPassword });
export const logoutEverywhere = () => Axios.post('/auth/logout-all');
export const mfaSetup = () => Axios.post('/auth/mfa/setup');
export const mfaEnable = (code) => Axios.post('/auth/mfa/enable', { code });
export const mfaDisable = (password, code) => Axios.post('/auth/mfa/disable', { password, code });
