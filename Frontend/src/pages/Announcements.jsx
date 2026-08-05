import { useState, useEffect } from "react";
import { Search, Bell, Loader2, X } from "lucide-react";
import PageHeader from "../components/PageHeader";
import { getAnnouncements } from "../services/announcementService";

export default function AnnouncementsPage() {
  const [search, setSearch] = useState("");
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const data = await getAnnouncements();
      setAnnouncements(data);
    } catch (err) {
      setError("Failed to load announcements");
    } finally {
      setLoading(false);
    }
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
      <PageHeader title="Announcements" subtitle="School-wide and class notices." />

      <div className="flex items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search announcements..."
            className="w-full pl-9 pr-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />
        </div>
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
        <div className="max-w-3xl space-y-4">
          {announcements.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-sm text-slate-500">No announcements available</p>
            </div>
          ) : (
            announcements.map((item) => (
              <div
                key={item.id}
                onClick={() => setSelectedAnnouncement(item)}
                className="edu-card p-5 flex gap-4 cursor-pointer hover:bg-slate-50 transition-colors"
              >
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                    item.is_schoolwide ? "bg-[#0A192F]" : "bg-emerald-100"
                  }`}
                >
                  <Bell
                    className={`w-4 h-4 ${
                      item.is_schoolwide ? "text-white" : "text-emerald-700"
                    }`}
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-[15px] font-semibold text-slate-900">
                      {item.title}
                    </h3>
                    <span
                      className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                        item.is_schoolwide
                          ? "bg-[#0A192F] text-white"
                          : "bg-emerald-100 text-emerald-700"
                      }`}
                    >
                      {item.is_schoolwide ? "school" : "class"}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 mb-2">{item.body}</p>
                  <p className="text-xs text-slate-400">
                    Posted {formatTime(item.created_at)}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      )}
      
      {/* Announcement Detail Modal */}
      {selectedAnnouncement && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-semibold text-slate-900">{selectedAnnouncement.title}</h2>
                  <span
                    className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                      selectedAnnouncement.is_schoolwide
                        ? "bg-[#0A192F] text-white"
                        : "bg-emerald-100 text-emerald-700"
                    }`}
                  >
                    {selectedAnnouncement.is_schoolwide ? "school" : "class"}
                  </span>
                </div>
                <button onClick={() => setSelectedAnnouncement(null)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Posted {formatTime(selectedAnnouncement.created_at)}
              </p>
            </div>
            <div className="p-6">
              <div className="prose prose-slate max-w-none">
                <p className="text-slate-700 whitespace-pre-wrap">{selectedAnnouncement.body}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
