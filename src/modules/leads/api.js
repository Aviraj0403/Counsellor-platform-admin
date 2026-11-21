import Axios from '../../shared/api/Axios';

export const listLeads = (params) => Axios.get('/leads', { params });
export const createLead = (body) => Axios.post('/leads', body);
export const changeStage = (id, stage, note) => Axios.patch(`/leads/${id}/stage`, { stage, note });
export const assignLead = (id, body) => Axios.patch(`/leads/${id}/assign`, body);
export const getLead = (id) => Axios.get(`/leads/${id}`);
export const importLeads = (body) => Axios.post('/leads/import', body);
export const getPoptinConfig = () => Axios.get('/leads/poptin/config');
export const savePoptinConfig = (body) => Axios.put('/leads/poptin/config', body);
