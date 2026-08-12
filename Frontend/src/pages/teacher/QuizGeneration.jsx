import React, { useState, useEffect } from 'react';
import PageHeader from '../../components/PageHeader';
import { Plus, Trash2, Sparkles, Loader2, Clock } from 'lucide-react';
import { createQuiz, generateQuizQuestions, publishQuiz, deleteQuiz, getTeacherQuizzes } from '../../services/quizzesService';

export default function QuizGeneration() {
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [classLevel, setClassLevel] = useState('');
  const [classId, setClassId] = useState('1');
  const [duration, setDuration] = useState('');
  const [questions, setQuestions] = useState([
    { id: 1, question: '', options: ['', '', '', ''], correctAnswer: 0 },
  ]);
  const [generating, setGenerating] = useState(false);
  const [creating, setCreating] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [quizId, setQuizId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [quizzesList, setQuizzesList] = useState([]);
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    fetchQuizzesList();
  }, []);

  const fetchQuizzesList = async () => {
    try {
      const data = await getTeacherQuizzes();
      setQuizzesList(data);
    } catch (err) {
      console.error('Failed to load quizzes:', err);
    }
  };

  const handleDelete = async (quizId) => {
    try {
      setDeleting(quizId);
      await deleteQuiz(quizId);
      setQuizzesList(quizzesList.filter(q => q.id !== quizId));
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
    setQuestions(
      questions.map((q) => (q.id === id ? { ...q, [field]: value } : q))
    );
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
      setSuccess('Questions generated successfully!');
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
    setSuccess(false);

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
      setSuccess('Quiz created! Now add questions or generate with AI.');
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
    setSuccess(false);
    
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
      <PageHeader title="Quiz Generation" subtitle="Create quizzes with AI assistance or manually" />

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
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Your Quizzes</h3>
          <div className="space-y-3">
            {quizzesList.map((quiz) => (
              <div key={quiz.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-slate-400" />
                  <div>
                    <span className="text-sm font-medium text-slate-900">{quiz.title}</span>
                    <span className="text-xs text-slate-500 ml-2 capitalize">{quiz.subject}</span>
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
                  {deleting === quiz.id ? (
                    <Loader2 className="w-4 h-4 text-red-500 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4 text-red-500" />
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="max-w-4xl">
        <form onSubmit={handleSubmit} className="edu-card p-6">
          <div className="space-y-6">
            {/* Quiz Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Quiz Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter quiz title"
                  className="w-full px-4 py-3 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Subject
                </label>
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-4 py-3 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  required
                >
                  <option value="">Select subject</option>
                  <option value="mathematics">Mathematics</option>
                  <option value="english">English</option>
                  <option value="science">Science</option>
                  <option value="social-studies">Social Studies</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Class Level
                </label>
                <select
                  value={classLevel}
                  onChange={(e) => setClassLevel(e.target.value)}
                  className="w-full px-4 py-3 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  required
                >
                  <option value="">Select class level</option>
                  <option value="JHS-1">JHS 1</option>
                  <option value="JHS-2">JHS 2</option>
                  <option value="JHS-3">JHS 3</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Class ID
                </label>
                <select
                  value={classId}
                  onChange={(e) => setClassId(e.target.value)}
                  className="w-full px-4 py-3 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  required
                >
                  <option value="1">Class 1</option>
                  <option value="2">Class 2</option>
                  <option value="3">Class 3</option>
                  <option value="4">Class 4</option>
                  <option value="5">Class 5</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Duration
                </label>
                <div className="relative">
                  <Clock className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                  <select
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    required
                  >
                    <option value="">Select duration</option>
                    <option value="15">15 minutes</option>
                    <option value="30">30 minutes</option>
                    <option value="45">45 minutes</option>
                    <option value="60">60 minutes</option>
                  </select>
                </div>
              </div>
            </div>

            {/* AI Generate Button */}
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
              <div>
                <h3 className="font-semibold text-slate-900">AI-Powered Quiz Generation</h3>
                <p className="text-sm text-slate-500">Let AI generate questions based on your topic</p>
              </div>
              <button
                type="button"
                onClick={handleGenerateAI}
                disabled={generating}
                className="flex items-center gap-2 px-4 py-2 bg-[#0A192F] text-white text-sm font-medium rounded-lg hover:bg-[#0F2440] transition-colors disabled:opacity-60"
              >
                {generating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Generate with AI
                  </>
                )}
              </button>
            </div>

            {/* Questions */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-slate-900">Questions ({questions.length})</h3>
                <button
                  type="button"
                  onClick={addQuestion}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add Question
                </button>
              </div>

              {questions.map((question, qIndex) => (
                <div key={question.id} className="p-5 bg-slate-50 rounded-xl">
                  <div className="flex items-start justify-between mb-4">
                    <h4 className="font-medium text-slate-900">Question {qIndex + 1}</h4>
                    {questions.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeQuestion(question.id)}
                        className="p-1 hover:bg-slate-200 rounded transition-colors"
                      >
                        <Trash2 className="w-4 h-4 text-slate-400" />
                      </button>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Question Text
                      </label>
                      <textarea
                        value={question.question}
                        onChange={(e) => updateQuestion(question.id, 'question', e.target.value)}
                        placeholder="Enter the question"
                        rows={2}
                        className="w-full px-4 py-3 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Options
                      </label>
                      <div className="space-y-2">
                        {question.options.map((option, oIndex) => (
                          <div key={oIndex} className="flex items-center gap-3">
                            <input
                              type="radio"
                              name={`correct-${question.id}`}
                              checked={question.correctAnswer === oIndex}
                              onChange={() => updateQuestion(question.id, 'correctAnswer', oIndex)}
                              className="w-4 h-4 text-emerald-500 focus:ring-emerald-500"
                            />
                            <input
                              type="text"
                              value={option}
                              onChange={(e) => updateOption(question.id, oIndex, e.target.value)}
                              placeholder={`Option ${oIndex + 1}`}
                              className="flex-1 px-4 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                              required
                            />
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-slate-500 mt-2">Select the radio button for the correct answer</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Submit Button */}
            <div className="flex justify-end gap-3 pt-4">
              {quizId && (
                <button
                  type="button"
                  onClick={handlePublish}
                  disabled={publishing}
                  className="px-6 py-3 bg-[#0A192F] text-white text-sm font-medium rounded-xl hover:bg-[#0F2440] transition-colors disabled:opacity-60"
                >
                  {publishing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
                      Publishing...
                    </>
                  ) : (
                    'Publish Quiz'
                  )}
                </button>
              )}
              <button
                type="button"
                className="px-6 py-3 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
              >
                Save Draft
              </button>
              <button
                type="submit"
                disabled={creating}
                className="px-6 py-3 bg-emerald-500 text-white text-sm font-medium rounded-xl hover:bg-emerald-600 transition-colors disabled:opacity-60"
              >
                {creating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
                    Creating...
                  </>
                ) : (
                  quizId ? 'Update Quiz' : 'Create Quiz'
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
