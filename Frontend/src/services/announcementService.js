import api from './api';

export const createAnnouncement = async (data) => {
  const response = await api.post('/announcements', data);
  return response.data;
};

export const getAnnouncements = async () => {
  const response = await api.get('/announcements');
  return response.data;
};

export const getClassAnnouncements = async (classId) => {
  const response = await api.get(`/announcements/class/${classId}`);
  return response.data;
};

export const deleteAnnouncement = async (id) => {
  await api.delete(`/announcements/${id}`);
};
