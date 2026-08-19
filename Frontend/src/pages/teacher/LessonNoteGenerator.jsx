import React, { useState, useEffect } from 'react';
import PageHeader from '../../components/PageHeader';
import { BookOpen, Sparkles, FileText, Download, Loader2, Upload, X, CheckCircle2 } from 'lucide-react';
import { generateLessonNote } from '../../services/lessonNotesService';
import { fetchMyClasses } from '../../services/teacherService';

export default function LessonNoteGenerator() {
  const [topic, setTopic] = useState('');
  const [subject, setSubject] = useState('');
  const [classLevel, setClassLevel] = useState('');
  const [assignedClasses, setAssignedClasses] = useState([]);
  const [availableSubjects, setAvailableSubjects] = useState([]);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    loadClasses();
  }, []);

  const loadClasses = async () => {
    try {
      const res = await fetchMyClasses();
      const classes = res.data || [];
      setAssignedClasses(classes);
      if (classes.length > 0) {
        setClassLevel(classes[0].name);
        setAvailableSubjects(classes[0].subjects || []);
        if (classes[0].subjects?.length > 0) {
          setSubject(classes[0].subjects[0]);
        }
      }
    } catch (err) {
      console.error('Failed to load assigned classes:', err);
    }
  };

  const handleClassChange = (selectedClassName) => {
    setClassLevel(selectedClassName);
    const cls = assignedClasses.find((c) => c.name === selectedClassName);
    const subjects = cls?.subjects || [];
    setAvailableSubjects(subjects);
    if (subjects.length > 0) {
      setSubject(subjects[0]);
    } else {
      setSubject('');
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setUploadedFile(e.target.files[0]);
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
      setUploadedFile(e.dataTransfer.files[0]);
    }
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    setGenerating(true);
    setError('');
    setSuccess(false);

    try {
      const formData = new FormData();
      formData.append('subject', subject);
      formData.append('topic', topic);
      if (classLevel) formData.append('class_level', classLevel);
      if (uploadedFile) formData.append('file', uploadedFile);

      const result = await generateLessonNote(formData);
      setGeneratedContent(result.content);
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to generate lesson note');
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([generatedContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${topic.replace(/\s+/g, '_')}_lesson_note.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <PageHeader
        title="Lesson Note Generator"
        subtitle="Generate AI-powered lesson notes for your assigned classes using topic or uploaded document files"
      />

      {success && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <p className="text-sm font-medium text-emerald-800">
            Structured lesson note generated successfully based on NaCCA curriculum guidelines!
          </p>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
          <p className="text-sm font-medium text-red-800">{error}</p>
        </div>
      )}

      <div className="max-w-4xl">
        {!generatedContent ? (
          <form onSubmit={handleGenerate} className="edu-card p-6">
            <div className="space-y-6">
              {/* Topic */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Lesson Topic <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g., Photosynthesis & Plant Biochemistry"
                  className="w-full px-4 py-3 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  required
                />
              </div>

              {/* Class & Subject */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Class <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={classLevel}
                    onChange={(e) => handleClassChange(e.target.value)}
                    className="w-full px-4 py-3 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium"
                    required
                  >
                    {assignedClasses.length === 0 && <option value="">No classes assigned</option>}
                    {assignedClasses.map((c) => (
                      <option key={c.id} value={c.name}>
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
              </div>

              {/* Document File Drag & Drop Upload Zone */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Attach Reference File / Syllabus (Optional PDF, DOCX, TXT)
                </label>
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors cursor-pointer ${
                    isDragging
                      ? 'border-emerald-500 bg-emerald-50/50'
                      : 'border-slate-300 hover:border-emerald-500 bg-slate-50/50'
                  }`}
                >
                  <input
                    type="file"
                    onChange={handleFileChange}
                    accept=".pdf,.docx,.txt"
                    className="hidden"
                    id="lesson-file-upload"
                  />
                  <label htmlFor="lesson-file-upload" className="cursor-pointer">
                    <Upload className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                    <p className="text-sm font-medium text-slate-700">
                      {uploadedFile ? uploadedFile.name : 'Click to select or drag & drop reference file'}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Upload NaCCA textbook pages, syllabus, or lecture slides
                    </p>
                  </label>
                </div>

                {uploadedFile && (
                  <div className="mt-3 flex items-center justify-between p-3 bg-slate-100 rounded-lg text-xs text-slate-700 border border-slate-200">
                    <div className="flex items-center gap-2 truncate">
                      <FileText className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="font-semibold truncate">{uploadedFile.name}</span>
                      <span className="text-slate-400">
                        ({(uploadedFile.size / 1024).toFixed(1)} KB)
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setUploadedFile(null)}
                      className="text-slate-400 hover:text-red-500 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              <div className="flex justify-end pt-4">
                <button
                  type="submit"
                  disabled={generating}
                  className="flex items-center gap-2 px-6 py-3 bg-emerald-500 text-white text-sm font-medium rounded-xl hover:bg-emerald-600 transition-colors disabled:opacity-60"
                >
                  {generating ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Sparkles className="w-5 h-5" />
                  )}
                  {generating ? 'Generating Lesson Note...' : 'Generate Lesson Note'}
                </button>
              </div>
            </div>
          </form>
        ) : (
          <div className="edu-card p-6">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-200">
              <div>
                <h2 className="text-xl font-bold text-slate-900">{topic}</h2>
                <p className="text-sm text-slate-500">
                  Subject: <span className="font-medium text-slate-700">{subject}</span> | Class:{' '}
                  <span className="font-medium text-slate-700">{classLevel}</span>
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setGeneratedContent('')}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
                >
                  Generate Another
                </button>
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white text-sm font-medium rounded-lg hover:bg-emerald-600 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Download Note
                </button>
              </div>
            </div>

            <div className="prose max-w-none text-slate-700 whitespace-pre-wrap leading-relaxed text-sm bg-slate-50 p-6 rounded-xl border border-slate-200">
              {generatedContent}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
