import React, { useState, useEffect } from 'react';
import PageHeader from '../../components/PageHeader';
import { Megaphone, Send, Calendar, Tag, Loader2, Trash2 } from 'lucide-react';
import { createAnnouncement, getAnnouncements, deleteAnnouncement } from '../../services/announcementService';

export default function PostNotice() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [classId, setClassId] = useState('1');
  const [priority, setPriority] = useState('normal');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [announcementsList, setAnnouncementsList] = useState([]);
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    fetchAnnouncementsList();
  }, []);

  const fetchAnnouncementsList = async () => {
    try {
      const data = await getAnnouncements();
      setAnnouncementsList(data);
    } catch (err) {
      console.error('Failed to load announcements:', err);
    }
  };

  const handleDelete = async (announcementId) => {
    try {
      setDeleting(announcementId);
      await deleteAnnouncement(announcementId);
      setAnnouncementsList(announcementsList.filter(a => a.id !== announcementId));
    } catch (err) {
      setError('Failed to delete announcement');
    } finally {
      setDeleting(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const announcement = await createAnnouncement({
        title,
        body: content,
        is_schoolwide: targetAudience === 'all',
        class_id: targetAudience !== 'all' ? parseInt(classId) : null,
      });
      setSuccess(true);
      setTitle('');
      setContent('');
      setCategory('');
      setTargetAudience('');
      setPriority('normal');
      fetchAnnouncementsList();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to post announcement');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <PageHeader title="Post Notice" subtitle="Create and send announcements to students and parents" />

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

      {/* Announcements List */}
      {announcementsList.length > 0 && (
        <div className="edu-card p-6 mb-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Your Announcements</h3>
          <div className="space-y-3">
            {announcementsList.map((announcement) => (
              <div key={announcement.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <Megaphone className="w-5 h-5 text-slate-400" />
                  <div>
                    <span className="text-sm font-medium text-slate-900">{announcement.title}</span>
                    <span className="text-xs text-slate-500 ml-2">
                      {announcement.is_schoolwide ? 'School-wide' : 'Class-specific'}
                    </span>
                    {announcement.created_at && (
                      <span className="text-xs text-slate-400 ml-2 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(announcement.created_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(announcement.id)}
                  disabled={deleting === announcement.id}
                  className="p-2 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-60"
                  title="Delete announcement"
                >
                  {deleting === announcement.id ? (
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

      <div className="max-w-3xl">
        <form onSubmit={handleSubmit} className="edu-card p-6">
          <div className="space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Notice Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter notice title"
                className="w-full px-4 py-3 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                required
              />
            </div>

            {/* Content */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Notice Content
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Enter the full notice content"
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
                <option value="all">All Students</option>
                <option value="JHS-1">JHS 1</option>
                <option value="JHS-2">JHS 2</option>
                <option value="JHS-3">JHS 3</option>
                <option value="parents">Parents Only</option>
              </select>
            </div>

            {targetAudience !== 'all' && (
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
            )}

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

            {/* Preview */}
            <div className="bg-slate-50 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-3">
                <Megaphone className="w-5 h-5 text-emerald-500" />
                <span className="text-sm font-semibold text-slate-700">Preview</span>
              </div>
              <div className="bg-white rounded-lg p-4 border border-slate-200">
                {title && <h3 className="font-semibold text-slate-900 mb-2">{title}</h3>}
                {content && <p className="text-sm text-slate-600 whitespace-pre-wrap">{content}</p>}
                {!title && !content && <p className="text-sm text-slate-400 italic">Notice preview will appear here</p>}
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                className="px-6 py-3 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
              >
                Save Draft
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
                    Post Notice
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
