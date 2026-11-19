import Axios from '../../shared/api/Axios';

// ---- staff: invites
export const inviteStudent = (studentId) => Axios.post('/portal/student-invites', { studentId });
export const listStudentInvites = (params) => Axios.get('/portal/student-invites', { params });
export const disableStudentInvite = (id) => Axios.post(`/portal/student-invites/${id}/disable`);
export const inviteCollege = (body) => Axios.post('/portal/college-invites', body);
export const listCollegeInvites = (params) => Axios.get('/portal/college-invites', { params });
export const disableCollegeInvite = (id) => Axios.post(`/portal/college-invites/${id}/disable`);
// Pickers use the students / colleges HTTP API (not a code import of those modules).
export const searchStudents = (search) => Axios.get('/students', { params: { search, limit: 8 } });
export const listColleges = () => Axios.get('/colleges', { params: { limit: 100 } });

// ---- student portal
export const studentOverview = () => Axios.get('/portal/student/overview');
export const studentUpload = (file, params) =>
  Axios.post('/portal/student/documents', file, { params, headers: { 'Content-Type': 'application/octet-stream', 'x-file-name': encodeURIComponent(file.name) } });

// ---- college portal
export const collegeApplications = (params) => Axios.get('/portal/college/applications', { params });
export const collegeApplication = (id) => Axios.get(`/portal/college/applications/${id}`);
export const collegeSetStatus = (id, body) => Axios.post(`/portal/college/applications/${id}/status`, body);
export const collegeDocuments = (id) => Axios.get(`/portal/college/applications/${id}/documents`);
export const collegeDownloadLink = (id, docId) => Axios.post(`/portal/college/applications/${id}/documents/${docId}/download-link`);
