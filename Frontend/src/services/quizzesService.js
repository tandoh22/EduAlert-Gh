import api from './api';

export const createQuiz = async (data) => {
  const response = await api.post('/quizzes', data);
  return response.data;
};

export const generateQuizQuestions = async (quizId, numQuestions = 10) => {
  const response = await api.post(`/quizzes/generate-questions/${quizId}`, null, {
    params: { num_questions: numQuestions }
  });
  return response.data;
};

export const generateQuizQuestionsFromFile = async (quizId, file, numQuestions = 10) => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await api.post(`/quizzes/generate-questions-from-file/${quizId}`, formData, {
    params: { num_questions: numQuestions },
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data;
};

export const addQuestionManually = async (quizId, data) => {
  const response = await api.post(`/quizzes/${quizId}/questions`, data);
  return response.data;
};

export const getQuizQuestions = async (quizId) => {
  const response = await api.get(`/quizzes/${quizId}/questions`);
  return response.data;
};

export const publishQuiz = async (quizId) => {
  const response = await api.post(`/quizzes/${quizId}/publish`);
  return response.data;
};

export const startQuiz = async (quizId, studentId) => {
  const response = await api.post(`/quizzes/${quizId}/start`, null, {
    params: { student_id: studentId }
  });
  return response.data;
};

export const submitQuiz = async (data) => {
  const response = await api.post('/quizzes/submit', data);
  return response.data;
};

export const getMyQuizAttempts = async () => {
  const response = await api.get('/quizzes/my-attempts');
  return response.data;
};

export const getClassQuizzes = async (classId) => {
  const response = await api.get(`/quizzes/class/${classId}`);
  return response.data;
};

export const getQuizResults = async (quizId) => {
  const response = await api.get(`/quizzes/${quizId}/results`);
  return response.data;
};

export const deleteQuiz = async (quizId) => {
  await api.delete(`/quizzes/${quizId}`);
};

export const getTeacherQuizzes = async () => {
  const response = await api.get('/quizzes/teacher');
  return response.data;
};
