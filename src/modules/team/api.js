import Axios from '../../shared/api/Axios';

export const listTeam = () => Axios.get('/team');
export const addMember = (body) => Axios.post('/team', body);
export const setMemberStatus = (userId, status) => Axios.patch(`/team/${userId}/status`, { status });
export const setMemberRole = (userId, role) => Axios.patch(`/team/${userId}/role`, { role });
export const resetMemberPassword = (userId, newPassword) => Axios.post(`/team/${userId}/reset-password`, { newPassword });
