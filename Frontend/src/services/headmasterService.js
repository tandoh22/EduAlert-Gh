import api from './api';

export const fetchPendingUsers = () => api.get('/auth/pending-users');

export const fetchClasses = () => api.get('/classes/');

export const createClass = (data) => api.post('/classes/', data);

export const updateClass = (classId, data) => api.put(`/classes/${classId}`, data);

export const deleteClass = (classId) => api.delete(`/classes/${classId}`);

export const approveUser = (userId, assignments) =>
  api.post(`/auth/approve-user/${userId}`, { assignments });

export const rejectUser = (userId) => api.post(`/auth/reject-user/${userId}`);