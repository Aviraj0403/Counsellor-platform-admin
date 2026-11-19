import Axios from '../../shared/api/Axios';

// Platform staff: organisations and their modules
export const listTenants = (params) => Axios.get('/platform/tenants', { params });
export const getTenant = (id) => Axios.get(`/platform/tenants/${id}`);
export const createTenant = (body) => Axios.post('/platform/tenants', body);
export const renameTenant = (id, name) => Axios.patch(`/platform/tenants/${id}`, { name });
// Branding: logo URL (https) and brand colour (#rrggbb); send '' to clear a field.
export const updateTenantBranding = (id, body) => Axios.patch(`/platform/tenants/${id}`, body);
export const setTenantModules = (id, modules) => Axios.patch(`/platform/tenants/${id}/modules`, { modules });
export const setTenantStatus = (id, status) => Axios.patch(`/platform/tenants/${id}/status`, { status });
// One organisation's workspace: modules with setup/health, plan and staff counts. Configuration and health only, never the organisation's own records.
export const getWorkspace = (id) => Axios.get(`/platform/tenants/${id}/workspace`);
