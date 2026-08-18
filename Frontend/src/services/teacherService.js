import api from './api';

export const fetchTeacherDashboard = () => api.get('/teacher/dashboard');
export const fetchMyClasses = () => api.get('/classes/my-classes');
