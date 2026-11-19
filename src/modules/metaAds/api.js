import Axios from '../../shared/api/Axios';

export const getConfig = () => Axios.get('/integrations/meta/config');
export const saveConfig = (body) => Axios.put('/integrations/meta/config', body);
export const sendTest = () => Axios.post('/integrations/meta/test');
export const listEvents = () => Axios.get('/integrations/meta/events');
export const getStatus = () => Axios.get('/integrations/meta/status');
export const testConnection = () => Axios.post('/integrations/meta/connection/test');
export const syncNow = (days) => Axios.post('/integrations/meta/sync', days ? { days } : {});
export const getPerformance = (params) => Axios.get('/integrations/meta/performance', { params });
