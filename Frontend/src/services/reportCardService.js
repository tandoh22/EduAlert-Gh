import api from './api';

export const fetchClassStudentScores = async (className, subject) => {
  const response = await api.get('/report-cards/class-students-scores', {
    params: { class_name: className, subject: subject }
  });
  return response.data;
};

export const fetchClassCompiledTranscripts = async (className, term, year) => {
  const response = await api.get('/report-cards/class-compiled-transcripts', {
    params: { class_name: className, term, year }
  });
  return response.data;
};

export const distributeClassTranscripts = async (payload) => {
  const response = await api.post('/report-cards/distribute-transcripts', payload);
  return response.data;
};

export const generateReportCard = async (data) => {
  const response = await api.post('/report-cards/generate', data);
  return response.data;
};

export const generateResults = generateReportCard;

export const approveReportCard = async (reportId, teacherComment) => {
  const response = await api.put(`/report-cards/${reportId}/approve`, null, {
    params: { teacher_comment: teacherComment }
  });
  return response.data;
};

export const getStudentReportCards = async (studentId) => {
  const response = await api.get(`/report-cards/student/${studentId}`);
  return response.data;
};

export const getMyTranscripts = async () => {
  const response = await api.get('/report-cards/my-transcripts');
  return response.data;
};

export const getAllReportCards = async (term, year) => {
  const response = await api.get('/report-cards', {
    params: { term, year }
  });
  return response.data;
};

export const deleteReportCard = async (reportId) => {
  await api.delete(`/report-cards/${reportId}`);
};
