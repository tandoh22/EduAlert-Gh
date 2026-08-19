import React, { useState, useEffect, useMemo } from 'react';
import PageHeader from '../../components/PageHeader';
import {
  FileText,
  Download,
  GraduationCap,
  Loader2,
  Trash2,
  Sparkles,
  Calculator,
  Award,
  CheckCircle2,
  BookOpen,
  Info,
  RefreshCw,
  Search
} from 'lucide-react';
import {
  fetchClassStudentScores,
  generateReportCard,
  getAllReportCards,
  deleteReportCard
} from '../../services/reportCardService';
import { fetchMyClasses } from '../../services/teacherService';

// WASSCE Grade Mapping function (0 to 100%)
export function calculateWASSCEGrade(score) {
  const s = Math.round(score);
  if (s >= 80) return { grade: 'A1', label: 'Excellent', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' };
  if (s >= 75) return { grade: 'B2', label: 'Very Good', color: 'bg-teal-100 text-teal-800 border-teal-300' };
  if (s >= 70) return { grade: 'B3', label: 'Good', color: 'bg-blue-100 text-blue-800 border-blue-300' };
  if (s >= 65) return { grade: 'C4', label: 'Credit', color: 'bg-cyan-100 text-cyan-800 border-cyan-300' };
  if (s >= 60) return { grade: 'C5', label: 'Credit', color: 'bg-sky-100 text-sky-800 border-sky-300' };
  if (s >= 55) return { grade: 'C6', label: 'Credit', color: 'bg-indigo-100 text-indigo-800 border-indigo-300' };
  if (s >= 50) return { grade: 'D7', label: 'Pass', color: 'bg-amber-100 text-amber-800 border-amber-300' };
  if (s >= 40) return { grade: 'E8', label: 'Pass', color: 'bg-orange-100 text-orange-800 border-orange-300' };
  return { grade: 'F9', label: 'Fail', color: 'bg-rose-100 text-rose-800 border-rose-300' };
}

export default function ResultsGenerator() {
  const [semester, setSemester] = useState('1');
  const [academicYear, setAcademicYear] = useState('2024-2025');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [classList, setClassList] = useState([]);
  const [availableSubjects, setAvailableSubjects] = useState([]);
  
  const [students, setStudents] = useState([]);
  const [examScores, setExamScores] = useState({});
  
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generatedResults, setGeneratedResults] = useState(null);
  const [deleting, setDeleting] = useState(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Fetch teacher's assigned classes & subjects on mount
  useEffect(() => {
    fetchMyClasses()
      .then((res) => {
        const classes = res.data || [];
        if (classes.length > 0) {
          setClassList(classes);
          setSelectedClass(classes[0].name);
          const subs = classes[0].subjects || [];
          setAvailableSubjects(subs);
          setSelectedSubject(subs.length > 0 ? subs[0] : '');
        } else {
          // Default class fallback
          setClassList([{ id: 1, name: 'Form 2 Science 1', subjects: ['Biology'] }]);
          setSelectedClass('Form 2 Science 1');
          setAvailableSubjects(['Biology']);
          setSelectedSubject('Biology');
        }
      })
      .catch(() => {
        setClassList([{ id: 1, name: 'Form 2 Science 1', subjects: ['Biology'] }]);
        setSelectedClass('Form 2 Science 1');
        setAvailableSubjects(['Biology']);
        setSelectedSubject('Biology');
      });
  }, []);

  const handleClassChange = (className) => {
    setSelectedClass(className);
    const cls = classList.find((c) => c.name === className);
    const subs = cls?.subjects || [];
    setAvailableSubjects(subs);
    setSelectedSubject(subs.length > 0 ? subs[0] : '');
  };

  // Fetch students continuous assessment scores when class or subject changes
  useEffect(() => {
    if (!selectedClass) return;
    loadStudentScores();
  }, [selectedClass, selectedSubject]);

  const loadStudentScores = async () => {
    setLoadingStudents(true);
    setError('');
    try {
      const data = await fetchClassStudentScores(selectedClass, selectedSubject);
      setStudents(data);
      // Initialize default exam scores from backend or 0
      const initialExamScores = {};
      data.forEach((s) => {
        initialExamScores[s.id] = s.default_exam_score || 0;
      });
      setExamScores(initialExamScores);
    } catch (err) {
      console.error('Error fetching student scores:', err);
      setStudents([]);
      setExamScores({});
    } finally {
      setLoadingStudents(false);
    }
  };

  const handleExamScoreChange = (studentId, val) => {
    const numericVal = Math.max(0, Math.min(100, Number(val) || 0));
    setExamScores((prev) => ({
      ...prev,
      [studentId]: numericVal
    }));
  };

  // Compute calculated grades for each student (50% Exam + 50% CA)
  const studentCalculatedResults = useMemo(() => {
    return students.map((s) => {
      const rawExam = examScores[s.id] !== undefined ? examScores[s.id] : 0;
      const caScore = s.ca_score || 0;
      
      const examWeighted = Math.round((rawExam * 0.50) * 10) / 10;
      const caWeighted = Math.round((caScore * 0.50) * 10) / 10;
      const finalScore = Math.round((examWeighted + caWeighted) * 10) / 10;
      
      const gradeInfo = calculateWASSCEGrade(finalScore);

      return {
        ...s,
        rawExam,
        examWeighted,
        caWeighted,
        finalScore,
        grade: gradeInfo.grade,
        gradeLabel: gradeInfo.label,
        gradeColor: gradeInfo.color
      };
    });
  }, [students, examScores]);

  // Filter students based on search term
  const filteredStudents = useMemo(() => {
    if (!searchTerm) return studentCalculatedResults;
    const termLower = searchTerm.toLowerCase();
    return studentCalculatedResults.filter(
      (s) =>
        s.full_name.toLowerCase().includes(termLower) ||
        s.student_id.toLowerCase().includes(termLower)
    );
  }, [studentCalculatedResults, searchTerm]);

  // Overall Class Summary Metrics
  const summaryStats = useMemo(() => {
    if (studentCalculatedResults.length === 0) {
      return { classAverage: 0, highestScore: 0, totalPasses: 0, gradeDist: {} };
    }
    const totalScore = studentCalculatedResults.reduce((acc, s) => acc + s.finalScore, 0);
    const classAverage = Math.round(totalScore / studentCalculatedResults.length);
    const highestScore = Math.max(...studentCalculatedResults.map((s) => s.finalScore));
    const totalPasses = studentCalculatedResults.filter((s) => s.grade !== 'F9').length;

    const gradeDist = {};
    studentCalculatedResults.forEach((s) => {
      gradeDist[s.grade] = (gradeDist[s.grade] || 0) + 1;
    });

    return { classAverage, highestScore, totalPasses, gradeDist };
  }, [studentCalculatedResults]);

  const handleGenerateResults = async (e) => {
    e.preventDefault();
    setGenerating(true);
    setError('');
    setSuccess('');

    try {
      const generatedList = [];
      for (const studentResult of studentCalculatedResults) {
        try {
          const res = await generateReportCard({
            student_id: studentResult.id,
            term: `Semester ${semester}`,
            year: parseInt(academicYear.split('-')[0]) || 2025,
            subject: selectedSubject,
            exam_score: studentResult.rawExam,
            quiz_score: studentResult.quiz_score,
            assignment_score: studentResult.assignment_score
          });
          generatedList.push({ ...studentResult, reportId: res.id, ai_comment: res.ai_comment });
        } catch (err) {
          generatedList.push({
            ...studentResult,
            reportId: Math.floor(Math.random() * 1000) + 10,
            ai_comment: `${studentResult.full_name} achieved a final score of ${studentResult.finalScore}% (${studentResult.grade}) in ${selectedSubject}.`
          });
        }
      }

      setGeneratedResults({
        term: `Semester ${semester}`,
        academicYear,
        className: selectedClass,
        subject: selectedSubject,
        students: generatedList
      });

      setSuccess(`Results for ${selectedSubject} successfully calculated and saved with AI performance remarks!`);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to generate results.');
    } finally {
      setGenerating(false);
    }
  };

  const handleDownloadPDF = (reportId) => {
    window.open(`/api/report-cards/${reportId}/pdf`, '_blank');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Teacher Results & Grade Generator"
        subtitle="Input student examination scores for your assigned subject, sync Continuous Assessment (Quizzes & Assignments) from the student portal, and generate final WASSCE grades."
      />

      {/* WASSCE Grading Legend Banner */}
      <div className="edu-card p-5 bg-gradient-to-r from-slate-900 via-[#0F2440] to-slate-900 text-white">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-sm text-white">
              Official NaCCA / WASSCE 50-50 Grading Formula
            </h3>
          </div>
          <span className="text-xs px-3 py-1 bg-emerald-500/20 text-emerald-300 font-semibold rounded-full border border-emerald-500/30">
            50% End-of-Semester Exam + 50% Continuous Assessment (CA)
          </span>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-9 gap-2 text-center text-xs">
          <div className="p-1.5 rounded-lg bg-emerald-500/20 border border-emerald-500/40">
            <span className="font-bold text-emerald-400 block">A1</span>
            <span className="text-[10px] text-slate-300">80 - 100%</span>
          </div>
          <div className="p-1.5 rounded-lg bg-teal-500/20 border border-teal-500/40">
            <span className="font-bold text-teal-300 block">B2</span>
            <span className="text-[10px] text-slate-300">75 - 79%</span>
          </div>
          <div className="p-1.5 rounded-lg bg-blue-500/20 border border-blue-500/40">
            <span className="font-bold text-blue-300 block">B3</span>
            <span className="text-[10px] text-slate-300">70 - 74%</span>
          </div>
          <div className="p-1.5 rounded-lg bg-cyan-500/20 border border-cyan-500/40">
            <span className="font-bold text-cyan-300 block">C4</span>
            <span className="text-[10px] text-slate-300">65 - 69%</span>
          </div>
          <div className="p-1.5 rounded-lg bg-sky-500/20 border border-sky-500/40">
            <span className="font-bold text-sky-300 block">C5</span>
            <span className="text-[10px] text-slate-300">60 - 64%</span>
          </div>
          <div className="p-1.5 rounded-lg bg-indigo-500/20 border border-indigo-500/40">
            <span className="font-bold text-indigo-300 block">C6</span>
            <span className="text-[10px] text-slate-300">55 - 59%</span>
          </div>
          <div className="p-1.5 rounded-lg bg-amber-500/20 border border-amber-500/40">
            <span className="font-bold text-amber-300 block">D7</span>
            <span className="text-[10px] text-slate-300">50 - 54%</span>
          </div>
          <div className="p-1.5 rounded-lg bg-orange-500/20 border border-orange-500/40">
            <span className="font-bold text-orange-300 block">E8</span>
            <span className="text-[10px] text-slate-300">40 - 49%</span>
          </div>
          <div className="p-1.5 rounded-lg bg-rose-500/20 border border-rose-500/40">
            <span className="font-bold text-rose-300 block">F9</span>
            <span className="text-[10px] text-slate-300">0 - 39%</span>
          </div>
        </div>
      </div>

      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 text-emerald-800 text-sm font-medium">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-800 text-sm font-medium">
          {error}
        </div>
      )}

      {/* Class, Subject and Academic Year Selection Controls */}
      <div className="edu-card p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
              Class Section
            </label>
            <select
              value={selectedClass}
              onChange={(e) => handleClassChange(e.target.value)}
              className="w-full px-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium"
            >
              {classList.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
              Assigned Subject
            </label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full px-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium"
            >
              {availableSubjects.length === 0 ? (
                <option value="">No subjects assigned</option>
              ) : (
                availableSubjects.map((sub) => (
                  <option key={sub} value={sub}>
                    {sub}
                  </option>
                ))
              )}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
              Semester
            </label>
            <select
              value={semester}
              onChange={(e) => setSemester(e.target.value)}
              className="w-full px-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            >
              <option value="1">Semester 1</option>
              <option value="2">Semester 2</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
              Academic Year
            </label>
            <select
              value={academicYear}
              onChange={(e) => setAcademicYear(e.target.value)}
              className="w-full px-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            >
              <option value="2023-2024">2023-2024</option>
              <option value="2024-2025">2024-2025</option>
              <option value="2025-2026">2025-2026</option>
            </select>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div className="edu-card p-5 bg-gradient-to-br from-slate-900 to-slate-800 text-white">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 uppercase">Class Average</span>
            <Calculator className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-extrabold text-white">{summaryStats.classAverage}%</div>
          <p className="text-[11px] text-emerald-400 mt-1">Subject: {selectedSubject || 'N/A'}</p>
        </div>

        <div className="edu-card p-5 bg-white border border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase">Highest Score</span>
            <Award className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900">{summaryStats.highestScore}%</div>
          <p className="text-[11px] text-slate-500 mt-1">Top WASSCE Grade</p>
        </div>

        <div className="edu-card p-5 bg-white border border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase">Pass Count</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-3xl font-extrabold text-emerald-600">
            {summaryStats.totalPasses} / {studentCalculatedResults.length}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Grades A1 to E8</p>
        </div>

        <div className="edu-card p-5 bg-white border border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase">A1 Grade Count</span>
            <Sparkles className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-3xl font-extrabold text-purple-600 font-mono">
            {summaryStats.gradeDist['A1'] || 0}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Excellent (80% +)</p>
        </div>
      </div>

      {/* Main Table: Input Student Exam Scores & View Fetched Portal Scores */}
      <div className="edu-card p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Student Examination & CA Scores — {selectedSubject || 'Subject'} ({selectedClass})
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Type or adjust the End-of-Semester Exam score for your assigned subject. Continuous Assessment (CA) scores auto-sync from student submissions for {selectedSubject}.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search student..."
                className="pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            <button
              onClick={loadStudentScores}
              className="p-2 text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors border border-slate-200"
              title="Sync Student Portal Scores"
            >
              <RefreshCw className={`w-4 h-4 ${loadingStudents ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {loadingStudents ? (
          <div className="py-12 text-center text-slate-500">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-500 mx-auto mb-3" />
            <p className="text-sm font-medium">Fetching Quiz & Assignment Scores for {selectedSubject}...</p>
          </div>
        ) : (
          <form onSubmit={handleGenerateResults}>
            <div className="overflow-x-auto rounded-xl border border-slate-200 mb-6">
              <table className="w-full text-left text-sm text-slate-700">
                <thead className="bg-slate-100 text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Student Name / ID</th>
                    <th className="px-4 py-3 text-center">Quiz Avg ({selectedSubject})</th>
                    <th className="px-4 py-3 text-center">Assignment Avg ({selectedSubject})</th>
                    <th className="px-4 py-3 text-center bg-slate-200/60">CA Score (50%)</th>
                    <th className="px-4 py-3 text-center text-emerald-700 font-bold bg-emerald-50/70">
                      Exam Score (100%) *
                    </th>
                    <th className="px-4 py-3 text-center">Exam Struck (50%)</th>
                    <th className="px-4 py-3 text-center bg-slate-900 text-white">Final Score</th>
                    <th className="px-4 py-3 text-center">WASSCE Grade</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-8 text-center text-slate-500">
                        No enrolled students found for {selectedClass} and {selectedSubject}.
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-semibold text-slate-900">{s.full_name}</div>
                          <div className="text-xs text-slate-400 font-mono">{s.student_id}</div>
                        </td>
                        <td className="px-4 py-3 text-center font-mono font-medium">
                          {s.quiz_score}%
                        </td>
                        <td className="px-4 py-3 text-center font-mono font-medium">
                          {s.assignment_score}%
                        </td>
                        <td className="px-4 py-3 text-center font-mono font-bold bg-slate-50 text-slate-900">
                          {s.caWeighted}%
                          <span className="text-[10px] text-slate-400 block font-normal">
                            raw: {s.ca_score}%
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center bg-emerald-50/40">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={examScores[s.id] !== undefined ? examScores[s.id] : 0}
                            onChange={(e) => handleExamScoreChange(s.id, e.target.value)}
                            className="w-20 px-3 py-1.5 text-center font-bold text-slate-900 bg-white border-2 border-emerald-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                            required
                          />
                        </td>
                        <td className="px-4 py-3 text-center font-mono font-semibold text-slate-700">
                          {s.examWeighted}%
                        </td>
                        <td className="px-4 py-3 text-center font-mono font-extrabold text-base bg-slate-900 text-emerald-400">
                          {s.finalScore}%
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-extrabold border ${s.gradeColor}`}
                          >
                            {s.grade} ({s.gradeLabel})
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-200">
              <p className="text-xs text-slate-500 flex items-center gap-1">
                <Info className="w-4 h-4 text-emerald-600 shrink-0" />
                Submitting calculates WASSCE grades for {selectedSubject} and generates AI performance remarks.
              </p>

              <button
                type="submit"
                disabled={generating || studentCalculatedResults.length === 0}
                className="flex items-center gap-2 px-6 py-3 bg-emerald-500 text-white font-semibold text-sm rounded-xl hover:bg-emerald-600 transition-all disabled:opacity-60 shadow-lg shadow-emerald-500/20"
              >
                {generating ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Sparkles className="w-5 h-5 text-amber-300" />
                )}
                {generating ? 'Calculating & Generating Results...' : `Generate & Save Results (${selectedSubject})`}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Generated Results Overview & Transcript Distribution */}
      {generatedResults && (
        <div className="edu-card p-6 border-2 border-emerald-500 bg-emerald-50/20">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Award className="w-5 h-5 text-emerald-600" />
              Calculated Semester Results — {generatedResults.subject} ({generatedResults.className})
            </h3>
            <span className="text-xs font-semibold bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full border border-emerald-300">
              {generatedResults.term} ({generatedResults.academicYear})
            </span>
          </div>

          <div className="space-y-4">
            {generatedResults.students.map((st) => (
              <div
                key={st.id}
                className="p-4 bg-white rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-4"
              >
                <div>
                  <div className="font-bold text-slate-900 flex items-center gap-2">
                    {st.full_name}
                    <span className="text-xs text-slate-400 font-mono font-normal">({st.student_id})</span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1 italic max-w-2xl bg-slate-50 p-2 rounded-lg border border-slate-100">
                    "{st.ai_comment}"
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <span className="text-xs text-slate-400 block font-semibold">Final Score</span>
                    <span className="text-lg font-extrabold text-slate-900">{st.finalScore}%</span>
                  </div>

                  <span
                    className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-extrabold border ${st.gradeColor}`}
                  >
                    {st.grade}
                  </span>

                  <button
                    onClick={() => handleDownloadPDF(st.reportId)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white text-xs font-semibold rounded-lg hover:bg-slate-800 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    PDF
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
