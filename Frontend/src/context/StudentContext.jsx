import React, { createContext, useContext, useEffect, useState } from 'react';
import { getStoredUser } from '../services/authService';
import { fetchMyProfile } from '../services/portalService';

const StudentContext = createContext(null);

export function StudentProvider({ children }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      const res = await fetchMyProfile();
      setProfile(res.data);
      localStorage.setItem('edualert_student_profile', JSON.stringify(res.data));
      return res.data;
    } catch (err) {
      setError(err.response?.data?.detail || 'Could not load student profile');
    } finally {
      setLoading(false);
    }
  };

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

    fetchProfileData();
  }, []);

  const updateProfile = (newProfile) => {
    setProfile(newProfile);
    if (newProfile) {
      localStorage.setItem('edualert_student_profile', JSON.stringify(newProfile));
    } else {
      localStorage.removeItem('edualert_student_profile');
    }
  };

  return (
    <StudentContext.Provider value={{ 
      profile, 
      loading, 
      error, 
      classId: profile?.class_id || profile?.student?.class_id, 
      studentId: profile?.id || profile?.student?.id,
      refreshProfile: fetchProfileData,
      updateProfile,
    }}>
      {children}
    </StudentContext.Provider>
  );
}

export function useStudent() {
  return useContext(StudentContext);
}
