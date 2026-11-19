import Axios from '../../shared/api/Axios';

export const entries = (params) => Axios.get('/ledger/entries', { params });
export const postEntry = (body) => Axios.post('/ledger/entries', body);
export const reverseEntry = (id, idempotencyKey, reason) => Axios.post(`/ledger/entries/${id}/reverse`, { idempotencyKey, reason });
export const balance = (account) => Axios.get('/ledger/balance', { params: { account } });
export const trialBalance = () => Axios.get('/ledger/trial-balance');
