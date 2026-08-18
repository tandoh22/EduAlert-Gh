import React, { useState, useEffect } from 'react';
import PageHeader from '../../components/PageHeader';
import { Upload, FileText, X, BookOpen, Video, Image as ImageIcon, File, Loader2, Trash2 } from 'lucide-react';
import { uploadResource, getResources, deleteResource } from '../../services/resourcesService';
import { fetchMyClasses } from '../../services/teacherService';

export default function ResourcesUpload() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [subject, setSubject] = useState('');
  const [classSection, setClassSection] = useState('');
  const [resourceType, setResourceType] = useState('');
  const [assignedClasses, setAssignedClasses] = useState([]);
  const [availableSubjects, setAvailableSubjects] = useState([]);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [resourcesList, setResourcesList] = useState([]);
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    fetchResourcesList();
    loadClasses();
  }, []);

  const loadClasses = async () => {
    try {
      const res = await fetchMyClasses();
      const classes = res.data || [];
      setAssignedClasses(classes);
      if (classes.length > 0) {
        setClassSection(classes[0].name);
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
    setClassSection(selectedClassName);
    const cls = assignedClasses.find((c) => c.name === selectedClassName);
    const subjects = cls?.subjects || [];
    setAvailableSubjects(subjects);
    if (subjects.length > 0) {
      setSubject(subjects[0]);
    } else {
      setSubject('');
    }
  };

  const fetchResourcesList = async () => {
    try {
      const data = await getResources();
      setResourcesList(data);
    } catch (err) {
      console.error('Failed to load resources:', err);
    }
  };

  const handleDelete = async (resourceId) => {
    try {
      setDeleting(resourceId);
      await deleteResource(resourceId);
      setResourcesList(resourcesList.filter((r) => r.id !== resourceId));
    } catch (err) {
      setError('Failed to delete resource');
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
      await uploadResource({
        title,
        description,
        subject,
        class_level: classSection,
        resource_type: resourceType,
        file_url: files.length > 0 ? files[0].name : null,
      });
      setSuccess(true);
      setTitle('');
      setDescription('');
      setResourceType('');
      setFiles([]);
      fetchResourcesList();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to upload resource');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Resources Upload"
        subtitle="Share educational materials with students in your assigned classes for this semester"
      />

      {success && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
          <p className="text-sm font-medium text-emerald-800">Resource uploaded successfully!</p>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
          <p className="text-sm font-medium text-red-800">{error}</p>
        </div>
      )}

      {/* Resources List */}
      {resourcesList.length > 0 && (
        <div className="edu-card p-6 mb-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Uploaded Resources</h3>
          <div className="space-y-3">
            {resourcesList.map((resource) => (
              <div
                key={resource.id}
                className="flex items-center justify-between p-4 bg-slate-50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-slate-400" />
                  <div>
                    <span className="text-sm font-medium text-slate-900">{resource.title}</span>
                    <span className="text-xs text-slate-500 ml-2 capitalize font-semibold">
                      {resource.subject}
                    </span>
                    <span className="text-xs text-slate-400 ml-2">{resource.class_level}</span>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(resource.id)}
                  disabled={deleting === resource.id}
                  className="p-2 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-60"
                  title="Delete resource"
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload Resource Form */}
      <div className="edu-card p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-6">Upload New Resource</h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Resource Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Semester 1 Biology Revision Guide"
              className="w-full px-4 py-3 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of the learning material..."
              rows={3}
              className="w-full px-4 py-3 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Assigned Class</label>
              <select
                value={classSection}
                onChange={(e) => handleClassChange(e.target.value)}
                className="w-full px-4 py-3 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                required
              >
                {assignedClasses.length === 0 && <option value="">No classes assigned</option>}
                {assignedClasses.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name} ({c.course || 'Core'})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Assigned Subject</label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-4 py-3 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
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

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Resource Type</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { value: 'document', label: 'Document', icon: FileText },
                { value: 'video', label: 'Video', icon: Video },
                { value: 'image', label: 'Image', icon: ImageIcon },
                { value: 'other', label: 'Other', icon: File },
              ].map((type) => {
                const Icon = type.icon;
                return (
                  <label
                    key={type.value}
                    className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                      resourceType === type.value
                        ? 'border-emerald-500 bg-emerald-50/50 text-emerald-700'
                        : 'border-slate-200 hover:border-slate-300 text-slate-600'
                    }`}
                  >
                    <input
                      type="radio"
                      name="resourceType"
                      value={type.value}
                      checked={resourceType === type.value}
                      onChange={(e) => setResourceType(e.target.value)}
                      className="sr-only"
                    />
                    <Icon className="w-6 h-6" />
                    <span className="text-xs font-medium">{type.label}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2.5 bg-emerald-500 text-white text-sm font-medium rounded-xl hover:bg-emerald-600 transition-colors disabled:opacity-60"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Upload Resource
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
