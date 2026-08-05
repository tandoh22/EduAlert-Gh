import React, { useState, useEffect } from 'react';
import PageHeader from '../../components/PageHeader';
import { FileText, Download, Calendar, User, GraduationCap, Loader2, Trash2 } from 'lucide-react';
import { generateReportCard, getStudentReportCards, deleteReportCard } from '../../services/reportCardService';

export default function ReportCardGenerator() {
  const [term, setTerm] = useState('');
  const [academicYear, setAcademicYear] = useState('');
  const [classSection, setClassSection] = useState('');
  const [generating, setGenerating] = useState(false);
  const [generatedReport, setGeneratedReport] = useState(null);
  const [reportCardsList, setReportCardsList] = useState([]);
  const [deleting, setDeleting] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchReportCardsList();
  }, []);

  const fetchReportCardsList = async () => {
    try {
      // For now, we'll just set empty since we need student_id to fetch specific cards
      // In production, this would fetch report cards for the teacher's class
      setReportCardsList([]);
    } catch (err) {
      console.error('Failed to load report cards:', err);
    }
  };

  const handleDelete = async (reportId) => {
    try {
      setDeleting(reportId);
      await deleteReportCard(reportId);
      setReportCardsList(reportCardsList.filter(r => r.id !== reportId));
      setSuccess('Report card deleted successfully');
    } catch (err) {
      setError('Failed to delete report card');
    } finally {
      setDeleting(null);
    }
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    setGenerating(true);
    setError('');
    setSuccess(false);
    
    try {
      // This would need actual student_id in production
      const report = await generateReportCard({
        student_id: 1, // TODO: Get actual student ID
        term,
        year: parseInt(academicYear),
      });
      setGeneratedReport(report);
      setSuccess('Report card generated successfully!');
      fetchReportCardsList();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to generate report card');
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = (studentId) => {
    console.log('Downloading report for student:', studentId);
  };

  const handleDownloadAll = () => {
    console.log('Downloading all reports');
  };

  return (
    <div>
      <PageHeader title="Report Card Generator" subtitle="Generate report cards for your students" />

      {success && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
          <p className="text-sm font-medium text-emerald-800">{success}</p>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
          <p className="text-sm font-medium text-red-800">{error}</p>
        </div>
      )}

      {/* Report Cards List */}
      {reportCardsList.length > 0 && (
        <div className="edu-card p-6 mb-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Generated Report Cards</h3>
          <div className="space-y-3">
            {reportCardsList.map((reportCard) => (
              <div key={reportCard.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-slate-400" />
                  <div>
                    <span className="text-sm font-medium text-slate-900">
                      Term {reportCard.term} - {reportCard.year}
                    </span>
                    <span className="text-xs text-slate-500 ml-2">
                      Avg: {reportCard.overall_average}%
                    </span>
                    {reportCard.approved === 'approved' && (
                      <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                        Approved
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleDownload(reportCard.student_id)}
                    className="p-2 hover:bg-slate-200 rounded-lg transition-colors"
                    title="Download"
                  >
                    <Download className="w-4 h-4 text-slate-400" />
                  </button>
                  <button
                    onClick={() => handleDelete(reportCard.id)}
                    disabled={deleting === reportCard.id}
                    className="p-2 hover:bg-red-100 rounded-lg transition-colors disabled:opacity-60"
                    title="Delete report card"
                  >
                    {deleting === reportCard.id ? (
                      <Loader2 className="w-4 h-4 text-red-500 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4 text-red-500" />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="max-w-5xl">
        {!generatedReport ? (
          <form onSubmit={handleGenerate} className="edu-card p-6">
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                    Class
                  </label>
                  <select
                    value={classSection}
                    onChange={(e) => setClassSection(e.target.value)}
                    className="w-full px-4 py-3 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    required
                  >
                    <option value="">Select class</option>
                    <option value="JHS-1A">JHS 1A</option>
                    <option value="JHS-1B">JHS 1B</option>
                    <option value="JHS-2A">JHS 2A</option>
                    <option value="JHS-2B">JHS 2B</option>
                    <option value="JHS-3A">JHS 3A</option>
                    <option value="JHS-3B">JHS 3B</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button
                  type="submit"
                  disabled={generating}
                  className="flex items-center gap-2 px-6 py-3 bg-emerald-500 text-white text-sm font-medium rounded-xl hover:bg-emerald-600 transition-colors disabled:opacity-60"
                >
                  {generating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Generating...
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
        ) : (
          <div className="space-y-6">
            {/* Report Summary */}
            <div className="edu-card p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500 flex items-center justify-center">
                    <GraduationCap className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">Report Cards Generated</h3>
                    <p className="text-sm text-slate-500">
                      Term {generatedReport.term} • {generatedReport.academicYear} • {generatedReport.classSection}
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
                  <div className="text-2xl font-bold text-slate-900">{generatedReport.students.length}</div>
                  <div className="text-sm text-slate-500">Students</div>
                </div>
                <div className="bg-slate-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-emerald-600">
                    {Math.round(generatedReport.students.reduce((acc, s) => acc + s.average, 0) / generatedReport.students.length)}%
                  </div>
                  <div className="text-sm text-slate-500">Class Average</div>
                </div>
                <div className="bg-slate-50 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-slate-900">A</div>
                  <div className="text-sm text-slate-500">Best Grade</div>
                </div>
              </div>
            </div>

            {/* Student Reports */}
            <div className="edu-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Student</th>
                      <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Student ID</th>
                      <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Average</th>
                      <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Grade</th>
                      <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Rank</th>
                      <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {generatedReport.students.map((student) => (
                      <tr key={student.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-[#0A192F] text-white flex items-center justify-center text-xs font-semibold">
                              {student.name.split(' ').map(n => n[0]).join('')}
                            </div>
                            <div className="font-medium text-slate-900">{student.name}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-slate-600">{student.studentId}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm font-semibold text-slate-900">{student.average}%</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${
                            student.grade === 'A' ? 'bg-emerald-100 text-emerald-700' :
                            student.grade === 'B' ? 'bg-blue-100 text-blue-700' :
                            student.grade === 'C' ? 'bg-orange-100 text-orange-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {student.grade}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-slate-600">#{student.rank}</span>
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => handleDownload(student.studentId)}
                            className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-[#0A192F] hover:bg-slate-100 rounded-lg transition-colors"
                          >
                            <Download className="w-4 h-4" />
                            Download
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                onClick={() => setGeneratedReport(null)}
                className="px-6 py-3 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
              >
                Generate New
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
