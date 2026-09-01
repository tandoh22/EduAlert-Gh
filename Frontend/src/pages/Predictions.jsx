import { useState, useEffect } from 'react'
import { runPrediction } from '../services/portalService'
import { fetchStudents } from '../services/studentService'
import PageHeader from '../components/PageHeader'
import { Sparkles, Loader2, CheckCircle2, AlertTriangle, UserCheck } from 'lucide-react'

export default function Predictions() {
  const [studentId, setStudentId] = useState('')
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)

  useEffect(() => {
    fetchStudents()
      .then((res) => {
        setStudents(res.data || [])
      })
      .catch((err) => {
        console.error('Failed to load students list for suggestions:', err)
      })
  }, [])

  const runPredictionHandler = async (event) => {
    event.preventDefault()
    const trimmedId = studentId.trim()
    if (!trimmedId) return

    setLoading(true)
    setMessage('')
    setError('')
    setResult(null)

    try {
      const response = await runPrediction(trimmedId)
      setResult(response.data)
      setMessage(`AI prediction completed for student ${trimmedId}: ${response.data.risk_level} Risk`)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to run prediction. Please check the student ID and try again.')
    } finally {
      setLoading(false)
    }
  }

  const getRiskBadgeColor = (level) => {
    const l = (level || '').toLowerCase()
    if (l === 'high') return 'bg-red-100 text-red-700 border-red-200'
    if (l === 'medium') return 'bg-amber-100 text-amber-700 border-amber-200'
    return 'bg-emerald-100 text-emerald-700 border-emerald-200'
  }

  const formattedConfidence = result?.confidence_score != null
    ? `${result.confidence_score <= 1 ? Math.round(result.confidence_score * 100) : Math.round(result.confidence_score)}%`
    : 'N/A'

  return (
    <div className="space-y-6">
      <PageHeader
        title="AI Early Warning & Risk Predictions"
        subtitle="Run student risk assessments using AI to identify who needs academic attention and intervention early."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="edu-card p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-2 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              Run Student Risk Assessment
            </h2>
            <p className="text-xs text-slate-500 mb-6">
              Enter an alphanumeric Student ID (e.g. <strong>ACH2025001</strong>) or database ID to analyze score trends, attendance patterns, and generate early warning intervention suggestions.
            </p>

            <form onSubmit={runPredictionHandler} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  Student ID / Identifier
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    required
                    placeholder="Enter student ID (e.g., ACH2025001 or Kwame Mensah)"
                    list="student-id-options"
                    className="w-full px-4 py-3 text-sm font-medium border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                  <datalist id="student-id-options">
                    {students.map((s) => (
                      <option key={s.id} value={s.student_id || s.id}>
                        {s.full_name} ({s.class_name || 'Enrolled'})
                      </option>
                    ))}
                  </datalist>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Accepts letters and numbers (alphanumeric ID). You can pick from your class roster.
                </p>
              </div>

              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-[#0A192F] text-white text-sm font-semibold rounded-xl hover:bg-[#0F2647] disabled:opacity-60 transition-colors shadow-sm"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                    Running AI Risk Model...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    Run AI Risk Assessment
                  </>
                )}
              </button>
            </form>

            {message && (
              <div className="mt-5 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-sm text-emerald-800 font-medium">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>{message}</span>
              </div>
            )}

            {error && (
              <div className="mt-5 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-sm text-red-700 font-medium">
                <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {result && (
              <div className="mt-6 p-6 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <UserCheck className="w-5 h-5 text-emerald-600" />
                    Assessment Results
                  </h3>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getRiskBadgeColor(result.risk_level)}`}>
                    {result.risk_level} Risk
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-3 bg-white rounded-xl border border-slate-200">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                      Risk Classification
                    </span>
                    <span className="text-base font-bold text-slate-900 mt-0.5 block">
                      {result.risk_level}
                    </span>
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-slate-200">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                      Model Confidence Score
                    </span>
                    <span className="text-base font-bold text-emerald-700 font-mono mt-0.5 block">
                      {formattedConfidence}
                    </span>
                  </div>
                </div>

                <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-1">
                  <span className="text-xs font-bold text-slate-700 block">Assessment Factor / Reason:</span>
                  <p className="text-xs text-slate-600 leading-relaxed">{result.reason || 'Sufficient historical academic indicators analyzed.'}</p>
                </div>

                {result.ai_suggestion && (
                  <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-1">
                    <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                      AI Recommended Intervention:
                    </span>
                    <p className="text-xs text-emerald-800 leading-relaxed">{result.ai_suggestion}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Quick Student Reference Card */}
        <div>
          <div className="edu-card p-5">
            <h3 className="text-sm font-bold text-slate-900 mb-3">Enrolled Students Roster</h3>
            <p className="text-xs text-slate-500 mb-4">
              Click any student ID to quickly fill into the prediction input:
            </p>
            <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
              {students.length === 0 ? (
                <p className="text-xs text-slate-400 italic">Loading student roster...</p>
              ) : (
                students.map((st) => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => {
                      setStudentId(st.student_id || String(st.id))
                      setMessage('')
                      setError('')
                    }}
                    className="w-full text-left p-2.5 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50 transition-all flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-semibold text-slate-900 block">{st.full_name}</span>
                      <span className="text-[11px] text-slate-400">{st.class_name || 'Enrolled Class'}</span>
                    </div>
                    <span className="font-mono text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      {st.student_id || st.id}
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
