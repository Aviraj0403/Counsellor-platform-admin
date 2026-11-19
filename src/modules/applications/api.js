import Axios from '../../shared/api/Axios';

export const listApplications = (params) => Axios.get('/applications', { params });
export const getApplication = (id) => Axios.get(`/applications/${id}`);
export const createApplication = (body) => Axios.post('/applications', body);
export const updateApplication = (id, body) => Axios.patch(`/applications/${id}`, body);
export const changeStatus = (id, body) => Axios.post(`/applications/${id}/status`, body);
// Pickers go through the HTTP APIs of students, colleges and team (not code imports of those modules).
export const searchStudents = (search) => Axios.get('/students', { params: { search, limit: 8 } });
export const listColleges = () => Axios.get('/colleges', { params: { limit: 100 } });
export const getCollege = (id) => Axios.get(`/colleges/${id}`);
export const listTeam = () => Axios.get('/team');
