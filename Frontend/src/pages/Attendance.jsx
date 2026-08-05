import { useState } from 'react'
import { recordAttendance } from '../services/portalService'
import PageHeader from '../components/PageHeader'

export default function Attendance() {
  const [studentId, setStudentId] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [status, setStatus] = useState('present')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)
    setMessage('')
    setError('')

    try {
      const response = await recordAttendance({
        student_id: parseInt(studentId),
        date: date,
        status: status
      })
      setMessage(`Attendance recorded for student ${studentId} (${status}).`)
      setStudentId('')
      setDate(new Date().toISOString().split('T')[0])
      setStatus('present')
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to record attendance. Please check the student ID and try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <PageHeader title="Attendance" subtitle="Record daily attendance and keep classroom attendance up to date." />

      <div className="edu-card p-6 max-w-2xl">
        <h2 className="text-lg font-semibold text-slate-900 mb-5">Record attendance</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Student ID</label>
            <input 
              type="number" 
              value={studentId} 
              onChange={(e) => setStudentId(e.target.value)} 
              required 
              placeholder="Enter student ID"
              className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Date</label>
            <input 
              type="date" 
              value={date} 
              onChange={(e) => setDate(e.target.value)} 
              required 
              className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Status</label>
            <select 
              value={status} 
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            >
              <option value="present">Present</option>
              <option value="absent">Absent</option>
              <option value="late">Late</option>
            </select>
          </div>
          <button 
            type="submit" 
            className="w-full px-6 py-2.5 bg-[#0A192F] text-white text-sm font-semibold rounded-xl hover:bg-[#0F2647] disabled:opacity-60 transition-colors"
            disabled={loading}
          >
            {loading ? 'Submitting...' : 'Submit'}
          </button>
        </form>
        {message && <div className="mt-4 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-700">{message}</div>}
        {error && <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{error}</div>}
      </div>
    </div>
  )
}
