import { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, Clock3, Flag, Loader2, CheckCircle } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import { getClassQuizzes, startQuiz, submitQuiz, getMyQuizAttempts, getQuizQuestions } from '../services/quizzesService';
import { useStudent } from '../context/StudentContext';

export default function Quizzes() {
  const { classId, classCode, className, studentId } = useStudent();
  const [view, setView] = useState('list'); // 'list', 'quiz', 'results'
  const [quizzes, setQuizzes] = useState([]);
  const [currentQuiz, setCurrentQuiz] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [attemptId, setAttemptId] = useState(null);
  const [flagged, setFlagged] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [timerInterval, setTimerInterval] = useState(null);

  const fetchQuizzes = async () => {
    if (!classId) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError('');
      console.log('Fetching quizzes for class_id:', classId);
      const data = await getClassQuizzes(classId);
      setQuizzes(data);
    } catch (err) {
      console.error('Error fetching quizzes:', err);
      setError(err.response?.data?.detail || 'Failed to load quizzes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (classId) {
      fetchQuizzes();
    } else {
      setLoading(false);
    }
  }, [classId]);

  useEffect(() => {
    // Start timer when quiz begins
    if (view === 'quiz' && currentQuiz && timeRemaining === null) {
      const durationSeconds = (currentQuiz.time_limit || 30) * 60;
      setTimeRemaining(durationSeconds);
      
      const interval = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            setTimerInterval(null);
            handleSubmitQuiz();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      setTimerInterval(interval);
    }
    
    return () => {
      if (timerInterval) {
        clearInterval(timerInterval);
        setTimerInterval(null);
      }
    };
  }, [view, currentQuiz]);

  const handleStartQuiz = async (quiz) => {
    try {
      setLoading(true);
      setError('');
      
      console.log('Starting quiz:', quiz.id, 'for student:', studentId);
      
      // Start quiz attempt
      const attempt = await startQuiz(quiz.id, studentId);
      setAttemptId(attempt.id);
      
      // Fetch quiz questions using service function
      const quizQuestions = await getQuizQuestions(quiz.id);
      setQuestions(quizQuestions);
      
      setCurrentQuiz(quiz);
      setView('quiz');
      setCurrentIndex(0);
      setAnswers({});
    } catch (err) {
      console.error('Error starting quiz:', err);
      setError(err.response?.data?.detail || 'Failed to start quiz');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitQuiz = async () => {
    try {
      setSubmitting(true);
      setError('');
      
      const submissionData = {
        attempt_id: attemptId,
        answers: questions.map((q, index) => ({
          question_id: q.id,
          student_answer: answers[index] || ''
        }))
      };
      
      const result = await submitQuiz(submissionData);
      
      // Clear timer
      if (timerInterval) {
        clearInterval(timerInterval);
        setTimerInterval(null);
      }
      
      // Redirect to Results page to see the updated results
      window.location.href = '/results';
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to submit quiz');
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (seconds) => {
    if (seconds === null) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const current = questions[currentIndex];
  const progress = questions.length > 0 ? ((currentIndex + 1) / questions.length) * 100 : 0;

  if (view === 'list') {
    return (
      <div>
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <PageHeader title="Available Quizzes" subtitle="Take quizzes assigned to your class" />
          {classCode && (
            <div className="px-3.5 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              Class ID: {classCode} {className ? `(${className})` : ''}
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 text-emerald-500 animate-spin" />
          </div>
        ) : error ? (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        ) : quizzes.length === 0 ? (
          <div className="text-center py-12 edu-card">
            <p className="text-sm font-semibold text-slate-700">No quizzes available yet</p>
            <p className="text-xs text-slate-400 mt-1">Class ID: {classCode || classId || 'Unassigned'} {className ? `(${className})` : ''}</p>
            <button 
              onClick={() => {
                fetchQuizzes();
              }}
              className="mt-4 px-4 py-2 bg-emerald-500 text-white text-xs font-bold rounded-lg hover:bg-emerald-600 transition-colors"
            >
              Refresh Quizzes
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {quizzes.map((quiz) => (
              <div key={quiz.id} className="edu-card p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-2">{quiz.title}</h3>
                <p className="text-sm text-slate-500 mb-4 capitalize">{quiz.subject}</p>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">{quiz.time_limit} minutes</span>
                  <button
                    onClick={() => handleStartQuiz(quiz)}
                    className="px-4 py-2 bg-emerald-500 text-white text-sm font-medium rounded-lg hover:bg-emerald-600 transition-colors"
                  >
                    Start Quiz
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (view === 'results' && results) {
    return (
      <div>
        <PageHeader title="Quiz Results" subtitle="See how you performed" />

        <div className="max-w-2xl mx-auto">
          <div className="edu-card p-6 text-center">
            <div className="w-20 h-20 rounded-full bg-emerald-500 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Quiz Completed!</h2>
            <div className="text-4xl font-bold text-emerald-600 mb-2">
              {results.percentage}%
            </div>
            <p className="text-sm text-slate-500 mb-6">
              You scored {results.score} out of {results.total_marks}
            </p>
            <button
              onClick={() => {
                setView('list');
                setCurrentQuiz(null);
                setResults(null);
                fetchQuizzes();
              }}
              className="px-6 py-3 bg-[#0A192F] text-white text-sm font-medium rounded-xl hover:bg-[#0F2440] transition-colors"
            >
              Back to Quizzes
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title={currentQuiz?.title || 'Quiz'} subtitle={currentQuiz?.subject || ''} />

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <section className="mx-auto max-w-2xl">
        <div className="mb-4 flex items-end gap-3">
          <div className="flex-1">
            <div className="mb-1 flex items-center justify-between text-xs font-medium text-slate-600">
              <span>Question {currentIndex + 1} of {questions.length}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-300">
              <div className="h-full bg-[#0A192F] transition-all" style={{ width: `${progress}%` }} />
            </div>
          </div>
          <span className="flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700">
            <Clock3 className="h-3.5 w-3.5" /> {formatTime(timeRemaining)}
          </span>
        </div>

        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
          <h2 className="mb-5 text-lg font-semibold text-slate-800">{current?.question_text}</h2>

          <div className="space-y-3">
            {current?.question_type === 'mcq' && current?.option_a && (
              <>
                {['option_a', 'option_b', 'option_c', 'option_d'].map((opt, idx) => {
                  const optionText = current[opt];
                  if (!optionText) return null;
                  const optionLetter = ['A', 'B', 'C', 'D'][idx];
                  const selected = answers[currentIndex] === optionText || answers[currentIndex] === optionLetter;
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setAnswers({ ...answers, [currentIndex]: optionLetter })}
                      className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3.5 text-left text-sm font-medium transition ${
                        selected
                          ? 'border-emerald-500 bg-emerald-50/60 text-slate-900 ring-2 ring-emerald-500/20 shadow-sm'
                          : 'border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-extrabold shrink-0 ${
                        selected ? 'bg-emerald-600 text-white shadow-sm' : 'bg-slate-100 text-slate-700 border border-slate-200'
                      }`}>
                        {optionLetter}
                      </span>
                      <span className="flex-1">{optionText}</span>
                    </button>
                  );
                })}
              </>
            )}

            {current?.question_type === 'true_false' && (
              <>
                {['True', 'False'].map((option) => {
                  const selected = answers[currentIndex] === option;
                  return (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setAnswers({ ...answers, [currentIndex]: option })}
                      className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3.5 text-left text-sm font-medium transition ${
                        selected
                          ? 'border-[#0A192F] bg-slate-50 text-slate-900 ring-1 ring-[#0A192F]'
                          : 'border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <span className={`h-4 w-4 rounded-full border ${selected ? 'border-[#0A192F] bg-[#0A192F] ring-2 ring-white ring-inset' : 'border-slate-400'}`} />
                      {option}
                    </button>
                  );
                })}
              </>
            )}

            {current?.question_type === 'short_answer' && (
              <textarea
                value={answers[currentIndex] || ''}
                onChange={(e) => setAnswers({ ...answers, [currentIndex]: e.target.value })}
                placeholder="Type your answer here..."
                rows={4}
                className="w-full px-4 py-3 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none"
              />
            )}
          </div>
        </article>

        <div className="mt-4 flex items-center justify-between gap-3">
          <button
            type="button"
            disabled={currentIndex === 0}
            onClick={() => setCurrentIndex((index) => Math.max(0, index - 1))}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-500 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ArrowLeft className="h-4 w-4" /> Previous
          </button>

          <div className="flex items-center gap-1">
            {questions.map((_, index) => (
              <button
                key={index}
                type="button"
                onClick={() => setCurrentIndex(index)}
                className={`h-7 w-7 rounded-lg text-xs font-medium ${index === currentIndex ? 'bg-[#0A192F] text-white' : 'border border-slate-200 text-slate-500 hover:bg-slate-50'}`}
              >
                {index + 1}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setFlagged((value) => !value)}
              className={`flex items-center gap-1.5 text-sm ${flagged ? 'text-amber-600' : 'text-slate-600'}`}
            >
              <Flag className="h-4 w-4" /> Flag
            </button>
            {currentIndex === questions.length - 1 ? (
              <button
                type="button"
                onClick={handleSubmitQuiz}
                disabled={submitting}
                className="flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-2 text-sm font-medium text-white transition hover:bg-emerald-600 disabled:opacity-60"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Submitting...
                  </>
                ) : (
                  'Submit Quiz'
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setCurrentIndex((index) => Math.min(questions.length - 1, index + 1))}
                className="flex items-center gap-1.5 rounded-lg bg-[#0A192F] px-3 py-2 text-sm font-medium text-white transition hover:bg-[#102344]"
              >
                Next <ArrowRight className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
