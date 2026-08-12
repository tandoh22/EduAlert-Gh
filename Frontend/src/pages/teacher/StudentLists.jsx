import React, { useState } from 'react';
import PageHeader from '../../components/PageHeader';
import { Search, Filter, User, Mail, Phone, Calendar, MoreVertical, Plus } from 'lucide-react';

export default function StudentLists() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedGender, setSelectedGender] = useState('');

  const students = [
    { id: 1, name: 'Kwame Mensah', studentId: 'STU001', class: 'JHS-3A', gender: 'Male', email: 'kwame.m@school.gh', phone: '0241234567', dob: '2008-05-15' },
    { id: 2, name: 'Ama Owusu', studentId: 'STU002', class: 'JHS-3A', gender: 'Female', email: 'ama.o@school.gh', phone: '0242345678', dob: '2008-08-22' },
    { id: 3, name: 'Kofi Asante', studentId: 'STU003', class: 'JHS-3B', gender: 'Male', email: 'kofi.a@school.gh', phone: '0243456789', dob: '2008-03-10' },
    { id: 4, name: 'Efua Dufie', studentId: 'STU004', class: 'JHS-3B', gender: 'Female', email: 'efua.d@school.gh', phone: '0244567890', dob: '2008-11-30' },
    { id: 5, name: 'Nana Yaw', studentId: 'STU005', class: 'JHS-3A', gender: 'Male', email: 'nana.y@school.gh', phone: '0245678901', dob: '2008-07-18' },
    { id: 6, name: 'Abena Serwaa', studentId: 'STU006', class: 'JHS-3B', gender: 'Female', email: 'abena.s@school.gh', phone: '0246789012', dob: '2008-09-25' },
    { id: 7, name: 'Kwesi Boateng', studentId: 'STU007', class: 'JHS-2A', gender: 'Male', email: 'kwesi.b@school.gh', phone: '0247890123', dob: '2009-01-12' },
    { id: 8, name: 'Akosua Frimpong', studentId: 'STU008', class: 'JHS-2A', gender: 'Female', email: 'akosua.f@school.gh', phone: '0248901234', dob: '2009-04-08' },
  ];

  const filteredStudents = students.filter(
    (student) =>
      (student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.studentId.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (selectedClass === '' || student.class === selectedClass) &&
      (selectedGender === '' || student.gender === selectedGender)
  );

  return (
    <div>
      <PageHeader title="Student Lists" subtitle="View and manage your students" />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="edu-card p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
            <span className="text-sm text-slate-500">Total Students</span>
          </div>
          <div className="text-2xl font-bold text-slate-900">{students.length}</div>
        </div>

        <div className="edu-card p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-emerald-500 flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
            <span className="text-sm text-slate-500">Male</span>
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {students.filter(s => s.gender === 'Male').length}
          </div>
        </div>

        <div className="edu-card p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-purple-500 flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
            <span className="text-sm text-slate-500">Female</span>
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {students.filter(s => s.gender === 'Female').length}
          </div>
        </div>

        <div className="edu-card p-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-orange-500 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <span className="text-sm text-slate-500">Classes</span>
          </div>
          <div className="text-2xl font-bold text-slate-900">4</div>
        </div>
      </div>

      {/* Filters */}
      <div className="edu-card p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div className="flex flex-wrap gap-4 flex-1">
            <div className="relative min-w-[250px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name or ID..."
                className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="px-4 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            >
              <option value="">All Classes</option>
              <option value="JHS-2A">JHS 2A</option>
              <option value="JHS-3A">JHS 3A</option>
              <option value="JHS-3B">JHS 3B</option>
            </select>

            <select
              value={selectedGender}
              onChange={(e) => setSelectedGender(e.target.value)}
              className="px-4 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            >
              <option value="">All Genders</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>

            <button className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors">
              <Filter className="w-4 h-4" />
              More Filters
            </button>
          </div>

          <button className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white text-sm font-medium rounded-lg hover:bg-emerald-600 transition-colors">
            <Plus className="w-4 h-4" />
            Add Student
          </button>
        </div>
      </div>

      {/* Students Table */}
      <div className="edu-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Student</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Student ID</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Class</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Gender</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Email</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Phone</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Date of Birth</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStudents.map((student) => (
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
                    <span className="text-sm text-slate-600 font-mono">{student.studentId}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-slate-600">{student.class}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-slate-600">{student.gender}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1 text-sm text-slate-600">
                      <Mail className="w-4 h-4" />
                      {student.email}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1 text-sm text-slate-600">
                      <Phone className="w-4 h-4" />
                      {student.phone}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-slate-600">{student.dob}</span>
                  </td>
                  <td className="px-6 py-4">
                    <button className="p-2 hover:bg-slate-200 rounded-lg transition-colors">
                      <MoreVertical className="w-4 h-4 text-slate-400" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredStudents.length === 0 && (
          <div className="text-center py-12">
            <p className="text-sm text-slate-500">No students found matching your criteria</p>
          </div>
        )}
      </div>
    </div>
  );
}
