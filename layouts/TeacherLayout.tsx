'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { ReactNode } from 'react';
import { useTeacherRoute } from '@/utils/hooks';

interface TeacherLayoutProps {
  children: ReactNode;
}

export default function TeacherLayout({ children }: TeacherLayoutProps) {
  const { isChecked } = useTeacherRoute();
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
      <div className="w-64 bg-gray-900 text-white shadow-lg">
        <div className="p-6">
          <h1 className="text-2xl font-bold">Quizz Teacher</h1>
        </div>

        <nav className="mt-10">
          <Link
            href="/teacher/dashboard"
            className="block px-6 py-3 hover:bg-gray-800 transition"
          >
            Dashboard
          </Link>
          <Link
            href="/teacher/classes/list"
            className="block px-6 py-3 hover:bg-gray-800 transition"
          >
            Quản lý lớp
          </Link>
          <Link
            href="/teacher/exams/list"
            className="block px-6 py-3 hover:bg-gray-800 transition"
          >
            Quản lý đề thi
          </Link>
          <Link
            href="/teacher/ai/generate"
            className="block px-6 py-3 hover:bg-gray-800 transition"
          >
            Sinh đề AI
          </Link>
        </nav>

        <div className="absolute bottom-0 w-64 border-t border-gray-700 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold">{user?.fullName}</p>
              <p className="text-sm text-gray-400">{user?.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="text-red-500 hover:text-red-400"
            >
              ↓
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white shadow-sm p-6">
          <h2 className="text-xl font-bold text-gray-800">Welcome, {user?.fullName}</h2>
        </header>
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
