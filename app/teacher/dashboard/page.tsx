'use client';

import TeacherLayout from '@/layouts/TeacherLayout';

export default function DashboardPage() {
  return (
    <TeacherLayout>
      <div className="space-y-8">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-gray-600">Tổng câu hỏi</p>
            <p className="text-2xl font-bold text-blue-600">0</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-gray-600">Tổng bài kiểm tra</p>
            <p className="text-2xl font-bold text-green-600">0</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <p className="text-gray-600">Tổng học sinh</p>
            <p className="text-2xl font-bold text-purple-600">0</p>
          </div>
        </div>
      </div>
    </TeacherLayout>
  );
}
