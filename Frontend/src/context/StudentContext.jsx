import React, { createContext, useContext, useEffect, useState } from 'react';
import { getStoredUser } from '../services/authService';
import { fetchMyProfile } from '../services/portalService';

const StudentContext = createContext(null);

export function StudentProvider({ children }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const user = getStoredUser();
    if (!user || user.role !== 'student') {
      setLoading(false);
      return;
    }

    const cached = localStorage.getItem('edualert_student_profile');
    if (cached) {
      try {
        setProfile(JSON.parse(cached));
      } catch {
        localStorage.removeItem('edualert_student_profile');
      }
    }

    fetchMyProfile()
      .then((res) => {
        setProfile(res.data);
        localStorage.setItem('edualert_student_profile', JSON.stringify(res.data));
      })
      .catch((err) => {
        setError(err.response?.data?.detail || 'Could not load student profile');
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <StudentContext.Provider value={{ 
      profile, 
      loading, 
      error, 
      classId: profile?.class_id || profile?.student?.class_id, 
      studentId: profile?.id || profile?.student?.id 
    }}>
      {children}
    </StudentContext.Provider>
  );
}

export function useStudent() {
  return useContext(StudentContext);
}
