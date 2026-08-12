import { useState, useEffect } from 'react';
import { BookOpen, Download, Loader2 } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import { getSharedLessonNotes } from '../services/lessonNotesService';

export default function LessonNotes() {
  const [lessonNotes, setLessonNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchLessonNotes();
  }, []);

  const fetchLessonNotes = async () => {
    try {
      setLoading(true);
      const data = await getSharedLessonNotes();
      setLessonNotes(data);
    } catch (err) {
      setError('Failed to load lesson notes');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (note) => {
    const blob = new Blob([note.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${note.title.replace(/\s+/g, '_')}_lesson_note.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  return (
    <div>
      <PageHeader title="Lesson notes" subtitle="Notes shared by your teachers." />

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 text-emerald-500 animate-spin" />
        </div>
      ) : error ? (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      ) : lessonNotes.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-sm text-slate-500">No lesson notes available</p>
        </div>
      ) : (
        <section className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {lessonNotes.map((note) => (
            <article
              key={note.id}
              className="min-h-36 rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="mb-4 flex items-center justify-between gap-3">
                <span className="rounded-full border border-slate-200 px-2.5 py-0.5 text-xs font-medium text-slate-600 capitalize">
                  {note.subject}
                </span>
                <span className="text-xs text-slate-400">{note.class_level || 'All levels'}</span>
              </div>

              <h2 className="text-sm font-semibold text-slate-800">{note.title}</h2>

              <div className="mt-7 flex items-center justify-between text-xs text-slate-500">
                <span className="flex items-center gap-1.5">
                  <BookOpen className="h-3.5 w-3.5" />
                  Shared {formatTime(note.created_at)}
                </span>
                <button
                  type="button"
                  onClick={() => handleDownload(note)}
                  aria-label={`Download ${note.title}`}
                  className="rounded p-1 text-slate-600 transition hover:bg-slate-100 hover:text-slate-950"
                >
                  <Download className="h-4 w-4" />
                </button>
              </div>
            </article>
          ))}
        </section>
      )}
    </div>
  );
}
