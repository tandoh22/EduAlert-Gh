import api from './api';

export const uploadResource = async (data) => {
  const response = await api.post('/resources', data);
  return response.data;
};

export const getResources = async (filters = {}) => {
  const response = await api.get('/resources', { params: filters });
  return response.data;
};

export const getResource = async (resourceId) => {
  const response = await api.get(`/resources/${resourceId}`);
  return response.data;
};

export const deleteResource = async (resourceId) => {
  await api.delete(`/resources/${resourceId}`);
};
