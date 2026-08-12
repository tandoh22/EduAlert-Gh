import api from './api';

export const loginUser = async (credentials) => {
  const response = await api.post('/auth/login', credentials);
  localStorage.setItem('edualert_token', response.data.access_token);
  localStorage.setItem('edualert_user', JSON.stringify(response.data.user));
  return response.data;
};

export const registerUser = async (data) => {
  const response = await api.post('/auth/register', data);
  return response.data;
};

export const getStoredUser = () => {
  const raw = localStorage.getItem('edualert_user');
  return raw ? JSON.parse(raw) : null;
};

export const getInitials = (name) => {
  if (!name) return '?';
  return name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
};

export const logout = () => {
  localStorage.removeItem('edualert_token');
  localStorage.removeItem('edualert_user');
  localStorage.removeItem('edualert_student_profile');
};