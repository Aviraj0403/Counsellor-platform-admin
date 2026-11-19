import Axios from '../../shared/api/Axios';

export const getSettings = () => Axios.get('/bots/settings');
export const saveSettings = (body) => Axios.put('/bots/settings', body);
export const listConversations = (params) => Axios.get('/bots/conversations', { params });
export const getConversation = (id) => Axios.get(`/bots/conversations/${id}`);
export const takeover = (id) => Axios.post(`/bots/conversations/${id}/takeover`);
export const closeConversation = (id) => Axios.post(`/bots/conversations/${id}/close`);
export const getSummary = (params) => Axios.get('/bots/summary', { params });
export const purge = () => Axios.post('/bots/purge');
export const testMessage = (body) => Axios.post('/bots/test', body);
