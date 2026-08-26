import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import LoadingState, { EmptyState, ErrorState } from '../components/LoadingState';
import { fetchMyProfile, fetchClasses, selfEnrollClass } from '../services/portalService';

import { useStudent } from '../context/StudentContext';

const BROAD_COURSE_TO_CLASS_COURSES = {
  'General Science': ['Science 1', 'Science 2', 'Science 3'],
  'General Arts': ['Arts 1', 'Arts 2', 'Arts 3'],
  'Visual Arts': ['Visual Arts 1', 'Visual Arts 2'],
  'General Business': ['Business 1', 'Business 2'],
  'Home Economics': ['Home Economics'],
};

export default function EnrollClass() {
  const { refreshProfile } = useStudent() || {};
  const [profile, setProfile] = useState(null);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedClassId, setSelectedClassId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([fetchMyProfile(), fetchClasses()])
      .then(([profileRes, classesRes]) => {
        setProfile(profileRes.data);
        setClasses(classesRes.data);
        if (profileRes.data.class_id) {
          setSelectedClassId(
            classesRes.data.find((c) => c.name === profileRes.data.class_name)?.id ?? null
          );
        }
      })
      .catch((err) => setError(err.response?.data?.detail || 'Failed to load enrollment options.'))
      .finally(() => setLoading(false));
  }, []);

  const handleEnroll = async () => {
    if (!selectedClassId) return;
    setSubmitting(true);
    setError(null);
    try {
      await selfEnrollClass(selectedClassId);
      if (refreshProfile) {
        await refreshProfile();
      } else {
        localStorage.removeItem('edualert_student_profile');
      }
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not complete enrollment.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingState />;

  const admittedCourse = profile?.admitted_course;
  const alreadyEnrolled = !!profile?.class_id;

  if (!admittedCourse) {
    return (
      <div>
        <PageHeader title="Choose your class" subtitle="Pick the class that matches your elective preference." />
        <div className="edu-card">
          <EmptyState message="No admitted course on file for your account. Contact your school administrator." />
        </div>
      </div>
    );
  }

  const allowedClassCourses = BROAD_COURSE_TO_CLASS_COURSES[admittedCourse] || [];
  const eligibleClasses = classes.filter((c) => allowedClassCourses.includes(c.course));

  return (
    <div>
      <PageHeader
        title="Choose your class"
        subtitle={`Admitted into ${admittedCourse} — pick the class that matches your elective preference.`}
      />

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
          {error}
        </div>
      )}

      {alreadyEnrolled && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
          You're currently enrolled in <span className="font-semibold">{profile.class_name}</span>. Picking a different class below will replace it.
        </div>
      )}

      {eligibleClasses.length === 0 ? (
        <div className="edu-card">
          <EmptyState message={`No classes have been set up yet for ${admittedCourse}. Check back soon.`} />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          {eligibleClasses.map((c) => {
            const isSelected = selectedClassId === c.id;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setSelectedClassId(c.id)}
                className={`text-left edu-card p-5 transition ${
                  isSelected ? 'ring-2 ring-emerald-500' : 'hover:shadow-lg'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h3 className="font-semibold text-slate-900">{c.name}</h3>
                  <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-md">
                    Class ID: {c.code || c.name}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mb-3">{c.course}</p>
                <p className="text-xs text-slate-600">{c.subjects.join(', ')}</p>
              </button>
            );
          })}
        </div>
      )}

      <button
        onClick={handleEnroll}
        disabled={!selectedClassId || submitting}
        className="px-5 py-2.5 rounded-lg bg-[#0A192F] text-white text-sm font-semibold hover:bg-[#0F2647] transition disabled:opacity-50"
      >
        {submitting ? 'Enrolling...' : 'Confirm my class'}
      </button>
    </div>
  );
}
