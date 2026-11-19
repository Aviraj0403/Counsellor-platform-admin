// Single place the API address is read. Must end with /api/v1.
export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:4100/api/v1').replace(/\/+$/, '');
export const SUPPORT_EMAIL = import.meta.env.VITE_SUPPORT_EMAIL || '';
