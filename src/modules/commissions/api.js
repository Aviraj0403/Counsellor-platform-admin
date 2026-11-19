import Axios from '../../shared/api/Axios';

export const listRules = () => Axios.get('/commissions/rules');
export const createRule = (body) => Axios.post('/commissions/rules', body);
export const updateRule = (id, body) => Axios.patch(`/commissions/rules/${id}`, body);
export const deleteRule = (id) => Axios.delete(`/commissions/rules/${id}`);
export const listAccruals = (params) => Axios.get('/commissions', { params });
export const getSummary = () => Axios.get('/commissions/summary');
export const payout = (body) => Axios.post('/commissions/payouts', body);
export const collect = (id, body) => Axios.post(`/commissions/${id}/collect`, body);
export const reverse = (id, body) => Axios.post(`/commissions/${id}/reverse`, body);
// College picker goes through the colleges HTTP API (not a code import).
export const listColleges = () => Axios.get('/colleges', { params: { limit: 100 } });
