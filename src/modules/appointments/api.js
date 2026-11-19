import Axios from '../../shared/api/Axios';

// appointments
export const listAppointments = (params) => Axios.get('/appointments', { params });
export const getSummary = () => Axios.get('/appointments/summary');
export const getSlots = (params) => Axios.get('/appointments/slots', { params });
export const bookAppointment = (body) => Axios.post('/appointments', body);
export const rescheduleAppointment = (id, body) => Axios.post(`/appointments/${id}/reschedule`, body);
export const cancelAppointment = (id, reason) => Axios.post(`/appointments/${id}/cancel`, { reason });
export const confirmAppointment = (id) => Axios.post(`/appointments/${id}/confirm`);
export const completeAppointment = (id, notes) => Axios.post(`/appointments/${id}/complete`, { notes });
export const markNoShow = (id) => Axios.post(`/appointments/${id}/no-show`);

// appointment types
export const listTypes = (params) => Axios.get('/appointments/types', { params });
export const createType = (body) => Axios.post('/appointments/types', body);
export const updateType = (id, body) => Axios.patch(`/appointments/types/${id}`, body);

// availability
export const getHours = (counsellorId) => Axios.get(`/appointments/hours/${counsellorId}`);
export const saveHours = (counsellorId, weekly) => Axios.put(`/appointments/hours/${counsellorId}`, { weekly });
export const listTimeOff = (params) => Axios.get('/appointments/time-off', { params });
export const addTimeOff = (body) => Axios.post('/appointments/time-off', body);
export const removeTimeOff = (id) => Axios.delete(`/appointments/time-off/${id}`);

// waiting list
export const listWaitlist = (params) => Axios.get('/appointments/waitlist', { params });
export const addWaitlist = (body) => Axios.post('/appointments/waitlist', body);
export const expireWaitlist = (id) => Axios.post(`/appointments/waitlist/${id}/expire`);

// helpers that read other endpoints the logged-in person may already use
export const listTeam = () => Axios.get('/team');
export const searchLeads = (search) => Axios.get('/leads', { params: { search, limit: 5 } });
