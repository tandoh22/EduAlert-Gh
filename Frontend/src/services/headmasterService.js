import api from './api';

export const fetchPendingUsers = () => api.get('/auth/pending-users');

export const fetchOverview = () => api.get('/students/overview');

export const fetchAtRiskStudents = () => api.get('/predictions/at-risk');

export const runSchoolWidePredictions = () => api.post('/predictions/run-all-school');

export const fetchStudentPerformance = (studentId) => api.get(`/students/${studentId}/performance`);

export const fetchClasses = () => api.get('/classes/');

export const createClass = (data) => api.post('/classes/', data);

export const updateClass = (classId, data) => api.put(`/classes/${classId}`, data);

export const deleteClass = (classId) => api.delete(`/classes/${classId}`);

export const approveUser = (userId, assignments) =>
  api.post(`/auth/approve-user/${userId}`, { assignments });

export const rejectUser = (userId) => api.post(`/auth/reject-user/${userId}`);