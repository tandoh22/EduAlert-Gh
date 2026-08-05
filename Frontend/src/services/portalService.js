import api from './api';

export const fetchMyProfile = () => api.get('/students/me');

export const fetchClassAssignments = (classId) =>
  api.get(`/assignments/class/${classId}`);

export const fetchMySubmissions = () => api.get('/assignments/my-submissions');

export const submitAssignment = (payload) => {
  if (payload instanceof FormData) {
    return api.post('/assignments/submit', payload, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  }
  return api.post('/assignments/submit', payload);
};

export const fetchClassQuizzes = (classId) => api.get(`/quizzes/class/${classId}`);

export const fetchQuizQuestions = (quizId) => api.get(`/quizzes/${quizId}/questions`);

export const startQuiz = (quizId, studentId) =>
  api.post(`/quizzes/${quizId}/start`, null, { params: { student_id: studentId } });

export const submitQuiz = (payload) => api.post('/quizzes/submit', payload);

export const fetchMyQuizAttempts = () => api.get('/quizzes/my-attempts');

export const fetchSharedLessonNotes = (subject) =>
  api.get('/lesson-notes/shared', { params: subject ? { subject } : {} });

export const fetchResources = (params = {}) => api.get('/resources', { params });

export const fetchSchoolAnnouncements = () => api.get('/announcements/');

export const fetchClassAnnouncements = (classId) =>
  api.get(`/announcements/class/${classId}`);

export const fetchMyScores = () => api.get('/scores/me');

export const fetchMyAttendance = () => api.get('/attendance/me');

export const fetchStudyCards = (studentId) =>
  api.get(`/study-cards/student/${studentId}`);

export const generateStudyCards = (formData) =>
  api.post('/study-cards/generate', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

export const fetchAssignment = (assignmentId) => api.get(`/assignments/${assignmentId}`);

export const fetchQuiz = (quizId) => api.get(`/quizzes/${quizId}`);

export const runPrediction = (studentId) => api.post(`/predictions/run/${studentId}`);

export const recordAttendance = (payload) => api.post('/attendance/', payload);
