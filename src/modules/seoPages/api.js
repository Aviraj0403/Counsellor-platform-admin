import Axios from '../../shared/api/Axios';

export const getSettings = () => Axios.get('/seo/settings');
export const saveSettings = (body) => Axios.put('/seo/settings', body);
export const listPages = () => Axios.get('/seo/pages');
export const getPage = (collegeId) => Axios.get(`/seo/pages/${collegeId}`);
export const savePage = (collegeId, body) => Axios.put(`/seo/pages/${collegeId}`, body);
export const deletePage = (collegeId) => Axios.delete(`/seo/pages/${collegeId}`);
export const previewPage = (collegeSlug) => Axios.get(`/seo/preview/${collegeSlug}`, { params: { format: 'json' } });
