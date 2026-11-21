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

// Broadcast campaigns
export const listCampaigns = () => Axios.get('/whatsapp/campaigns');
export const getCampaign = (id) => Axios.get(`/whatsapp/campaigns/${id}`);
export const createCampaign = (body) => Axios.post('/whatsapp/campaigns', body);
export const executeCampaign = (id) => Axios.post(`/whatsapp/campaigns/${id}/execute`);

// Recipient pickers for the "Send message" tab. They use the leads / students HTTP APIs directly (same approach as appointments and students),
// not a code import of those modules. A role without leads:read / students:read simply gets no suggestions.
export const searchLeads = (search) => Axios.get('/leads', { params: { search, limit: 6 } });
export const searchStudents = (search) => Axios.get('/students', { params: { search, limit: 6 } });
