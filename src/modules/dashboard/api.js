import Axios from '../../shared/api/Axios';

// Read-only calls the Home screens make. Plain HTTP (same pattern as the other modules), no code import of other feature modules.

// platform staff
export const platformMoney = (month) => Axios.get('/platform/dashboard', { params: { month } });
export const recentOrganisations = (limit = 100) => Axios.get('/platform/tenants', { params: { page: 1, limit } });

// organisation users (each returns only what the signed-in person may see)
export const myTaskSummary = () => Axios.get('/followups/summary');
export const newLeads = () => Axios.get('/leads', { params: { stage: 'new', limit: 1 } });
export const appointmentSummary = () => Axios.get('/appointments/summary');
export const latestApplications = () => Axios.get('/applications', { params: { limit: 100 } });
