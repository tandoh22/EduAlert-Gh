import { useState, useEffect, useMemo } from 'react';
import { BookOpen, Download, Search, Sparkles, Loader2 } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import { getResources } from '../services/resourcesService';

export default function Resources() {
  const [search, setSearch] = useState('');
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchResources();
  }, []);

  const fetchResources = async () => {
    try {
      setLoading(true);
      const data = await getResources();
      setResources(data);
    } catch (err) {
      setError('Failed to load resources');
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => resources.filter(({ title, subject }) => `${title} ${subject}`.toLowerCase().includes(search.toLowerCase())), [search, resources]);

  const handleDownload = (resource) => {
    // In production, this would download the actual file
    // For now, we'll create a text file with the resource info
    const content = `${resource.title}\n\nSubject: ${resource.subject}\nDescription: ${resource.description}\n\n${resource.ai_summary || ''}`;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${resource.title.replace(/\s+/g, '_')}_resource.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <PageHeader title="Resource library" subtitle="Books and past-question packs, curated for WASSCE." />
      
      <div className="relative mb-4 max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search resources..." className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-700 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20" />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 text-emerald-500 animate-spin" />
        </div>
      ) : error ? (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      ) : (
        <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((resource) => (
            <article key={resource.id} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="relative h-28 bg-gradient-to-br from-[#193562] to-[#526e96] p-4">
                <BookOpen className="absolute right-4 top-4 h-5 w-5 text-white/50" />
                <span className="absolute bottom-3 rounded-full bg-white/20 px-2.5 py-1 text-xs text-white capitalize">{resource.subject}</span>
              </div>
              <div className="p-4">
                <h2 className="text-sm font-semibold text-slate-800">{resource.title}</h2>
                <p className="mt-1 text-xs text-slate-400 capitalize">{resource.resource_type || 'Document'}</p>
                {resource.ai_summary && (
                  <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-2.5">
                    <p className="flex items-center gap-1 text-[11px] font-semibold text-slate-600"><Sparkles className="h-3 w-3" />AI summary</p>
                    <p className="mt-1 text-[11px] leading-relaxed text-slate-600">{resource.ai_summary}</p>
                  </div>
                )}
                <button type="button" onClick={() => handleDownload(resource)} className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-50"><Download className="h-3.5 w-3.5" />Download</button>
              </div>
            </article>
          ))}
        </section>
      )}
      {filtered.length === 0 && !loading && <p className="py-10 text-center text-sm text-slate-500">No resources match your search.</p>}
    </div>
  );
}
