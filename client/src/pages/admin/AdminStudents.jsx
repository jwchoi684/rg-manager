import React from 'react';
import StudentList from '../../components/Students/StudentList';

function AdminStudents() {
  return <StudentList basePath="/admin/students" />;
}

export default AdminStudents;
