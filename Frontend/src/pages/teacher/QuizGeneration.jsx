import React, { useState, useEffect } from 'react';
import PageHeader from '../../components/PageHeader';
import { Plus, Trash2, Sparkles, Loader2, Clock } from 'lucide-react';
import {
  createQuiz,
  generateQuizQuestions,
  publishQuiz,
  deleteQuiz,
  getTeacherQuizzes,
} from '../../services/quizzesService';
import { fetchMyClasses } from '../../services/teacherService';

export default function QuizGeneration() {
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [classId, setClassId] = useState('');
  const [duration, setDuration] = useState('15');
  const [assignedClasses, setAssignedClasses] = useState([]);
  const [availableSubjects, setAvailableSubjects] = useState([]);
  const [questions, setQuestions] = useState([
    { id: 1, question: '', options: ['', '', '', ''], correctAnswer: 0 },
  ]);
  const [generating, setGenerating] = useState(false);
  const [creating, setCreating] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [quizId, setQuizId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [quizzesList, setQuizzesList] = useState([]);
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    fetchQuizzesList();
    loadClasses();
  }, []);

  const loadClasses = async () => {
    try {
      const res = await fetchMyClasses();
      const classes = res.data || [];
      setAssignedClasses(classes);
      if (classes.length > 0) {
        setClassId(classes[0].id.toString());
        setAvailableSubjects(classes[0].subjects || []);
        if (classes[0].subjects?.length > 0) {
          setSubject(classes[0].subjects[0]);
        }
      }
    } catch (err) {
      console.error('Failed to load assigned classes:', err);
    }
  };

  const handleClassChange = (selectedId) => {
    setClassId(selectedId);
    const cls = assignedClasses.find((c) => c.id.toString() === selectedId.toString());
    const subjects = cls?.subjects || [];
    setAvailableSubjects(subjects);
    if (subjects.length > 0) {
      setSubject(subjects[0]);
    } else {
      setSubject('');
    }
  };

  const fetchQuizzesList = async () => {
    try {
      const data = await getTeacherQuizzes();
      setQuizzesList(data);
    } catch (err) {
      console.error('Failed to load quizzes:', err);
    }
  };

  const handleDelete = async (quizIdToDelete) => {
    try {
      setDeleting(quizIdToDelete);
      await deleteQuiz(quizIdToDelete);
      setQuizzesList(quizzesList.filter((q) => q.id !== quizIdToDelete));
    } catch (err) {
      setError('Failed to delete quiz');
    } finally {
      setDeleting(null);
    }
  };

  const addQuestion = () => {
    setQuestions([
      ...questions,
      { id: Date.now(), question: '', options: ['', '', '', ''], correctAnswer: 0 },
    ]);
  };

  const removeQuestion = (id) => {
    if (questions.length > 1) {
      setQuestions(questions.filter((q) => q.id !== id));
    }
  };

  const updateQuestion = (id, field, value) => {
    setQuestions(questions.map((q) => (q.id === id ? { ...q, [field]: value } : q)));
  };

  const updateOption = (questionId, optionIndex, value) => {
    setQuestions(
      questions.map((q) =>
        q.id === questionId
          ? { ...q, options: q.options.map((opt, i) => (i === optionIndex ? value : opt)) }
          : q
      )
    );
  };

  const handleGenerateAI = async () => {
    if (!quizId) {
      setError('Please create a quiz first before generating questions');
      return;
    }

    setGenerating(true);
    setError('');

    try {
      await generateQuizQuestions(quizId, 10);
      setSuccess('AI Questions generated successfully for this semester quiz!');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to generate questions');
    } finally {
      setGenerating(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCreating(true);
    setError('');
    setSuccess('');

    if (!classId) {
      setError('Please select an assigned class');
      setCreating(false);
      return;
    }

    if (!subject) {
      setError('Please select an assigned subject');
      setCreating(false);
      return;
    }

    try {
      const quiz = await createQuiz({
        title,
        subject,
        topic: title,
        class_id: parseInt(classId),
        time_limit: parseInt(duration),
        is_published: false,
      });
      setQuizId(quiz.id);
      setSuccess('Quiz created! Now add manual questions or generate with AI.');
      fetchQuizzesList();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create quiz');
    } finally {
      setCreating(false);
    }
  };

  const handlePublish = async () => {
    if (!quizId) return;

    setPublishing(true);
    setError('');
    setSuccess('');

    try {
      await publishQuiz(quizId);
      setSuccess('Quiz published successfully!');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to publish quiz');
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Quiz Generation"
        subtitle="Create quizzes for your assigned classes with AI assistance or manual entry"
      />

      {success && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
          <p className="text-sm font-medium text-emerald-800">{success}</p>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
          <p className="text-sm font-medium text-red-800">{error}</p>
        </div>
      )}

      {/* Quizzes List */}
      {quizzesList.length > 0 && (
        <div className="edu-card p-6 mb-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Your Created Quizzes</h3>
          <div className="space-y-3">
            {quizzesList.map((quiz) => (
              <div
                key={quiz.id}
                className="flex items-center justify-between p-4 bg-slate-50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-slate-400" />
                  <div>
                    <span className="text-sm font-medium text-slate-900">{quiz.title}</span>
                    <span className="text-xs text-slate-500 ml-2 capitalize font-semibold">
                      {quiz.subject}
                    </span>
                    <span className="text-xs text-slate-400 ml-2">{quiz.time_limit} min</span>
                    {quiz.is_published && (
                      <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                        Published
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(quiz.id)}
                  disabled={deleting === quiz.id}
                  className="p-2 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-60"
                  title="Delete quiz"
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quiz Details Form */}
      <div className="edu-card p-6 mb-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-6">Quiz Setup</h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Quiz Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Mid-Semester Biology Quiz"
                className="w-full px-4 py-3 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Assigned Class <span className="text-red-500">*</span>
              </label>
              <select
                value={classId}
                onChange={(e) => handleClassChange(e.target.value)}
                className="w-full px-4 py-3 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                required
              >
                {assignedClasses.length === 0 && <option value="">No classes assigned</option>}
                {assignedClasses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.course || 'Core'})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Assigned Subject <span className="text-red-500">*</span>
              </label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-4 py-3 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                required
              >
                {availableSubjects.length === 0 ? (
                  <option value="">No subjects assigned for this class</option>
                ) : (
                  availableSubjects.map((sub) => (
                    <option key={sub} value={sub}>
                      {sub}
                    </option>
                  ))
                )}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Duration (minutes) <span className="text-red-500">*</span>
              </label>
              <select
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full px-4 py-3 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                required
              >
                <option value="15">15 minutes</option>
                <option value="30">30 minutes</option>
                <option value="45">45 minutes</option>
                <option value="60">60 minutes</option>
              </select>
            </div>
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={handleGenerateAI}
              disabled={generating || !quizId}
              className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 text-white text-sm font-medium rounded-xl hover:bg-purple-700 transition-colors disabled:opacity-60"
            >
              {generating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              Generate Questions with AI
            </button>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={creating}
                className="flex items-center gap-2 px-6 py-2.5 bg-emerald-500 text-white text-sm font-medium rounded-xl hover:bg-emerald-600 transition-colors disabled:opacity-60"
              >
                {creating && <Loader2 className="w-4 h-4 animate-spin" />}
                Save Quiz Setup
              </button>

              {quizId && (
                <button
                  type="button"
                  onClick={handlePublish}
                  disabled={publishing}
                  className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 text-white text-sm font-medium rounded-xl hover:bg-slate-800 transition-colors disabled:opacity-60"
                >
                  {publishing && <Loader2 className="w-4 h-4 animate-spin" />}
                  Publish Quiz
                </button>
              )}
            </div>
          </div>
        </form>
      </div>

      {/* Manual Questions Builder */}
      <div className="edu-card p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-slate-900">Manual Questions</h2>
          <button
            type="button"
            onClick={addQuestion}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-emerald-600 hover:text-emerald-700 bg-emerald-50 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Question
          </button>
        </div>

        <div className="space-y-6">
          {questions.map((q, qIndex) => (
            <div key={q.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div className="flex items-start justify-between gap-4 mb-4">
                <span className="font-semibold text-slate-700">Question {qIndex + 1}</span>
                {questions.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeQuestion(q.id)}
                    className="p-1 hover:bg-red-100 rounded text-red-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              <input
                type="text"
                value={q.question}
                onChange={(e) => updateQuestion(q.id, 'question', e.target.value)}
                placeholder="Enter question prompt..."
                className="w-full px-4 py-2.5 text-sm bg-white border border-slate-200 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                {q.options.map((opt, optIndex) => (
                  <div key={optIndex} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name={`correct-${q.id}`}
                      checked={q.correctAnswer === optIndex}
                      onChange={() => updateQuestion(q.id, 'correctAnswer', optIndex)}
                      className="text-emerald-500 focus:ring-emerald-500"
                    />
                    <input
                      type="text"
                      value={opt}
                      onChange={(e) => updateOption(q.id, optIndex, e.target.value)}
                      placeholder={`Option ${String.fromCharCode(65 + optIndex)}`}
                      className="flex-1 px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
