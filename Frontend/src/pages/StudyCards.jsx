import React, { useState } from 'react';
import { Upload, Sparkles, ChevronDown } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import { useStudent } from '../context/StudentContext';
import { generateStudyCards } from '../services/portalService';

const subjects = ['Biology', 'Chemistry', 'Physics', 'Core Maths', 'Elective Maths', 'English', 'History'];

export default function StudyCards() {
  const { studentId } = useStudent();
  const [subject, setSubject] = useState('Biology');
  const [topic, setTopic] = useState('Photosynthesis');
  const [notes, setNotes] = useState('');
  const [file, setFile] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [generatedCards, setGeneratedCards] = useState(null);

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!studentId) {
      setError('Student ID not found. Please log in again.');
      return;
    }

    setGenerating(true);
    setMessage('');
    setError('');
    setGeneratedCards(null);

    try {
      const formData = new FormData();
      formData.append('subject', subject);
      formData.append('topic', topic);
      formData.append('student_id', studentId);
      if (file) {
        formData.append('file', file);
      }

      const response = await generateStudyCards(formData);
      setGeneratedCards(response.data);
      setMessage('Study cards generated successfully!');
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to generate study cards. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Study cards generator"
        subtitle="Turn any topic or PDF into flashcards in seconds."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2">
          <form onSubmit={handleGenerate} className="edu-card p-6 space-y-5">
            <h2 className="font-semibold text-slate-900">What would you like to study?</h2>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Subject</label>
              <div className="relative">
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full appearance-none pl-4 pr-10 py-2.5 text-sm border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                >
                  {subjects.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Topic</label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                placeholder="e.g. Photosynthesis"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Notes or context (optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none"
                placeholder="Paste key ideas, past questions, or your own notes..."
              />
            </div>

            <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center hover:border-slate-300 transition-colors">
              <input
                type="file"
                accept=".pdf"
                onChange={(e) => setFile(e.target.files[0])}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <Upload className="w-8 h-8 text-slate-400 mx-auto mb-3" />
                <p className="text-sm font-medium text-slate-700">
                  Optional — upload a PDF, and we'll pull key concepts
                </p>
                <p className="text-xs text-slate-400 mt-1">Max 20 MB</p>
                {file && <p className="text-sm text-emerald-600 mt-2">{file.name}</p>}
              </label>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={generating}
                className="flex items-center justify-center gap-2 px-6 py-2.5 bg-[#0A192F] text-white text-sm font-semibold rounded-xl hover:bg-[#0F2647] disabled:opacity-60 transition-colors w-full sm:w-auto"
              >
                <Sparkles className="w-4 h-4" />
                {generating ? 'Generating...' : 'Generate'}
              </button>
            </div>
            {message && <div className="alert success mt-4">{message}</div>}
            {error && <div className="alert error mt-4">{error}</div>}
            {generatedCards && (
              <div className="mt-6">
                <h3 className="font-semibold text-slate-900 mb-4">Generated Study Cards</h3>
                <div className="space-y-3">
                  {generatedCards.cards && generatedCards.cards.map((card, index) => (
                    <div key={index} className="edu-card p-4">
                      <p className="font-medium text-slate-900 mb-2">Q: {card.question}</p>
                      <p className="text-sm text-slate-600">A: {card.answer}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Tips Panel */}
        <div className="edu-card p-5 h-fit">
          <h3 className="font-semibold text-slate-900 mb-4">Tips for great cards</h3>
          <ul className="space-y-3 text-sm text-slate-600">
            <li className="flex gap-2">
              <span className="text-emerald-500 shrink-0">•</span>
              Use short, focused topics (e.g. "Vectors — resolving components").
            </li>
            <li className="flex gap-2">
              <span className="text-emerald-500 shrink-0">•</span>
              Upload past questions to bias cards toward exam patterns.
            </li>
            <li className="flex gap-2">
              <span className="text-emerald-500 shrink-0">•</span>
              Mark "difficult" while studying — next round focuses there.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
