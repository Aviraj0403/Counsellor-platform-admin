import Axios from '../../shared/api/Axios';

export const sendMessage = (body) => Axios.post('/whatsapp/send', body);
export const listMessages = (params) => Axios.get('/whatsapp/messages', { params });
export const processDue = () => Axios.post('/whatsapp/process-due');
export const listTemplates = () => Axios.get('/whatsapp/templates');
export const createTemplate = (body) => Axios.post('/whatsapp/templates', body);
export const updateTemplate = (id, body) => Axios.patch(`/whatsapp/templates/${id}`, body);
export const deleteTemplate = (id) => Axios.delete(`/whatsapp/templates/${id}`);
export const listRules = () => Axios.get('/whatsapp/rules');
export const createRule = (body) => Axios.post('/whatsapp/rules', body);
export const updateRule = (id, body) => Axios.patch(`/whatsapp/rules/${id}`, body);
export const deleteRule = (id) => Axios.delete(`/whatsapp/rules/${id}`);
