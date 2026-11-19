import Axios from '../../shared/api/Axios';

export const listStudents = (params) => Axios.get('/students', { params });
export const getStudent = (id) => Axios.get(`/students/${id}`);
export const createStudent = (body) => Axios.post('/students', body);
export const createFromLead = (leadId, body) => Axios.post(`/students/from-lead/${leadId}`, body);
export const updateStudent = (id, body) => Axios.patch(`/students/${id}`, body);
export const exportStudent = (id) => Axios.get(`/students/${id}/export`);
export const eraseStudent = (id, body) => Axios.post(`/students/${id}/erase`, body);
// Lead search goes through the leads HTTP API (not a code import of the leads module).
export const searchLeads = (search) => Axios.get('/leads', { params: { search, limit: 8 } });
