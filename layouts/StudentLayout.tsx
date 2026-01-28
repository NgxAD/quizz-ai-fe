'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { ReactNode } from 'react';
import { useStudentRoute } from '@/utils/hooks';

interface StudentLayoutProps {
  children: ReactNode;
}

export default function StudentLayout({ children }: StudentLayoutProps) {
  const { isChecked } = useStudentRoute();
  const router = useRouter();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    // Small delay to ensure state is updated before navigation
    setTimeout(() => {
      router.push('/');
    }, 100);
  };

  // Don't render until route is checked
  if (!isChecked) {
    return null;
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-blue-900 text-white shadow-lg">
        <div className="p-6">
          <h1 className="text-2xl font-bold">Quizz Student</h1>
        </div>

        <nav className="mt-10">
          <Link
            href="/student/exams"
            className="block px-6 py-3 hover:bg-blue-800 transition"
          >
            Danh sách đề thi
          </Link>
          <Link
            href="/student/results"
            className="block px-6 py-3 hover:bg-blue-800 transition"
          >
            Kết quả
          </Link>
        </nav>

        <div className="absolute bottom-0 w-64 border-t border-blue-800 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold">{user?.fullName}</p>
              <p className="text-sm text-blue-300">{user?.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="text-red-400 hover:text-red-300"
            >
              ↓
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-800">Học sinh: {user?.fullName}</h2>
        </header>
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
