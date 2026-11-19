import Axios from '../../shared/api/Axios';

export const getFunnel = (params) => Axios.get('/reports/funnel', { params });
export const getSources = (params) => Axios.get('/reports/sources', { params });
export const getCounsellors = (params) => Axios.get('/reports/counsellors', { params });
export const getApplications = (params) => Axios.get('/reports/applications', { params });
export const getRevenue = (params) => Axios.get('/reports/revenue', { params });
