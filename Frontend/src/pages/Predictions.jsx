import { useState } from 'react'
import { runPrediction } from '../services/portalService'
import PageHeader from '../components/PageHeader'

export default function Predictions() {
  const [studentId, setStudentId] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)

  const runPredictionHandler = async (event) => {
    event.preventDefault()
    setLoading(true)
    setMessage('')
    setError('')
    setResult(null)

    try {
      const response = await runPrediction(parseInt(studentId))
      setResult(response.data)
      setMessage(`AI prediction completed for student ${studentId}: ${response.data.risk_level}`)
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to run prediction. Please check the student ID and try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <PageHeader title="Predictions" subtitle="Run student risk predictions and identify who needs attention first." />

      <div className="edu-card p-6 max-w-2xl">
        <h2 className="text-lg font-semibold text-slate-900 mb-5">Run prediction</h2>
        <form onSubmit={runPredictionHandler} className="space-y-4">
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
          <button 
            type="submit" 
            className="w-full px-6 py-2.5 bg-[#0A192F] text-white text-sm font-semibold rounded-xl hover:bg-[#0F2647] disabled:opacity-60 transition-colors"
            disabled={loading}
          >
            {loading ? 'Running prediction...' : 'Run prediction'}
          </button>
        </form>
        {message && <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-xl text-sm text-blue-700">{message}</div>}
        {error && <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{error}</div>}
        {result && (
          <div className="mt-6 p-5 bg-slate-50 border border-slate-200 rounded-xl">
            <h3 className="text-base font-semibold text-slate-900 mb-4">Prediction Result</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-slate-600">Risk Level:</span>
                <span className="text-sm font-semibold text-slate-900">{result.risk_level}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-slate-600">Confidence:</span>
                <span className="text-sm font-semibold text-slate-900">{result.confidence_score}%</span>
              </div>
              <div>
                <span className="text-sm text-slate-600">Reason:</span>
                <p className="text-sm text-slate-900 mt-1">{result.reason}</p>
              </div>
              {result.ai_suggestion && (
                <div>
                  <span className="text-sm text-slate-600">AI Suggestion:</span>
                  <p className="text-sm text-slate-900 mt-1">{result.ai_suggestion}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
