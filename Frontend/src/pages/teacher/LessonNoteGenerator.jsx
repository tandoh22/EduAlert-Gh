import React, { useState } from 'react';
import PageHeader from '../../components/PageHeader';
import { BookOpen, Sparkles, FileText, Download, Loader2 } from 'lucide-react';
import { generateLessonNote, getMyLessonNotes } from '../../services/lessonNotesService';

export default function LessonNoteGenerator() {
  const [topic, setTopic] = useState('');
  const [subject, setSubject] = useState('');
  const [classLevel, setClassLevel] = useState('');
  const [duration, setDuration] = useState('');
  const [generating, setGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

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
      <PageHeader title="Lesson Note Generator" subtitle="Generate AI-powered lesson notes for your classes" />

      {success && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
          <p className="text-sm font-medium text-emerald-800">Lesson note generated successfully!</p>
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
                  Lesson Topic
                </label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="Enter the lesson topic"
                  className="w-full px-4 py-3 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  required
                />
              </div>

              {/* Subject */}
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

              {/* Class Level */}
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

              {/* Duration */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Lesson Duration
                </label>
                <select
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-full px-4 py-3 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  required
                >
                  <option value="">Select duration</option>
                  <option value="30">30 minutes</option>
                  <option value="45">45 minutes</option>
                  <option value="60">60 minutes</option>
                  <option value="90">90 minutes</option>
                </select>
              </div>

              {/* Generate Button */}
              <div className="flex justify-end pt-4">
                <button
                  type="submit"
                  disabled={generating}
                  className="flex items-center gap-2 px-6 py-3 bg-emerald-500 text-white text-sm font-medium rounded-xl hover:bg-emerald-600 transition-colors disabled:opacity-60"
                >
                  {generating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Generate Lesson Note
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        ) : (
          <div className="edu-card p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-emerald-500 flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">{topic}</h3>
                  <p className="text-sm text-slate-500">{subject} • {classLevel} • {duration} minutes</p>
                </div>
              </div>
              <button
                onClick={handleDownload}
                className="flex items-center gap-2 px-4 py-2 bg-[#0A192F] text-white text-sm font-medium rounded-lg hover:bg-[#0F2440] transition-colors"
              >
                <Download className="w-4 h-4" />
                Download
              </button>
            </div>

            <div className="prose prose-slate max-w-none">
              <pre className="whitespace-pre-wrap text-sm text-slate-700 bg-slate-50 p-6 rounded-xl">
                {generatedContent}
              </pre>
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-slate-200">
              <button
                onClick={() => setGeneratedContent('')}
                className="px-6 py-3 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
              >
                Generate New
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
