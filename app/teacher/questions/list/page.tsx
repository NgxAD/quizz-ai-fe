'use client';

import TeacherLayout from '@/layouts/TeacherLayout';
import Link from 'next/link';

export default function QuestionsListPage() {
  return (
    <TeacherLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Danh sách câu hỏi</h1>
          <Link href="/teacher/questions/create" className="bg-blue-600 text-white px-4 py-2 rounded">
            Tạo câu hỏi mới
          </Link>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600">Chưa có câu hỏi nào</p>
        </div>
      </div>
    </TeacherLayout>
  );
}
