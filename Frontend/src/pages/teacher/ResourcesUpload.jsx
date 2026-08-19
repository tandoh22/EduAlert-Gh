import React, { useState, useEffect } from 'react';
import PageHeader from '../../components/PageHeader';
import { Upload, FileText, X, BookOpen, Video, Image as ImageIcon, File, Loader2, Trash2, CheckCircle2 } from 'lucide-react';
import { uploadResource, getResources, deleteResource } from '../../services/resourcesService';
import { fetchMyClasses } from '../../services/teacherService';

export default function ResourcesUpload() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [subject, setSubject] = useState('');
  const [classSection, setClassSection] = useState('');
  const [resourceType, setResourceType] = useState('document');
  const [assignedClasses, setAssignedClasses] = useState([]);
  const [availableSubjects, setAvailableSubjects] = useState([]);
  const [files, setFiles] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
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

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setFiles(Array.from(e.target.files));
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
      setFiles(Array.from(e.dataTransfer.files));
    }
  };

  const removeFile = (index) => {
    setFiles(files.filter((_, i) => i !== index));
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
        subtitle="Share learning materials and study guides with students in your assigned classes"
      />

      {success && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <p className="text-sm font-medium text-emerald-800">
            Educational resource uploaded successfully!
          </p>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
          <p className="text-sm font-medium text-red-800">{error}</p>
        </div>
      )}

      {/* Uploaded Resources List */}
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
                    <span className="text-xs text-slate-500 ml-2 capitalize font-semibold bg-slate-200 px-2 py-0.5 rounded">
                      {resource.subject}
                    </span>
                    <span className="text-xs text-slate-400 ml-2">Class: {resource.class_level}</span>
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Class <span className="text-red-500">*</span>
              </label>
              <select
                value={classSection}
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

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Resource Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Semester 1 Physics Formulas & Diagrams"
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

          {/* File Upload Zone */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Upload File / Material (PDF, DOCX, Video, Image)
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
                onChange={handleFileSelect}
                className="hidden"
                id="resource-file-upload"
              />
              <label htmlFor="resource-file-upload" className="cursor-pointer">
                <Upload className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                <p className="text-sm font-medium text-slate-700">
                  {files.length > 0 ? files[0].name : 'Click to select or drag & drop resource file here'}
                </p>
                <p className="text-xs text-slate-400 mt-1">Supports PDF, DOCX, MP4, PNG, JPG (up to 20MB)</p>
              </label>
            </div>

            {files.length > 0 && (
              <div className="mt-3 flex items-center justify-between p-3 bg-slate-100 rounded-lg text-sm text-slate-700">
                <div className="flex items-center gap-2 truncate">
                  <FileText className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="truncate font-medium">{files[0].name}</span>
                  <span className="text-xs text-slate-400">
                    ({(files[0].size / 1024).toFixed(1)} KB)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => removeFile(0)}
                  className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
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
                        ? 'border-emerald-500 bg-emerald-50/50 text-emerald-700 font-semibold'
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
                    <span className="text-xs">{type.label}</span>
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
