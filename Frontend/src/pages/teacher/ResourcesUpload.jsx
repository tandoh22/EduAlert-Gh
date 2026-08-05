import React, { useState, useEffect } from 'react';
import PageHeader from '../../components/PageHeader';
import { Upload, FileText, X, BookOpen, Video, Image as ImageIcon, File, Loader2, Trash2 } from 'lucide-react';
import { uploadResource, getResources, deleteResource } from '../../services/resourcesService';

export default function ResourcesUpload() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [subject, setSubject] = useState('');
  const [classSection, setClassSection] = useState('');
  const [resourceType, setResourceType] = useState('');
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [resourcesList, setResourcesList] = useState([]);
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    fetchResourcesList();
  }, []);

  const fetchResourcesList = async () => {
    try {
      const data = await getResources();
      setResourcesList(data);
    } catch (err) {
      console.error('Failed to load resources:', err);
    }
  };

  const handleFileUpload = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setFiles([...files, ...selectedFiles]);
  };

  const removeFile = (index) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleDelete = async (resourceId) => {
    try {
      setDeleting(resourceId);
      await deleteResource(resourceId);
      setResourcesList(resourcesList.filter(r => r.id !== resourceId));
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
      setSubject('');
      setClassSection('');
      setResourceType('');
      setFiles([]);
      fetchResourcesList();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to upload resource');
    } finally {
      setLoading(false);
    }
  };

  const getFileIcon = (fileName) => {
    const ext = fileName.split('.').pop().toLowerCase();
    if (['pdf', 'doc', 'docx', 'txt'].includes(ext)) return FileText;
    if (['mp4', 'mov', 'avi'].includes(ext)) return Video;
    if (['jpg', 'jpeg', 'png', 'gif'].includes(ext)) return ImageIcon;
    return File;
  };

  return (
    <div>
      <PageHeader title="Resources Upload" subtitle="Share educational materials with your students" />

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
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Your Resources</h3>
          <div className="space-y-3">
            {resourcesList.map((resource) => {
              const Icon = getFileIcon(resource.file_url || resource.title);
              return (
                <div key={resource.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Icon className="w-5 h-5 text-slate-400" />
                    <div>
                      <span className="text-sm font-medium text-slate-900">{resource.title}</span>
                      <span className="text-xs text-slate-500 ml-2 capitalize">{resource.subject}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(resource.id)}
                    disabled={deleting === resource.id}
                    className="p-2 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-60"
                    title="Delete resource"
                  >
                    {deleting === resource.id ? (
                      <Loader2 className="w-4 h-4 text-red-500 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4 text-red-500" />
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="max-w-3xl">
        <form onSubmit={handleSubmit} className="edu-card p-6">
          <div className="space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Resource Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter resource title"
                className="w-full px-4 py-3 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter resource description"
                rows={3}
                className="w-full px-4 py-3 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none"
                required
              />
            </div>

            {/* Subject and Class */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Class
                </label>
                <select
                  value={classSection}
                  onChange={(e) => setClassSection(e.target.value)}
                  className="w-full px-4 py-3 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  required
                >
                  <option value="">Select class</option>
                  <option value="JHS-1">JHS 1</option>
                  <option value="JHS-2">JHS 2</option>
                  <option value="JHS-3">JHS 3</option>
                </select>
              </div>
            </div>

            {/* Resource Type */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Resource Type
              </label>
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
                          ? 'border-emerald-500 bg-emerald-50'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <input
                        type="radio"
                        value={type.value}
                        checked={resourceType === type.value}
                        onChange={(e) => setResourceType(e.target.value)}
                        className="sr-only"
                      />
                      <Icon className={`w-6 h-6 ${resourceType === type.value ? 'text-emerald-600' : 'text-slate-400'}`} />
                      <span className="text-sm font-medium text-slate-700">{type.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* File Upload */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Upload Files
              </label>
              <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:border-emerald-500 transition-colors">
                <Upload className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <p className="text-sm text-slate-600 mb-2">
                  Drag and drop files here, or click to browse
                </p>
                <p className="text-xs text-slate-400 mb-4">
                  PDF, DOC, DOCX, MP4, JPG, PNG up to 50MB
                </p>
                <input
                  type="file"
                  onChange={handleFileUpload}
                  multiple
                  accept=".pdf,.doc,.docx,.mp4,.mov,.jpg,.jpeg,.png"
                  className="hidden"
                  id="resource-upload"
                />
                <label
                  htmlFor="resource-upload"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#0A192F] text-white text-sm font-medium rounded-lg hover:bg-[#0F2440] transition-colors cursor-pointer"
                >
                  <Upload className="w-4 h-4" />
                  Choose Files
                </label>
              </div>

              {/* File List */}
              {files.length > 0 && (
                <div className="mt-4 space-y-2">
                  {files.map((file, index) => {
                    const Icon = getFileIcon(file.name);
                    return (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 bg-slate-50 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <Icon className="w-5 h-5 text-slate-400" />
                          <div>
                            <span className="text-sm text-slate-700">{file.name}</span>
                            <span className="text-xs text-slate-400 ml-2">
                              {(file.size / (1024 * 1024)).toFixed(2)} MB
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeFile(index)}
                          className="p-1 hover:bg-slate-200 rounded transition-colors"
                        >
                          <X className="w-4 h-4 text-slate-400" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
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
                    Uploading...
                  </>
                ) : (
                  <>
                    <BookOpen className="w-4 h-4" />
                    Upload Resource
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
