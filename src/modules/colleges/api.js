import Axios from '../../shared/api/Axios';

export const listColleges = (params) => Axios.get('/colleges', { params });
export const getCollege = (id) => Axios.get(`/colleges/${id}`);
export const createCollege = (body) => Axios.post('/colleges', body);
export const updateCollege = (id, body) => Axios.patch(`/colleges/${id}`, body);
export const deactivateCollege = (id) => Axios.delete(`/colleges/${id}`);
export const createCourse = (id, body) => Axios.post(`/colleges/${id}/courses`, body);
export const updateCourse = (id, courseId, body) => Axios.patch(`/colleges/${id}/courses/${courseId}`, body);
export const deactivateCourse = (id, courseId) => Axios.delete(`/colleges/${id}/courses/${courseId}`);
export const importColleges = (rows) => Axios.post('/colleges/import', { rows });
export const shortlist = (body) => Axios.post('/colleges/shortlist', body);
