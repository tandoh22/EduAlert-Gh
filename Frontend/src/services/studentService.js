import api from './api'

export const fetchStudents = () => api.get('/students')
export const createStudent = (payload) => api.post('/students', payload)
