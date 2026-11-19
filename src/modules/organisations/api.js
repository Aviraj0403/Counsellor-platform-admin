import Axios from '../../shared/api/Axios';

// Platform staff: organisations and their modules
export const listTenants = (params) => Axios.get('/platform/tenants', { params });
export const getTenant = (id) => Axios.get(`/platform/tenants/${id}`);
export const createTenant = (body) => Axios.post('/platform/tenants', body);
export const renameTenant = (id, name) => Axios.patch(`/platform/tenants/${id}`, { name });
export const setTenantModules = (id, modules) => Axios.patch(`/platform/tenants/${id}/modules`, { modules });
export const setTenantStatus = (id, status) => Axios.patch(`/platform/tenants/${id}/status`, { status });
