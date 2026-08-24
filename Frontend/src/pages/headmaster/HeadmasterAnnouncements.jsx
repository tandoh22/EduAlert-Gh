import React, { useState, useEffect } from 'react';
import PageHeader from '../../components/PageHeader';
import { Megaphone, Send, Calendar, Tag, Plus, Edit, Trash2, Eye, Loader2 } from 'lucide-react';
import { createAnnouncement, getAnnouncements, deleteAnnouncement } from '../../services/announcementService';
import { fetchClasses } from '../../services/headmasterService';

export default function HeadmasterAnnouncements() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [priority, setPriority] = useState('normal');
  const [showForm, setShowForm] = useState(false);
  const [announcements, setAnnouncements] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchAnnouncements();
    fetchClasses()
      .then((res) => setClasses(res.data))
      .catch(() => {});
  }, []);

  const classesMap = Object.fromEntries(classes.map((c) => [c.id, c]));

  const fetchAnnouncements = async () => {
    try {
      setFetchLoading(true);
      const data = await getAnnouncements();
      setAnnouncements(data);
    } catch (err) {
      setError('Failed to load announcements');
    } finally {
      setFetchLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      await createAnnouncement({
        title,
        body: content,
        is_schoolwide: targetAudience === 'all',
        class_id: null,
      });
      setSuccess(true);
      setShowForm(false);
      setTitle('');
      setContent('');
      setCategory('');
      setTargetAudience('');
      setPriority('normal');
      fetchAnnouncements();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to post announcement');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteAnnouncement(id);
      fetchAnnouncements();
    } catch (err) {
      setError('Failed to delete announcement');
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

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-700';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700';
      case 'low':
        return 'bg-emerald-100 text-emerald-700';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div>
      <PageHeader title="Announcements" subtitle="Create and manage school-wide announcements" />

      {success && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
          <p className="text-sm font-medium text-emerald-800">Announcement posted successfully!</p>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
          <p className="text-sm font-medium text-red-800">{error}</p>
        </div>
      )}

      {!showForm ? (
        <div>
          {fetchLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 text-emerald-500 animate-spin" />
            </div>
          ) : (
            <>
              {/* Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="edu-card p-5">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center">
                      <Megaphone className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-sm text-slate-500">Total</span>
                  </div>
                  <div className="text-2xl font-bold text-slate-900">{announcements.length}</div>
                </div>

                <div className="edu-card p-5">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-lg bg-red-500 flex items-center justify-center">
                      <Megaphone className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-sm text-slate-500">School-wide</span>
                  </div>
                  <div className="text-2xl font-bold text-slate-900">
                    {announcements.filter(a => a.is_schoolwide).length}
                  </div>
                </div>

                <div className="edu-card p-5">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-lg bg-yellow-500 flex items-center justify-center">
                      <Megaphone className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-sm text-slate-500">Class-specific</span>
                  </div>
                  <div className="text-2xl font-bold text-slate-900">
                    {announcements.filter(a => !a.is_schoolwide).length}
                  </div>
                </div>

                <div className="edu-card p-5">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-lg bg-emerald-500 flex items-center justify-center">
                      <Megaphone className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-sm text-slate-500">Active</span>
                  </div>
                  <div className="text-2xl font-bold text-slate-900">{announcements.length}</div>
                </div>
              </div>
            </>
          )}

          {/* Action Button */}
          <div className="mb-6">
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 px-6 py-3 bg-emerald-500 text-white text-sm font-medium rounded-xl hover:bg-emerald-600 transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Announcement
            </button>
          </div>

          {/* Announcements List */}
          <div className="space-y-4">
            {announcements.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-sm text-slate-500">No announcements available</p>
              </div>
            ) : (
              announcements.map((announcement) => (
                <div key={announcement.id} className="edu-card p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#0A192F] flex items-center justify-center">
                        <Megaphone className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900">{announcement.title}</h3>
                        <p className="text-sm text-slate-500">Posted {formatTime(announcement.created_at)}</p>
                      </div>
                    </div>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                      announcement.is_schoolwide ? 'bg-[#0A192F] text-white' : 'bg-emerald-100 text-emerald-700'
                    }`}>
                      {announcement.is_schoolwide ? 'school-wide' : 'class'}
                    </span>
                  </div>

                  <p className="text-sm text-slate-600 mb-4 line-clamp-2">{announcement.body}</p>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded">
                        {announcement.is_schoolwide
                          ? 'All Students'
                          : classesMap[announcement.class_id]?.name
                          ? `${classesMap[announcement.class_id].name}${classesMap[announcement.class_id].code ? ` (${classesMap[announcement.class_id].code})` : ''}`
                          : `Class ${announcement.class_id}`}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button className="p-2 hover:bg-slate-200 rounded-lg transition-colors" title="View">
                        <Eye className="w-4 h-4 text-slate-400" />
                      </button>
                      <button className="p-2 hover:bg-slate-200 rounded-lg transition-colors" title="Edit">
                        <Edit className="w-4 h-4 text-slate-400" />
                      </button>
                      <button 
                        onClick={() => handleDelete(announcement.id)}
                        className="p-2 hover:bg-slate-200 rounded-lg transition-colors" 
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4 text-slate-400" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      ) : (
        <div className="max-w-3xl">
          <form onSubmit={handleSubmit} className="edu-card p-6">
            <div className="space-y-6">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Announcement Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter announcement title"
                  className="w-full px-4 py-3 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  required
                />
              </div>

              {/* Content */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Announcement Content
                </label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Enter the full announcement content"
                  rows={6}
                  className="w-full px-4 py-3 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none"
                  required
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Category
                </label>
                <div className="relative">
                  <Tag className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    required
                  >
                    <option value="">Select category</option>
                    <option value="general">General</option>
                    <option value="exam">Exam</option>
                    <option value="event">Event</option>
                    <option value="holiday">Holiday</option>
                    <option value="meeting">Meeting</option>
                  </select>
                </div>
              </div>

              {/* Target Audience */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Target Audience
                </label>
                <select
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                  className="w-full px-4 py-3 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  required
                >
                  <option value="">Select audience</option>
                  <option value="all">All</option>
                  <option value="students">Students Only</option>
                  <option value="teachers">Teachers Only</option>
                  <option value="parents">Parents Only</option>
                </select>
              </div>

              {/* Priority */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Priority Level
                </label>
                <div className="flex gap-4">
                  {['low', 'normal', 'high', 'urgent'].map((level) => (
                    <label key={level} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        value={level}
                        checked={priority === level}
                        onChange={(e) => setPriority(e.target.value)}
                        className="w-4 h-4 text-emerald-500 focus:ring-emerald-500"
                      />
                      <span className="text-sm text-slate-700 capitalize">{level}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-6 py-3 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 px-6 py-3 bg-emerald-500 text-white text-sm font-medium rounded-xl hover:bg-emerald-600 transition-colors disabled:opacity-60"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Posting...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Post Announcement
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
