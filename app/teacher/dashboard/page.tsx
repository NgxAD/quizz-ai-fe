'use client';

import { useState, useEffect } from 'react';
import TeacherLayout from '@/layouts/TeacherLayout';
import examApi from '@/api/exam.api';
import classApi from '@/api/class.api';
import { useAuthStore } from '@/store/auth.store';

export default function DashboardPage() {
  const { isLoggedIn, user } = useAuthStore();
  const [totalExams, setTotalExams] = useState(0);
  const [totalClasses, setTotalClasses] = useState(0);
  const [totalStudents, setTotalStudents] = useState(0);
  const [loading, setLoading] = useState(true);

  // Refetch when user logs in or role changes
  useEffect(() => {
    if (isLoggedIn) {
      loadDashboardData();
    }
  }, [isLoggedIn, user?._id]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Get total exams
      const examsResponse = await examApi.list();
      setTotalExams(examsResponse.data.length);

      // Get total classes and students
      const classesResponse = await classApi.list();
      setTotalClasses(classesResponse.data.length);

      // Get unique students from all classes
      const uniqueStudentIds = new Set<string>();
      
      for (const cls of classesResponse.data) {
        try {
          const membersResponse = await classApi.getMembers(cls._id);
          if (Array.isArray(membersResponse.data)) {
            membersResponse.data.forEach((member: any) => {
              uniqueStudentIds.add(member._id);
            });
          }
        } catch (err) {
          console.error(`Error loading members for class ${cls._id}:`, err);
        }
      }
      
      setTotalStudents(uniqueStudentIds.size);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <TeacherLayout>
      <div className="space-y-8">
        <h1 className="text-3xl font-bold text-gray-900">Tổng quan</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-gray-600">Tổng đề thi</p>
            <p className="text-2xl font-bold text-blue-600">
              {loading ? '...' : totalExams}
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-gray-600">Tổng lớp</p>
            <p className="text-2xl font-bold text-green-600">
              {loading ? '...' : totalClasses}
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-gray-600">Tổng học sinh</p>
            <p className="text-2xl font-bold text-purple-600">
              {loading ? '...' : totalStudents}
            </p>
          </div>
        </div>
      </div>
    </TeacherLayout>
  );
}
