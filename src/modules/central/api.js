import Axios from '../../shared/api/Axios';

// Platform staff (superadmin): one view over every organisation's records. Read-only, masked, audited.
export const summary = (params) => Axios.get('/platform/central/summary', { params });
// resource: leads | students | applications | documents
export const list = (resource, params) => Axios.get(`/platform/central/${resource}`, { params });
