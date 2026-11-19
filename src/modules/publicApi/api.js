import Axios from '../../shared/api/Axios';

export const getMeta = () => Axios.get('/integrations/api/meta');
export const listKeys = () => Axios.get('/integrations/api/keys');
export const createKey = (body) => Axios.post('/integrations/api/keys', body);
export const revokeKey = (id) => Axios.post(`/integrations/api/keys/${id}/revoke`);
export const listColleges = () => Axios.get('/colleges', { params: { limit: 100 } });

export const listWebhooks = () => Axios.get('/integrations/api/webhooks');
export const createWebhook = (body) => Axios.post('/integrations/api/webhooks', body);
export const updateWebhook = (id, body) => Axios.patch(`/integrations/api/webhooks/${id}`, body);
export const deleteWebhook = (id) => Axios.delete(`/integrations/api/webhooks/${id}`);
export const listDeliveries = (params) => Axios.get('/integrations/api/deliveries', { params });
export const retryDelivery = (id) => Axios.post(`/integrations/api/deliveries/${id}/retry`);
export const retryDue = () => Axios.post('/integrations/api/webhooks/retry');
