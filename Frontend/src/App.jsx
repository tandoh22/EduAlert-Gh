import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import TeacherLayout from './components/TeacherLayout';
import HeadmasterLayout from './components/HeadmasterLayout';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import RegisterPage from "./pages/RegisterPage";
import Dashboard from './pages/Dashboard';
import EnrollClass from './pages/EnrollClass';
import Assignments from './pages/Assignments';
import Quizzes from './pages/Quizzes';
import StudyCards from './pages/StudyCards';
import LessonNotes from './pages/LessonNotes';
import Resources from './pages/Resources';
import Announcements from './pages/Announcements';
import Performance from './pages/Performance';
import Results from './pages/Results';
import Attendance from './pages/Attendance';
import Predictions from './pages/Predictions';
import Students from './pages/Students';
import TeacherDashboard from './pages/teacher/TeacherDashboard';
import AssignmentUpload from './pages/teacher/AssignmentUpload';
import LessonNoteGenerator from './pages/teacher/LessonNoteGenerator';
import PostNotice from './pages/teacher/PostNotice';
import QuizResults from './pages/teacher/QuizResults';
import QuizGeneration from './pages/teacher/QuizGeneration';
import ResultsGenerator from './pages/teacher/ResultsGenerator';
import ResourcesUpload from './pages/teacher/ResourcesUpload';
import StudentLists from './pages/teacher/StudentLists';
import Submissions from './pages/teacher/Submissions';
import HeadmasterDashboard from './pages/headmaster/HeadmasterDashboard';
import PendingAccounts from './pages/headmaster/PendingAccounts';
import AtRiskStudents from './pages/headmaster/AtRiskStudents';
import StudentPerformance from './pages/headmaster/StudentPerformance';
import BulkReportCards from './pages/headmaster/BulkReportCards';
import ClassManagement from './pages/headmaster/ClassManagement';
import HeadmasterAnnouncements from './pages/headmaster/HeadmasterAnnouncements';
import TeacherManagement from './pages/headmaster/TeacherManagement';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />

        <Route path="/register" element={<RegisterPage />} />
        
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/enroll-class"
          element={
            <ProtectedRoute>
              <Layout>
                <EnrollClass />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/assignments"
          element={
            <ProtectedRoute>
              <Layout>
                <Assignments />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/quizzes"
          element={
            <ProtectedRoute>
              <Layout>
                <Quizzes />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/study-cards"
          element={
            <ProtectedRoute>
              <Layout>
                <StudyCards />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/lesson-notes"
          element={
            <ProtectedRoute>
              <Layout>
                <LessonNotes />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/resources"
          element={
            <ProtectedRoute>
              <Layout>
                <Resources />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/announcements"
          element={
            <ProtectedRoute>
              <Layout>
                <Announcements />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/performance"
          element={
            <ProtectedRoute>
              <Layout>
                <Performance />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/results"
          element={
            <ProtectedRoute>
              <Layout>
                <Results />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/attendance"
          element={
            <ProtectedRoute>
              <Layout>
                <Attendance />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/predictions"
          element={
            <ProtectedRoute>
              <Layout>
                <Predictions />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/students"
          element={
            <ProtectedRoute>
              <Layout>
                <Students />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Teacher Portal Routes */}
        <Route
          path="/teacher/dashboard"
          element={
            <ProtectedRoute>
              <TeacherLayout>
                <TeacherDashboard />
              </TeacherLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/assignment-upload"
          element={
            <ProtectedRoute>
              <TeacherLayout>
                <AssignmentUpload />
              </TeacherLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/lesson-note-generator"
          element={
            <ProtectedRoute>
              <TeacherLayout>
                <LessonNoteGenerator />
              </TeacherLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/post-notice"
          element={
            <ProtectedRoute>
              <TeacherLayout>
                <PostNotice />
              </TeacherLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/quiz-results"
          element={
            <ProtectedRoute>
              <TeacherLayout>
                <QuizResults />
              </TeacherLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/quiz-generation"
          element={
            <ProtectedRoute>
              <TeacherLayout>
                <QuizGeneration />
              </TeacherLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/results-generator"
          element={
            <ProtectedRoute>
              <TeacherLayout>
                <ResultsGenerator />
              </TeacherLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/report-card-generator"
          element={
            <ProtectedRoute>
              <TeacherLayout>
                <ResultsGenerator />
              </TeacherLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/resources-upload"
          element={
            <ProtectedRoute>
              <TeacherLayout>
                <ResourcesUpload />
              </TeacherLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/student-lists"
          element={
            <ProtectedRoute>
              <TeacherLayout>
                <StudentLists />
              </TeacherLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/predictions"
          element={
            <ProtectedRoute>
              <TeacherLayout>
                <Predictions />
              </TeacherLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/students"
          element={
            <ProtectedRoute>
              <TeacherLayout>
                <StudentLists />
              </TeacherLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/submissions"
          element={
            <ProtectedRoute>
              <TeacherLayout>
                <Submissions />
              </TeacherLayout>
            </ProtectedRoute>
          }
        />

        {/* Headmaster Portal Routes */}
        <Route
          path="/headmaster/dashboard"
          element={
            <ProtectedRoute>
              <HeadmasterLayout>
                <HeadmasterDashboard />
              </HeadmasterLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/headmaster/pending-accounts"
          element={
            <ProtectedRoute>
              <HeadmasterLayout>
                <PendingAccounts />
              </HeadmasterLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/headmaster/at-risk-students"
          element={
            <ProtectedRoute>
              <HeadmasterLayout>
                <AtRiskStudents />
              </HeadmasterLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/headmaster/students/:studentId/performance"
          element={
            <ProtectedRoute>
              <HeadmasterLayout>
                <StudentPerformance />
              </HeadmasterLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/headmaster/bulk-report-cards"
          element={
            <ProtectedRoute>
              <HeadmasterLayout>
                <BulkReportCards />
              </HeadmasterLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/headmaster/class-management"
          element={
            <ProtectedRoute>
              <HeadmasterLayout>
                <ClassManagement />
              </HeadmasterLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/headmaster/teachers"
          element={
            <ProtectedRoute>
              <HeadmasterLayout>
                <TeacherManagement />
              </HeadmasterLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/headmaster/announcements"
          element={
            <ProtectedRoute>
              <HeadmasterLayout>
                <HeadmasterAnnouncements />
              </HeadmasterLayout>
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}