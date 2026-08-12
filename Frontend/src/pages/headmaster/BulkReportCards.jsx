import React, { useState, useEffect } from 'react';
import PageHeader from '../../components/PageHeader';
import { Download, Calendar, FileText, GraduationCap, Loader2, CheckCircle } from 'lucide-react';
import EmptyState from '../../components/LoadingState';

export default function BulkReportCards() {
  const [term, setTerm] = useState('');
  const [academicYear, setAcademicYear] = useState('');
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In production, fetch real classes from API
    setLoading(false);
  }, []);

  const [selectedClasses, setSelectedClasses] = useState([]);

  const toggleClassSelection = (classId) => {
    setSelectedClasses(prev =>
      prev.includes(classId)
        ? prev.filter(id => id !== classId)
        : [...prev, classId]
    );
  };

  const selectAllClasses = () => {
    setSelectedClasses(classes.map(c => c.id));
  };

  const deselectAllClasses = () => {
    setSelectedClasses([]);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 text-emerald-500 animate-spin" />
      </div>
    );
  }

  const handleGenerate = async (e) => {
    e.preventDefault();
    setGenerating(true);
    
    // Simulate API call
    setTimeout(() => {
      setGenerating(false);
      setGenerated(true);
    }, 3000);
  };

  const handleDownloadAll = () => {
    console.log('Downloading all report cards');
  };

  const handleDownloadClass = (classId) => {
    console.log('Downloading report cards for class:', classId);
  };

  return (
    <div>
      <PageHeader title="Bulk Report Cards" subtitle="Generate report cards for multiple classes at once" />

      {!generated ? (
        <div className="max-w-4xl">
          <form onSubmit={handleGenerate} className="edu-card p-6">
            <div className="space-y-6">
              {/* Academic Year and Term */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Academic Year
                  </label>
                  <select
                    value={academicYear}
                    onChange={(e) => setAcademicYear(e.target.value)}
                    className="w-full px-4 py-3 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    required
                  >
                    <option value="">Select year</option>
                    <option value="2023-2024">2023-2024</option>
                    <option value="2024-2025">2024-2025</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Term
                  </label>
                  <select
                    value={term}
                    onChange={(e) => setTerm(e.target.value)}
                    className="w-full px-4 py-3 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    required
                  >
                    <option value="">Select term</option>
                    <option value="1">Term 1</option>
                    <option value="2">Term 2</option>
                    <option value="3">Term 3</option>
                  </select>
                </div>
              </div>

              {/* Class Selection */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <label className="block text-sm font-medium text-slate-700">
                    Select Classes
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={selectAllClasses}
                      className="text-xs font-medium text-emerald-600 hover:text-emerald-700"
                    >
                      Select All
                    </button>
                    <button
                      type="button"
                      onClick={deselectAllClasses}
                      className="text-xs font-medium text-slate-600 hover:text-slate-700"
                    >
                      Deselect All
                    </button>
                  </div>
                </div>

                {classes.length === 0 ? (
                  <EmptyState message="No classes available. Create classes first to generate report cards." />
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {classes.map((classItem) => (
                      <label
                        key={classItem.id}
                        className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                          selectedClasses.includes(classItem.id)
                            ? 'border-emerald-500 bg-emerald-50'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedClasses.includes(classItem.id)}
                          onChange={() => toggleClassSelection(classItem.id)}
                          className="sr-only"
                        />
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-[#0A192F] flex items-center justify-center flex-shrink-0">
                            <GraduationCap className="w-5 h-5 text-white" />
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-slate-900">{classItem.name}</div>
                            <div className="text-xs text-slate-500">{classItem.students} students</div>
                            <div className="text-xs text-slate-400">{classItem.teacher}</div>
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                )}

                <p className="text-sm text-slate-500 mt-2">
                  {selectedClasses.length} class(es) selected ({selectedClasses.reduce((acc, id) => acc + classes.find(c => c.id === id)?.students || 0, 0)} students total)
                </p>
              </div>

              {/* Generate Button */}
              <div className="flex justify-end pt-4">
                <button
                  type="submit"
                  disabled={generating || selectedClasses.length === 0}
                  className="flex items-center gap-2 px-6 py-3 bg-emerald-500 text-white text-sm font-medium rounded-xl hover:bg-emerald-600 transition-colors disabled:opacity-60"
                >
                  {generating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Generating Report Cards...
                    </>
                  ) : (
                    <>
                      <FileText className="w-4 h-4" />
                      Generate Report Cards
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Summary */}
          <div className="edu-card p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-emerald-500 flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Report Cards Generated</h3>
                  <p className="text-sm text-slate-500">
                    Term {term} • {academicYear} • {selectedClasses.length} class(es)
                  </p>
                </div>
              </div>
              <button
                onClick={handleDownloadAll}
                className="flex items-center gap-2 px-4 py-2 bg-[#0A192F] text-white text-sm font-medium rounded-lg hover:bg-[#0F2440] transition-colors"
              >
                <Download className="w-4 h-4" />
                Download All
              </button>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="bg-slate-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-slate-900">{selectedClasses.length}</div>
                <div className="text-sm text-slate-500">Classes</div>
              </div>
              <div className="bg-slate-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-slate-900">
                  {selectedClasses.reduce((acc, id) => acc + classes.find(c => c.id === id)?.students || 0, 0)}
                </div>
                <div className="text-sm text-slate-500">Students</div>
              </div>
              <div className="bg-slate-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-emerald-600">Ready</div>
                <div className="text-sm text-slate-500">Status</div>
              </div>
            </div>
          </div>

          {/* Class List */}
          <div className="edu-card overflow-hidden">
            <div className="divide-y divide-slate-100">
              {classes.filter(c => selectedClasses.includes(c.id)).map((classItem) => (
                <div key={classItem.id} className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#0A192F] flex items-center justify-center">
                      <GraduationCap className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <div className="font-medium text-slate-900">{classItem.name}</div>
                      <div className="text-sm text-slate-500">{classItem.students} students • {classItem.teacher}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDownloadClass(classItem.id)}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-[#0A192F] hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              onClick={() => setGenerated(false)}
              className="px-6 py-3 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
            >
              Generate New
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
