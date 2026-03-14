'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import TeacherLayout from '@/layouts/TeacherLayout';

export default function AIChatPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the new integrated AI chat location
    router.push('/teacher/exams/create?tab=ai');
  }, [router]);

  return (
    <TeacherLayout>
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-600 mb-4">🔄 Đang chuyển hướng đến trang Tạo đề với AI...</p>
        </div>
      </div>
    </TeacherLayout>
  );
}
