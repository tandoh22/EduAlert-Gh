import React, { useState, useEffect } from 'react';
import PageHeader from '../../components/PageHeader';
import { Search, Filter, Download, TrendingUp, TrendingDown, Clock, Loader2 } from 'lucide-react';
import { getQuizResults, getTeacherQuizzes } from '../../services/quizzesService';

export default function QuizResults() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedQuiz, setSelectedQuiz] = useState('');
  const [quizResults, setQuizResults] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingQuizzes, setLoadingQuizzes] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchQuizzes();
  }, []);

  useEffect(() => {
    if (selectedQuiz) {
      fetchQuizResults(selectedQuiz);
    } else {
      setQuizResults([]);
    }
  }, [selectedQuiz]);

  const fetchQuizzes = async () => {
    try {
      setLoadingQuizzes(true);
      const data = await getTeacherQuizzes();
      setQuizzes(data);
    } catch (err) {
      console.error('Failed to load quizzes:', err);
    } finally {
      setLoadingQuizzes(false);
    }
  };

  const fetchQuizResults = async (quizId) => {
    try {
      setLoading(true);
      setError('');
      console.log('Fetching results for quiz ID:', quizId);
      const data = await getQuizResults(quizId);
      console.log('Quiz results received:', data);
      setQuizResults(data);
    } catch (err) {
      console.error('Failed to load quiz results:', err);
      setError('Failed to load quiz results');
      setQuizResults([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredResults = quizResults.filter(
    (result) => true // Add filtering logic if needed
  );

  const averageScore = filteredResults.length > 0
    ? Math.round(filteredResults.reduce((acc, r) => acc + (r.percentage || 0), 0) / filteredResults.length)
    : 0;

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-emerald-600 bg-emerald-50';
    if (score >= 60) return 'text-blue-600 bg-blue-50';
    if (score >= 40) return 'text-orange-600 bg-orange-50';
    return 'text-red-600 bg-red-50';
  };

  return (
    <div>
      <PageHeader title="Quiz Results" subtitle="View and analyze student quiz performance" />

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Filters */}
      <div className="edu-card p-4 mb-6">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by student name..."
                className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
          </div>

          <select
            value={selectedQuiz}
            onChange={(e) => setSelectedQuiz(e.target.value)}
            disabled={loadingQuizzes}
            className="px-4 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 disabled:opacity-60"
          >
            <option value="">Select Quiz</option>
            {quizzes.map((quiz) => (
              <option key={quiz.id} value={quiz.id}>
                {quiz.title} - {quiz.subject}
              </option>
            ))}
          </select>

          <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
            <Filter className="w-4 h-4" />
            More Filters
          </button>

          <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#0A192F] hover:bg-slate-100 rounded-lg transition-colors">
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 text-emerald-500 animate-spin" />
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="edu-card p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-500">Average Score</span>
                <TrendingUp className="w-5 h-5 text-emerald-500" />
              </div>
              <div className="text-3xl font-bold text-slate-900">{averageScore}%</div>
              <div className="text-xs text-slate-400 mt-1">{filteredResults.length} submissions</div>
            </div>

            <div className="edu-card p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-500">Highest Score</span>
                <TrendingUp className="w-5 h-5 text-emerald-500" />
              </div>
              <div className="text-3xl font-bold text-slate-900">
                {filteredResults.length > 0 ? Math.max(...filteredResults.map(r => r.percentage || 0)) : 0}%
              </div>
              <div className="text-xs text-slate-400 mt-1">Top performer</div>
            </div>

            <div className="edu-card p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-500">Total Submissions</span>
                <Clock className="w-5 h-5 text-blue-500" />
              </div>
              <div className="text-3xl font-bold text-slate-900">{filteredResults.length}</div>
              <div className="text-xs text-slate-400 mt-1">Students completed</div>
            </div>
          </div>

          {/* Results Table */}
          <div className="edu-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Student ID</th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Score</th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Percentage</th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Submitted At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredResults.map((result, index) => (
                    <tr key={index} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium text-slate-900">{result.student_id}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-slate-600">{result.score} / {result.total_marks}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${getScoreColor(result.percentage)}`}>
                          {result.percentage}%
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-slate-600">
                          {result.submitted_at ? new Date(result.submitted_at).toLocaleDateString() : '—'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredResults.length === 0 && (
              <div className="text-center py-12">
                <p className="text-sm text-slate-500">No results found. Select a quiz to view results.</p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
