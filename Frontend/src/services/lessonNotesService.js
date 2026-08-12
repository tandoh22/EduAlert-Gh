import api from './api';

export const generateLessonNote = async (data) => {
  const response = await api.post('/lesson-notes/generate', data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data;
};

export const getMyLessonNotes = async () => {
  const response = await api.get('/lesson-notes');
  return response.data;
};

export const getSharedLessonNotes = async (subject) => {
  const params = subject ? { subject } : {};
  const response = await api.get('/lesson-notes/shared', { params });
  return response.data;
};

export const shareLessonNote = async (noteId) => {
  const response = await api.post(`/lesson-notes/${noteId}/share`);
  return response.data;
};

export const getLessonNote = async (noteId) => {
  const response = await api.get(`/lesson-notes/${noteId}`);
  return response.data;
};

export const deleteLessonNote = async (noteId) => {
  await api.delete(`/lesson-notes/${noteId}`);
};
