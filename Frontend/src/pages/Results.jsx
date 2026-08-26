import React, { useEffect, useMemo, useState } from 'react';
import { ClipboardList, Timer, Trophy, Award, Download, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import SubjectTag from '../components/SubjectTag';
import LoadingState, { EmptyState, ErrorState } from '../components/LoadingState';
import { useStudent } from '../context/StudentContext';
import { fetchClassAssignments, fetchMyQuizAttempts, fetchMySubmissions } from '../services/portalService';
import { getMyTranscripts, getStudentReportCards } from '../services/reportCardService';
import { calcAverageScore, formatDate, gradeLetter } from '../utils/format';
import { calculateWASSCEGrade } from './teacher/ResultsGenerator';

export default function Results() {
  const { profile, studentId, classId, classCode, className, loading: profileLoading } = useStudent();
  const [submissions, setSubmissions] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [reportCards, setReportCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('transcripts');

  useEffect(() => {
    if (profileLoading) return;
    if (!classId) {
      setLoading(false);
      return;
    }

    const currentStudentId = studentId || profile?.id || profile?.student?.id;

    Promise.all([
      fetchClassAssignments(classId).catch(() => ({ data: [] })),
      fetchMySubmissions().catch(() => ({ data: [] })),
      fetchMyQuizAttempts().catch(() => ({ data: [] })),
      getMyTranscripts().catch(() => (currentStudentId ? getStudentReportCards(currentStudentId) : []))
    ])
      .then(([assignRes, submissionRes, attemptRes, reportRes]) => {
        const assignments = Object.fromEntries((assignRes.data || []).map((item) => [item.id, item]));
        setSubmissions(
          (submissionRes.data || [])
            .map((item) => ({ ...item, assignment: assignments[item.assignment_id] }))
            .filter((item) => item.teacher_score != null || item.ai_score != null)
        );
        setAttempts(attemptRes.data || []);
        
        // Filter strictly for approved / distributed transcripts
        const approvedReports = (reportRes || []).filter(
          (r) => r.approved === 'approved' || r.approved === 'distributed'
        );
        setReportCards(approvedReports);
      })
      .catch((err) => setError(err.response?.data?.detail || 'Failed to load results.'))
      .finally(() => setLoading(false));
  }, [classId, profileLoading, studentId, profile]);

  const assignmentScores = useMemo(
    () => submissions.map((item) => item.teacher_score ?? item.ai_score),
    [submissions]
  );
  const quizScores = useMemo(
    () => attempts.map((item) => item.percentage).filter((item) => item != null),
    [attempts]
  );
  const allScores = [...assignmentScores, ...quizScores];

  if (profileLoading || loading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;
  if (!classId) return <EmptyState message="No class enrollment found for your account." />;

  const stats = [
    {
      label: 'Overall Cumulative Average',
      value: `${calcAverageScore(allScores.map((score) => ({ score })))}%`,
      icon: Trophy
    },
    {
      label: 'Assignments Average',
      value: `${calcAverageScore(assignmentScores.map((score) => ({ score })))}%`,
      icon: ClipboardList
    },
    {
      label: 'Quizzes Average',
      value: `${calcAverageScore(quizScores.map((score) => ({ score })))}%`,
      icon: Timer
    }
  ];

  const handleDownloadPDF = (reportId) => {
    const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    window.open(`${backendUrl}/api/report-cards/${reportId}/pdf`, '_blank');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Results & Transcripts"
        subtitle="View graded assignments, quiz performances, and official published terminal transcripts."
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="edu-card p-5 flex items-center gap-4">
              <Icon className="w-6 h-6 text-emerald-600 shrink-0" />
              <div>
                <p className="text-2xl font-bold text-slate-900">{stat.value}</p>
                <p className="text-xs text-slate-500">{stat.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="border-b border-slate-200">
        <div className="flex gap-6">
          {['transcripts', 'assignments', 'quizzes'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 text-sm font-bold capitalize border-b-2 -mb-px transition-colors ${
                activeTab === tab
                  ? 'border-emerald-500 text-emerald-600'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              {tab === 'transcripts' ? 'Official Terminal Transcripts' : tab}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'transcripts' && (
        <div className="space-y-4">
          {reportCards.length === 0 ? (
            <div className="edu-card p-8 text-center text-slate-500 space-y-3">
              <Award className="w-12 h-12 text-slate-400 mx-auto" />
              <h3 className="font-bold text-slate-900 text-base">No Official Terminal Transcripts Distributed Yet</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                Official terminal transcripts for your class are currently being compiled and reviewed by the administration. Once approved and distributed by the Headmaster, your individual transcript and grades will appear here.
              </p>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-xs font-semibold mt-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                Status: Pending Headmaster Approval & Distribution
              </div>
            </div>
          ) : (
            reportCards.map((report) => {
              const scoreVal = report.final_score != null ? report.final_score : (report.overall_average != null ? report.overall_average : 0);
              const gradeInfo = calculateWASSCEGrade(scoreVal);

              return (
                <div key={report.id} className="edu-card p-6 border-2 border-emerald-500/20 shadow-md space-y-5">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-sm">
                        <Award className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-extrabold text-slate-900 text-base">
                            Official Terminal Transcript — {report.term || 'Semester 2'} {report.year || 2025}
                          </h3>
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Approved & Distributed
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Student: <span className="font-semibold text-slate-700">{report.student_name || profile?.full_name}</span> • Class: <span className="font-semibold text-slate-700">{report.class_name || profile?.class_name}</span> • WASSCE Weighted System (50% Exam + 50% CA)
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className={`px-4 py-1.5 rounded-xl text-sm font-extrabold border ${gradeInfo.color}`}>
                        Grade {report.grade || gradeInfo.grade} ({scoreVal}%)
                      </span>

                      <button
                        onClick={() => handleDownloadPDF(report.id)}
                        className="flex items-center gap-2 px-4 py-2 bg-[#0A192F] hover:bg-[#0F2440] text-white text-xs font-bold rounded-xl transition-all shadow-sm"
                      >
                        <Download className="w-4 h-4" />
                        Download PDF Transcript
                      </button>
                    </div>
                  </div>

                  {/* Summary Metric Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-slate-500 font-semibold block uppercase tracking-wider text-[10px]">
                        Continuous Assessment (50%)
                      </span>
                      <span className="text-base font-extrabold text-blue-900 mt-0.5 block">
                        {report.ca_score != null ? `${report.ca_score}%` : '—'}
                      </span>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-slate-500 font-semibold block uppercase tracking-wider text-[10px]">
                        Final Examination (50%)
                      </span>
                      <span className="text-base font-extrabold text-emerald-900 mt-0.5 block">
                        {report.exam_score != null ? `${report.exam_score}%` : '—'}
                      </span>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-slate-500 font-semibold block uppercase tracking-wider text-[10px]">
                        Attendance Rate
                      </span>
                      <span className="text-base font-extrabold text-indigo-900 mt-0.5 block">
                        {report.attendance_rate != null ? `${report.attendance_rate}%` : '95%'}
                      </span>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <span className="text-slate-500 font-semibold block uppercase tracking-wider text-[10px]">
                        Overall Status
                      </span>
                      <span className="text-base font-extrabold text-emerald-700 mt-0.5 block capitalize">
                        Approved & Distributed
                      </span>
                    </div>
                  </div>

                  {/* Multi-Subject Breakdown Table */}
                  {report.subjects && report.subjects.length > 0 && (
                    <div className="space-y-2 pt-2">
                      <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Multi-Subject WASSCE Breakdown
                      </h4>
                      <div className="overflow-x-auto border border-slate-200 rounded-xl">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                            <tr>
                              <th className="p-3">Subject</th>
                              <th className="p-3">Exam Type</th>
                              <th className="p-3">Raw Score</th>
                              <th className="p-3">WASSCE Grade</th>
                              <th className="p-3">Remarks</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200 bg-white">
                            {report.subjects.map((sub, sIdx) => {
                              const sGradeInfo = calculateWASSCEGrade(sub.score);
                              return (
                                <tr key={sIdx} className="hover:bg-slate-50">
                                  <td className="p-3 font-semibold text-slate-900">{sub.subject}</td>
                                  <td className="p-3 text-slate-500">{sub.exam_type || 'End of Semester'}</td>
                                  <td className="p-3 font-bold text-slate-800">{sub.score}%</td>
                                  <td className="p-3">
                                    <span className={`inline-block px-2.5 py-0.5 rounded-md font-bold text-xs border ${sGradeInfo.color}`}>
                                      {sub.grade || sGradeInfo.grade}
                                    </span>
                                  </td>
                                  <td className="p-3 text-slate-600 font-medium">
                                    {sub.score >= 50 ? 'Credit / Pass' : 'Needs Improvement'}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Remarks */}
                  {(report.teacher_comment || report.ai_comment) && (
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-1">
                      <span className="font-bold text-slate-700 block">Administration Remarks:</span>
                      <p className="text-slate-600 italic">
                        "{report.teacher_comment || report.ai_comment}"
                      </p>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {activeTab === 'assignments' && (
        submissions.length === 0 ? (
          <EmptyState message="No graded assignments yet." />
        ) : (
          <div className="space-y-4">
            {submissions.map((item) => {
              const score = item.teacher_score ?? item.ai_score;
              return (
                <div key={item.id} className="edu-card p-5">
                  <div className="flex justify-between gap-4">
                    <div>
                      <SubjectTag subject={item.assignment?.subject || 'Assignment'} />
                      <h3 className="font-semibold text-slate-900 text-sm mt-2">
                        {item.assignment?.title || 'Assignment'}
                      </h3>
                      {item.ai_feedback && (
                        <p className="text-xs text-slate-500 mt-1">Feedback: {item.ai_feedback}</p>
                      )}
                      <p className="text-xs text-slate-400 mt-2">
                        Submitted {formatDate(item.submitted_at)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-slate-900">{score}%</p>
                      <p className="text-xs text-slate-500">{gradeLetter(score)}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {activeTab === 'quizzes' && (
        attempts.length === 0 ? (
          <EmptyState message="No completed quizzes yet." />
        ) : (
          <div className="space-y-4">
            {attempts.map((item) => (
              <div key={item.id} className="edu-card p-5 flex justify-between">
                <div>
                  <h3 className="font-semibold text-slate-900 text-sm">Quiz attempt</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Completed {formatDate(item.submitted_at)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-slate-900">{item.percentage ?? 0}%</p>
                  <p className="text-xs text-slate-500">
                    {item.score}/{item.total_marks} marks
                  </p>
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}
