// Single place the API address is read. Must end with /api/v1.
export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:4100/api/v1').replace(/\/+$/, '');
/** The API server's own address (no /api/v1): public webhooks, embed scripts and predictor links live here, NOT on the admin site's domain. */
export const API_ORIGIN = API_BASE_URL.replace(/\/api\/v1$/, '');
export const SUPPORT_EMAIL = import.meta.env.VITE_SUPPORT_EMAIL || '';
