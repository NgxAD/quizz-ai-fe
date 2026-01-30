'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import authApi from '@/api/auth.api';
import { ReactNode, useState } from 'react';
import { useStudentRoute } from '@/utils/hooks';

interface StudentLayoutProps {
  children: ReactNode;
}

export default function StudentLayout({ children }: StudentLayoutProps) {
  const { isChecked } = useStudentRoute();
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
    router.push('/student/profile');
    setDropdownOpen(false);
  };

  const handleRegisterTeacher = () => {
    router.push('/student/register-teacher');
    setDropdownOpen(false);
  };

  const handleSwitchToTeacher = async () => {
    try {
      const response = await authApi.updateRole('teacher');
      // Update user với role mới và token mới
      if (response.data.user && response.data.access_token) {
        // Cập nhật user object với role mới (đảm bảo role là lowercase)
        const updatedUser = {
          ...response.data.user,
          role: (response.data.user.role as any)?.toLowerCase() || 'teacher',
        };
        updateUser(updatedUser);
      }
      setDropdownOpen(false);
      // Delay nhỏ để đảm bảo state được cập nhật trước khi navigate
      setTimeout(() => {
        router.push('/teacher/dashboard');
      }, 100);
    } catch (error) {
      console.error('Lỗi khi chuyển role:', error);
    }
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
                  className="w-10 h-10 rounded-full border-2 border-blue-500 object-cover cursor-pointer hover:opacity-80 transition"
                />
              )}
              {!user?.avatar && (
                <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center font-semibold cursor-pointer hover:opacity-80 transition">
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
                  {!user?.isTeacherApproved ? (
                    <button
                      onClick={handleRegisterTeacher}
                      className="w-full text-left px-4 py-3 text-gray-800 hover:bg-gray-100 transition font-semibold"
                    >
                      Đăng ký làm Giáo viên
                    </button>
                  ) : (
                    <button
                      onClick={handleSwitchToTeacher}
                      className="w-full text-left px-4 py-3 text-gray-800 hover:bg-gray-100 transition font-semibold"
                    >
                      Qua màn Giáo viên
                    </button>
                  )}
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
              <p className="text-sm text-blue-600 leading-tight m-0">Học sinh</p>
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
