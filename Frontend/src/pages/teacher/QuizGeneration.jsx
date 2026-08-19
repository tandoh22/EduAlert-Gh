import React, { useState, useEffect } from 'react';
import PageHeader from '../../components/PageHeader';
import { Plus, Trash2, Sparkles, Loader2, Clock, Upload, FileText, CheckCircle2, X, Hash } from 'lucide-react';
import {
  createQuiz,
  generateQuizQuestions,
  generateQuizQuestionsFromFile,
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
  const [numQuestions, setNumQuestions] = useState(10);
  const [assignedClasses, setAssignedClasses] = useState([]);
  const [availableSubjects, setAvailableSubjects] = useState([]);
  const [quizFile, setQuizFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [questions, setQuestions] = useState([
    { id: 1, question: '', options: ['', '', '', ''], correctAnswer: 0 },
  ]);
  const [generating, setGenerating] = useState(false);
  const [generatingFile, setGeneratingFile] = useState(false);
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

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setQuizFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setQuizFile(e.dataTransfer.files[0]);
    }
  };

  const handleGenerateAI = async () => {
    if (!quizId) {
      setError('Please save the quiz setup first before generating questions');
      return;
    }

    setGenerating(true);
    setError('');

    try {
      await generateQuizQuestions(quizId, numQuestions);
      setSuccess(`${numQuestions} AI Quiz Questions generated successfully!`);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to generate questions');
    } finally {
      setGenerating(false);
    }
  };

  const handleGenerateFromFile = async () => {
    if (!quizId) {
      setError('Please save the quiz setup first before generating from file');
      return;
    }
    if (!quizFile) {
      setError('Please select or upload a document file (PDF/DOCX/TXT) first');
      return;
    }

    setGeneratingFile(true);
    setError('');

    try {
      const res = await generateQuizQuestionsFromFile(quizId, quizFile, numQuestions);
      setSuccess(res.message || `${numQuestions} MCQ questions generated from '${quizFile.name}'!`);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to generate MCQ quiz from uploaded file');
    } finally {
      setGeneratingFile(false);
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
      setSuccess('Quiz setup saved! Select the number of questions and click Generate below.');
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
      setSuccess('Quiz published successfully for students in the class!');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to publish quiz');
    } finally {
      setPublishing(false);
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

  return (
    <div>
      <PageHeader
        title="Quiz Generation"
        subtitle="Create MCQ quizzes for assigned classes using AI, document files, or manual questions"
      />

      {success && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <p className="text-sm font-medium text-emerald-800">{success}</p>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
          <p className="text-sm font-medium text-red-800">{error}</p>
        </div>
      )}

      {/* Existing Quizzes List */}
      {quizzesList.length > 0 && (
        <div className="edu-card p-6 mb-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Your Quizzes</h3>
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
                    <span className="text-xs text-slate-500 ml-2 capitalize font-semibold bg-slate-200 px-2 py-0.5 rounded">
                      {quiz.subject}
                    </span>
                    <span className="text-xs text-slate-400 ml-2">{quiz.time_limit} min</span>
                    {quiz.is_published && (
                      <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                        Published to Class
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

      {/* Quiz Setup Form */}
      <div className="edu-card p-6 mb-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-6">1. Setup Quiz Details</h2>

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
                placeholder="e.g., Biology Semester 1 MCQ Assessment"
                className="w-full px-4 py-3 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Class <span className="text-red-500">*</span>
              </label>
              <select
                value={classId}
                onChange={(e) => handleClassChange(e.target.value)}
                className="w-full px-4 py-3 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium"
                required
              >
                {assignedClasses.length === 0 && <option value="">No classes assigned</option>}
                {assignedClasses.map((c) => (
                  <option key={c.id} value={c.id}>
                    Class: {c.name} ({c.course || 'SHS'})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Subject <span className="text-red-500">*</span>
              </label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-4 py-3 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium"
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

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="submit"
              disabled={creating}
              className="flex items-center gap-2 px-6 py-2.5 bg-emerald-500 text-white text-sm font-medium rounded-xl hover:bg-emerald-600 transition-colors disabled:opacity-60"
            >
              {creating && <Loader2 className="w-4 h-4 animate-spin" />}
              Save Quiz Setup
            </button>
          </div>
        </form>
      </div>

      {/* 2. AI Quiz Generation from File / Topic */}
      <div className="edu-card p-6 mb-6 bg-gradient-to-r from-slate-900 to-[#0F2440] text-white">
        <h2 className="text-lg font-bold mb-2 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-400" />
          2. Generate MCQ Quiz Questions with AI
        </h2>
        <p className="text-xs text-slate-300 mb-4">
          Choose how many questions to generate, then upload a document or generate directly from the topic using Claude AI.
        </p>

        {/* Question Count Selection Control */}
        <div className="p-4 bg-slate-800/80 rounded-xl border border-slate-700/80 mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Hash className="w-4 h-4 text-amber-400 shrink-0" />
            <label className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
              Number of Questions to Generate:
            </label>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={numQuestions}
              onChange={(e) => setNumQuestions(parseInt(e.target.value))}
              className="bg-slate-900 text-emerald-400 font-bold text-sm px-4 py-2 rounded-lg border border-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value={5}>5 Questions</option>
              <option value={10}>10 Questions</option>
              <option value={15}>15 Questions</option>
              <option value={20}>20 Questions</option>
              <option value={25}>25 Questions</option>
              <option value={30}>30 Questions</option>
            </select>
          </div>
        </div>

        {/* Document File Drag & Drop Upload Zone */}
        <div className="mb-6">
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
            Upload Document for File-Based Quiz Generation (Optional)
          </label>
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-5 text-center transition-colors cursor-pointer ${
              isDragging
                ? 'border-emerald-400 bg-slate-800'
                : 'border-slate-700 bg-slate-800/60 hover:border-slate-500'
            }`}
          >
            <input
              type="file"
              onChange={handleFileChange}
              accept=".pdf,.docx,.txt"
              className="hidden"
              id="quiz-file-input"
            />
            <label htmlFor="quiz-file-input" className="cursor-pointer">
              <Upload className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
              <p className="text-sm font-medium text-slate-200">
                {quizFile ? quizFile.name : 'Select or drag & drop a PDF, DOCX, or TXT file here'}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                AI will extract key concepts and build {numQuestions} MCQ questions from your file
              </p>
            </label>
          </div>

          {quizFile && (
            <div className="mt-3 flex items-center justify-between p-3 bg-slate-800 rounded-lg text-xs text-slate-200 border border-slate-700">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-400" />
                <span className="font-semibold">{quizFile.name}</span>
                <span className="text-slate-400">({(quizFile.size / 1024).toFixed(1)} KB)</span>
              </div>
              <button
                type="button"
                onClick={() => setQuizFile(null)}
                className="text-slate-400 hover:text-red-400 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-4 items-center justify-between pt-2 border-t border-slate-800">
          <button
            type="button"
            onClick={handleGenerateFromFile}
            disabled={generatingFile || !quizId || !quizFile}
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 text-slate-950 font-bold text-xs rounded-xl hover:bg-emerald-400 transition-all disabled:opacity-50"
          >
            {generatingFile ? (
              <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
            ) : (
              <Sparkles className="w-4 h-4 text-slate-950" />
            )}
            Generate {numQuestions} MCQ Questions from File
          </button>

          <button
            type="button"
            onClick={handleGenerateAI}
            disabled={generating || !quizId}
            className="flex items-center gap-2 px-5 py-2.5 bg-purple-600 text-white font-semibold text-xs rounded-xl hover:bg-purple-700 transition-all disabled:opacity-50"
          >
            {generating ? (
              <Loader2 className="w-4 h-4 animate-spin text-white" />
            ) : (
              <Sparkles className="w-4 h-4 text-amber-300" />
            )}
            Generate {numQuestions} Questions from Topic
          </button>

          {quizId && (
            <button
              type="button"
              onClick={handlePublish}
              disabled={publishing}
              className="flex items-center gap-2 px-6 py-2.5 bg-emerald-400 text-slate-950 text-xs font-bold rounded-xl hover:bg-emerald-300 transition-all disabled:opacity-60"
            >
              {publishing && <Loader2 className="w-4 h-4 animate-spin" />}
              Publish Quiz to Students
            </button>
          )}
        </div>
      </div>

      {/* 3. Manual Questions Builder */}
      <div className="edu-card p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-slate-900">3. Manual Question Builder</h2>
          <button
            type="button"
            onClick={addQuestion}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-emerald-600 hover:text-emerald-700 bg-emerald-50 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Manual Question
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
