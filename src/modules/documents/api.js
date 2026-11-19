import Axios from '../../shared/api/Axios';

export const listDocuments = (params) => Axios.get('/documents', { params });
export const getChecklist = (params) => Axios.get('/documents/checklist', { params });
export const getQueue = (params) => Axios.get('/documents/queue', { params });
// The file is sent as the raw request body; the server detects the real type from the bytes.
export const uploadDocument = (file, params) =>
  Axios.post('/documents', file, { params, headers: { 'Content-Type': 'application/octet-stream', 'x-file-name': encodeURIComponent(file.name) } });
export const verifyDocument = (id) => Axios.post(`/documents/${id}/verify`);
export const rejectDocument = (id, reason) => Axios.post(`/documents/${id}/reject`, { reason });
export const deleteDocument = (id) => Axios.delete(`/documents/${id}`);
export const downloadLink = (id) => Axios.post(`/documents/${id}/download-link`);
