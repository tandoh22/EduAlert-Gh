import { useEffect, useState } from 'react'
import { fetchStudents, createStudent } from '../services/studentService'
import PageHeader from '../components/PageHeader'

export default function Students() {
  const [students, setStudents] = useState([])
  const [name, setName] = useState('')
  const [studentClass, setStudentClass] = useState('')
  const [gender, setGender] = useState('Male')
  const [message, setMessage] = useState('')

  useEffect(() => {
    loadStudents()
  }, [])

  const loadStudents = async () => {
    try {
      const response = await fetchStudents()
      setStudents(response.data)
    } catch (error) {
      setMessage('Unable to load student list yet.')
    }
  }

  const handleCreate = async (event) => {
    event.preventDefault()
    setMessage('')

    try {
      await createStudent({ full_name: name, class_name: studentClass, gender })
      setName('')
      setStudentClass('')
      setGender('Male')
      setMessage('Student added successfully.')
      loadStudents()
    } catch (error) {
      setMessage('Unable to add student. Check backend API.')
    }
  }

  return (
    <div>
      <PageHeader title="Students" subtitle="View and add students for your classroom." />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="edu-card p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-5">Add a student</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Name</label>
                <input 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  required 
                  placeholder="Enter student name"
                  className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Class</label>
                <input 
                  value={studentClass} 
                  onChange={(e) => setStudentClass(e.target.value)} 
                  required 
                  placeholder="Enter class"
                  className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Gender</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 bg-white"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>
              <button 
                type="submit" 
                className="w-full px-6 py-2.5 bg-[#0A192F] text-white text-sm font-semibold rounded-xl hover:bg-[#0F2647] transition-colors"
              >
                Create student
              </button>
            </form>
            {message && <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-700">{message}</div>}
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="edu-card p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-5">Student roster</h2>
            {students.length === 0 ? (
              <p className="text-sm text-slate-500">No students available yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left text-xs font-semibold text-slate-600 uppercase tracking-wider pb-3">Name</th>
                      <th className="text-left text-xs font-semibold text-slate-600 uppercase tracking-wider pb-3">Class</th>
                      <th className="text-left text-xs font-semibold text-slate-600 uppercase tracking-wider pb-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((student) => (
                      <tr key={student.id || student.email || student.full_name} className="border-b border-slate-100 last:border-0">
                        <td className="py-3 text-sm text-slate-900">{student.full_name || student.name}</td>
                        <td className="py-3 text-sm text-slate-600">{student.class_name || student.class || 'N/A'}</td>
                        <td className="py-3">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                            {student.status || 'Active'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
