'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import authApi from '@/api/auth.api';
import { ReactNode, useState } from 'react';
import { useTeacherRoute } from '@/utils/hooks';

interface TeacherLayoutProps {
  children: ReactNode;
}

export default function TeacherLayout({ children }: TeacherLayoutProps) {
  const { isChecked } = useTeacherRoute();
  const router = useRouter();
  const { user, logout, updateUser } = useAuthStore();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  const handleLogout = () => {
    logout();
    // Small delay to ensure state is updated before navigation
    setTimeout(() => {
      router.push('/');
    }, 100);
  };

  const handleProfileClick = () => {
    router.push('/teacher/profile');
    setDropdownOpen(false);
  };

  const handleSwitchToStudent = async () => {
    try {
      const response = await authApi.updateRole('student');
      // Update user với role mới
      if (response.data.user && response.data.access_token) {
        const updatedUser = {
          ...response.data.user,
          role: (response.data.user.role as any)?.toLowerCase() || 'student',
        };
        updateUser(updatedUser);
      }
      setDropdownOpen(false);
      setTimeout(() => {
        router.push('/student/exams');
      }, 100);
    } catch (error) {
      console.error('Lỗi khi chuyển role:', error);
    }
  };

  const handleDowngradeTeacher = () => {
    router.push('/teacher/downgrade');
    setDropdownOpen(false);
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    if (darkMode) {
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
    }
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
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white shadow-sm px-6 py-4 flex items-center justify-between">
          <div></div>
          <div className="flex items-center gap-4 relative">
            <div
              className="relative"
              onMouseEnter={() => setDropdownOpen(true)}
              onMouseLeave={() => setDropdownOpen(false)}
            >
              {user?.avatar && (
                <img
                  src={user.avatar}
                  alt={user.fullName}
                  className="w-10 h-10 rounded-full border-2 border-gray-400 object-cover cursor-pointer hover:opacity-80 transition"
                />
              )}
              {!user?.avatar && (
                <div className="w-10 h-10 rounded-full bg-gray-400 text-white flex items-center justify-center font-semibold cursor-pointer hover:opacity-80 transition">
                  {user?.fullName?.charAt(0).toUpperCase()}
                </div>
              )}

              {/* Dropdown Menu */}
              {dropdownOpen && (
                <div className="absolute -right-12 top-full mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
                  <button
                    onClick={handleProfileClick}
                    className="w-full text-left px-4 py-3 text-gray-800 hover:bg-gray-100 transition font-semibold"
                  >
                    Tài khoản
                  </button>
                  <div className="border-t border-gray-200"></div>
                  <button
                    onClick={handleSwitchToStudent}
                    className="w-full text-left px-4 py-3 text-gray-800 hover:bg-gray-100 transition font-semibold"
                  >
                    Qua màn Học sinh
                  </button>
                  <div className="border-t border-gray-200"></div>
                  <button
                    onClick={handleDowngradeTeacher}
                    className="w-full text-left px-4 py-3 text-red-600 hover:bg-red-50 transition font-semibold"
                  >
                    Bỏ quyền Giáo viên
                  </button>
                  <div className="border-t border-gray-200"></div>
                  <button
                    onClick={toggleDarkMode}
                    className="w-full text-left px-4 py-3 text-gray-800 hover:bg-gray-100 transition font-semibold"
                  >
                    {darkMode ? 'Chế độ sáng' : 'Chế độ tối'}
                  </button>
                  <div className="border-t border-gray-200"></div>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-3 text-gray-800 hover:bg-gray-100 transition font-semibold"
                  >
                    Đăng xuất
                  </button>
                </div>
              )}
            </div>
            <div
              className="text-right cursor-pointer hover:opacity-80 transition"
              onMouseEnter={() => setDropdownOpen(true)}
              onMouseLeave={() => setDropdownOpen(false)}
            >
              <p className="font-semibold text-gray-800 leading-tight m-0">{user?.fullName}</p>
              <p className="text-sm text-gray-600 leading-tight m-0">Giáo viên</p>
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
