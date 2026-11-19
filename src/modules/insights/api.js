import Axios from '../../shared/api/Axios';

// Aggregated research across organisations: counts only, never student-level data
export const funnel = () => Axios.get('/platform/insights/funnel');
export const usage = () => Axios.get('/platform/insights/usage');
