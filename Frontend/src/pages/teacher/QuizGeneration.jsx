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
  getQuizQuestions,
  deleteQuizQuestion,
  addQuestionManually,
  addQuestionsBatch,
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
  const [generatedQuestions, setGeneratedQuestions] = useState([]);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generatingFile, setGeneratingFile] = useState(false);
  const [creating, setCreating] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [savingManual, setSavingManual] = useState(false);
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

  const loadPreviewQuestions = async (targetQuizId) => {
    if (!targetQuizId) return;
    try {
      setLoadingPreview(true);
      const data = await getQuizQuestions(targetQuizId);
      setGeneratedQuestions(data || []);
    } catch (err) {
      console.error('Failed to load quiz questions preview:', err);
    } finally {
      setLoadingPreview(false);
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

  const handleSelectQuiz = async (q) => {
    setQuizId(q.id);
    setTitle(q.title);
    setSubject(q.subject);
    setDuration(q.time_limit?.toString() || '15');
    await loadPreviewQuestions(q.id);
  };

  const handleDelete = async (quizIdToDelete) => {
    try {
      setDeleting(quizIdToDelete);
      await deleteQuiz(quizIdToDelete);
      setQuizzesList(quizzesList.filter((q) => q.id !== quizIdToDelete));
      if (quizId === quizIdToDelete) {
        setQuizId(null);
        setGeneratedQuestions([]);
      }
    } catch (err) {
      setError('Failed to delete quiz');
    } finally {
      setDeleting(null);
    }
  };

  const handleDeleteQuestion = async (questionId) => {
    try {
      await deleteQuizQuestion(questionId);
      setGeneratedQuestions((prev) => prev.filter((q) => q.id !== questionId));
    } catch (err) {
      console.error('Failed to delete question:', err);
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
      setSuccess(`${numQuestions} AI Quiz Questions generated successfully! Review questions and correct answers below before publishing.`);
      await loadPreviewQuestions(quizId);
      fetchQuizzesList();
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
      setSuccess(res.message || `${numQuestions} MCQ questions generated from '${quizFile.name}'! Review questions and correct answers below before publishing.`);
      await loadPreviewQuestions(quizId);
      fetchQuizzesList();
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
      fetchQuizzesList();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to publish quiz');
    } finally {
      setPublishing(false);
    }
  };

  const handleSaveManualQuestions = async () => {
    setError('');
    setSuccess('');

    const validQuestions = questions.filter((q) => q.question && q.question.trim());
    if (validQuestions.length === 0) {
      setError('Please fill in at least one question prompt with its options before saving.');
      return;
    }

    for (let i = 0; i < validQuestions.length; i++) {
      const q = validQuestions[i];
      const filledOpts = q.options.filter((opt) => opt && opt.trim());
      if (filledOpts.length < 2) {
        setError(`Question ${i + 1} must have at least 2 options filled.`);
        return;
      }
    }

    let targetQuizId = quizId;

    setSavingManual(true);
    try {
      if (!targetQuizId) {
        if (!title.trim()) {
          setError('Please provide a Quiz Title in Step 1 before saving manual questions.');
          setSavingManual(false);
          return;
        }
        if (!classId) {
          setError('Please select an assigned class in Step 1.');
          setSavingManual(false);
          return;
        }
        if (!subject) {
          setError('Please select a subject in Step 1.');
          setSavingManual(false);
          return;
        }

        const createdQuiz = await createQuiz({
          title: title.trim(),
          subject,
          topic: title.trim(),
          class_id: parseInt(classId),
          time_limit: parseInt(duration),
          is_published: false,
        });
        targetQuizId = createdQuiz.id;
        setQuizId(createdQuiz.id);
      }

      const formatted = validQuestions.map((q, idx) => ({
        question_text: q.question.trim(),
        question_type: 'mcq',
        option_a: q.options[0]?.trim() || 'Option A',
        option_b: q.options[1]?.trim() || 'Option B',
        option_c: q.options[2]?.trim() || 'Option C',
        option_d: q.options[3]?.trim() || 'Option D',
        correct_answer: String.fromCharCode(65 + (q.correctAnswer ?? 0)),
        marks: 1,
        order_num: generatedQuestions.length + idx + 1,
      }));

      await addQuestionsBatch(targetQuizId, formatted);
      setSuccess(`${formatted.length} manual question(s) saved to quiz successfully! You can now preview and publish below.`);
      await loadPreviewQuestions(targetQuizId);
      fetchQuizzesList();

      setQuestions([
        { id: Date.now(), question: '', options: ['', '', '', ''], correctAnswer: 0 },
      ]);
    } catch (err) {
      console.error('Failed to save manual questions:', err);
      setError(err.response?.data?.detail || 'Failed to save manual questions to quiz');
    } finally {
      setSavingManual(false);
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
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-900">Your Saved Quizzes</h3>
            <span className="text-xs text-slate-500">Click any quiz to preview questions & publish</span>
          </div>
          <div className="space-y-3">
            {quizzesList.map((quiz) => {
              const isSelected = quizId === quiz.id;
              return (
                <div
                  key={quiz.id}
                  onClick={() => handleSelectQuiz(quiz)}
                  className={`flex items-center justify-between p-4 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-50/70 border-emerald-400 shadow-sm'
                      : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Clock className={`w-5 h-5 ${isSelected ? 'text-emerald-600' : 'text-slate-400'}`} />
                    <div>
                      <span className="text-sm font-semibold text-slate-900">{quiz.title}</span>
                      <span className="text-xs text-slate-500 ml-2 capitalize font-semibold bg-slate-200 px-2 py-0.5 rounded">
                        {quiz.subject}
                      </span>
                      <span className="text-xs text-slate-400 ml-2">{quiz.time_limit} min</span>
                      {quiz.is_published ? (
                        <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                          Published
                        </span>
                      ) : (
                        <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                          Draft Preview
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectQuiz(quiz);
                      }}
                      className="px-3 py-1.5 text-xs font-semibold bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-lg"
                    >
                      {isSelected ? 'Selected' : 'Preview'}
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(quiz.id);
                      }}
                      disabled={deleting === quiz.id}
                      className="p-2 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-60"
                      title="Delete quiz"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                </div>
              );
            })}
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
                    {c.code ? `[${c.code}] ${c.name}` : c.name}
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
        </div>
      </div>

      {/* 3. Question Preview & Correct Option Verification Section */}
      {quizId && (
        <div className="edu-card p-6 mb-6 border-2 border-emerald-500/30">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-200">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                3. Generated Questions & Correct Option Preview
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Review all generated questions with their highlighted correct answer option before publishing to students.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => loadPreviewQuestions(quizId)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 rounded-lg transition-colors"
              >
                Refresh Questions
              </button>

              <button
                type="button"
                onClick={handlePublish}
                disabled={publishing || generatedQuestions.length === 0}
                className="flex items-center gap-2 px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-emerald-500/20 disabled:opacity-50"
              >
                {publishing && <Loader2 className="w-4 h-4 animate-spin text-white" />}
                Publish Quiz to Students ({generatedQuestions.length} Questions)
              </button>
            </div>
          </div>

          {loadingPreview ? (
            <div className="py-12 text-center text-slate-500">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-500 mx-auto mb-2" />
              <p className="text-sm font-medium">Loading generated questions preview...</p>
            </div>
          ) : generatedQuestions.length === 0 ? (
            <div className="py-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300">
              <p className="text-sm font-medium text-slate-600">No questions generated or added for this quiz yet.</p>
              <p className="text-xs text-slate-400 mt-1">
                Use the AI generation options above or the manual builder below to populate questions.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {generatedQuestions.map((q, idx) => {
                const correctKey = (q.correct_answer || 'A').toString().trim().toUpperCase();

                const optionsList = [
                  { label: 'A', text: q.option_a },
                  { label: 'B', text: q.option_b },
                  { label: 'C', text: q.option_c },
                  { label: 'D', text: q.option_d },
                ].filter((opt) => opt.text != null && opt.text !== '');

                return (
                  <div
                    key={q.id || idx}
                    className="p-5 bg-white rounded-xl border border-slate-200 shadow-sm space-y-3"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-2">
                        <span className="w-7 h-7 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center shrink-0">
                          Q{q.order_num || idx + 1}
                        </span>
                        <h3 className="font-semibold text-slate-900 text-sm">
                          {q.question_text}
                        </h3>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs px-2.5 py-1 bg-slate-100 text-slate-600 font-semibold rounded-lg">
                          {q.marks || 1} {q.marks === 1 ? 'Mark' : 'Marks'}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleDeleteQuestion(q.id)}
                          className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                          title="Delete question"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Options List with Correct Answer Highlight */}
                    {optionsList.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-2">
                        {optionsList.map((opt) => {
                          const isCorrect = opt.label === correctKey || q.correct_answer === opt.text;
                          return (
                            <div
                              key={opt.label}
                              className={`p-3 rounded-lg border text-xs font-medium flex items-center justify-between ${
                                isCorrect
                                  ? 'bg-emerald-50 border-emerald-400 text-emerald-950 font-bold ring-1 ring-emerald-400'
                                  : 'bg-slate-50 border-slate-200 text-slate-700'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <span
                                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-extrabold ${
                                    isCorrect ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
                                  }`}
                                >
                                  {opt.label}
                                </span>
                                <span>{opt.text}</span>
                              </div>

                              {isCorrect && (
                                <span className="px-2 py-0.5 bg-emerald-600 text-white text-[10px] font-extrabold rounded-md flex items-center gap-1 shrink-0">
                                  <CheckCircle2 className="w-3 h-3" />
                                  Correct Option
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-lg text-xs text-emerald-900 font-medium">
                        <span className="font-bold">Expected Correct Answer:</span> {q.correct_answer}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 4. Manual Questions Builder */}
      <div className="edu-card p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">4. Manual Question Builder</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Draft your own custom MCQs and save them directly to this quiz.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={addQuestion}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-emerald-600 hover:text-emerald-700 bg-emerald-50 rounded-xl transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Another Question
            </button>

            <button
              type="button"
              onClick={handleSaveManualQuestions}
              disabled={savingManual}
              className="flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-all shadow-sm disabled:opacity-50"
            >
              {savingManual ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              )}
              Save Manual Questions to Quiz
            </button>
          </div>
        </div>

        <div className="space-y-6">
          {questions.map((q, qIndex) => (
            <div key={q.id} className="p-5 bg-slate-50 rounded-xl border border-slate-200">
              <div className="flex items-start justify-between gap-4 mb-4">
                <span className="font-semibold text-slate-800 text-sm">Question {qIndex + 1}</span>
                {questions.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeQuestion(q.id)}
                    className="p-1 hover:bg-red-100 rounded text-red-500 transition-colors"
                    title="Remove this question"
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

              <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wider">
                Options (Select radio button for the correct option):
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                {q.options.map((opt, optIndex) => (
                  <div key={optIndex} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name={`correct-${q.id}`}
                      checked={q.correctAnswer === optIndex}
                      onChange={() => updateQuestion(q.id, 'correctAnswer', optIndex)}
                      className="text-emerald-500 focus:ring-emerald-500 w-4 h-4"
                      title="Mark as correct answer"
                    />
                    <input
                      type="text"
                      value={opt}
                      onChange={(e) => updateOption(q.id, optIndex, e.target.value)}
                      placeholder={`Option ${String.fromCharCode(65 + optIndex)}`}
                      className={`flex-1 px-3 py-2 text-sm bg-white border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 ${
                        q.correctAnswer === optIndex
                          ? 'border-emerald-500 font-semibold ring-1 ring-emerald-500/30'
                          : 'border-slate-200'
                      }`}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-3 pt-6 mt-6 border-t border-slate-200">
          <button
            type="button"
            onClick={addQuestion}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Another Question
          </button>

          <button
            type="button"
            onClick={handleSaveManualQuestions}
            disabled={savingManual}
            className="flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all shadow-md shadow-emerald-600/20 disabled:opacity-50"
          >
            {savingManual ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-white" />
            )}
            Save All Manual Questions to Quiz
          </button>
        </div>
      </div>
    </div>
  );
}
