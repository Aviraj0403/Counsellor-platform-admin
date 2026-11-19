import Axios from '../../shared/api/Axios';

// Superadmin: which websites may call this API (CORS whitelist). Server-config origins are read-only.
export const listDomains = () => Axios.get('/platform/domains');
export const addDomain = (body) => Axios.post('/platform/domains', body);
export const updateDomain = (id, body) => Axios.patch(`/platform/domains/${id}`, body);
export const removeDomain = (id) => Axios.delete(`/platform/domains/${id}`);

// Organisation names for the optional "belongs to" picker. Plain HTTP call, not a module dependency.
export const listOrganisations = (params) => Axios.get('/platform/tenants', { params });
