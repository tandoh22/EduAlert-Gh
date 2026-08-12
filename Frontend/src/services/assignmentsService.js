import api from './api';

export const createAssignment = async (data) => {
  const response = await api.post('/assignments', data);
  return response.data;
};

export const getAssignments = async () => {
  const response = await api.get('/assignments');
  return response.data;
};

export const getClassAssignments = async (classId) => {
  const response = await api.get(`/assignments/class/${classId}`);
  return response.data;
};

export const getAssignment = async (assignmentId) => {
  const response = await api.get(`/assignments/${assignmentId}`);
  return response.data;
};

export const deleteAssignment = async (assignmentId) => {
  await api.delete(`/assignments/${assignmentId}`);
};

export const submitAssignment = async (data) => {
  const response = await api.post('/assignments/submit', data);
  return response.data;
};

export const getMySubmissions = async () => {
  const response = await api.get('/assignments/my-submissions');
  return response.data;
};

export const getSubmissions = async (assignmentId) => {
  const response = await api.get(`/assignments/${assignmentId}/submissions`);
  return response.data;
};

export const gradeSubmission = async (submissionId, teacherScore) => {
  const response = await api.put(`/assignments/submissions/${submissionId}/grade`, null, {
    params: { teacher_score: teacherScore }
  });
  return response.data;
};
