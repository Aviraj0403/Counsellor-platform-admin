import Axios from '../../shared/api/Axios';

export const listTasks = (params) => Axios.get('/followups/tasks', { params });
export const createTask = (body) => Axios.post('/followups/tasks', body);
export const updateTask = (id, body) => Axios.patch(`/followups/tasks/${id}`, body);
export const completeTask = (id, outcome) => Axios.post(`/followups/tasks/${id}/complete`, { outcome });
export const deleteTask = (id) => Axios.delete(`/followups/tasks/${id}`);
export const listActivities = (params) => Axios.get('/followups/activities', { params });
export const logActivity = (body) => Axios.post('/followups/activities', body);
export const getSummary = () => Axios.get('/followups/summary');
