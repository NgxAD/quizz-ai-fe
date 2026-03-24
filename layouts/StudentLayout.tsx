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
  const { user, logout, updateUser, setToken } = useAuthStore();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [closeTimeout, setCloseTimeout] = useState<NodeJS.Timeout | null>(null);


  const handleLogout = () => {
    logout();
    // Small delay to ensure state is updated before navigation
    setTimeout(() => {
      router.push('/');
    }, 100);
  };

  const handleMouseEnter = () => {
    if (closeTimeout) {
      clearTimeout(closeTimeout);
      setCloseTimeout(null);
    }
    setDropdownOpen(true);
  };

  const handleMouseLeave = () => {
    const timeout = setTimeout(() => {
      setDropdownOpen(false);
    }, 150);
    setCloseTimeout(timeout);
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
      // Update user với roles mới
      if (response.data.user && response.data.access_token) {
        const updatedUser = {
          ...response.data.user,
        };
        updateUser(updatedUser);
        setToken(response.data.access_token);
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

  const handleSwitchToAdmin = async () => {
    try {
      const response = await authApi.updateRole('admin');
      // Update user với roles mới
      if (response.data.user && response.data.access_token) {
        const updatedUser = {
          ...response.data.user,
        };
        updateUser(updatedUser);
        setToken(response.data.access_token);
      }
      setDropdownOpen(false);
      // Delay nhỏ để đảm bảo state được cập nhật trước khi navigate
      setTimeout(() => {
        router.push('/admin/dashboard');
      }, 100);
    } catch (error) {
      console.error('Lỗi khi chuyển role:', error);
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
        <button
          onClick={() => router.push('/')}
          className="w-full p-6 flex items-center gap-2 hover:opacity-80 transition"
        >
          <div className="text-3xl font-bold text-blue-300">📚</div>
          <h1 className="text-2xl font-bold">ADTest</h1>
        </button>

        <nav className="mt-10">
          <Link
            href="/student/exams"
            className="block px-6 py-3 hover:bg-blue-800 transition"
          >
            Danh sách lớp
          </Link>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white shadow-sm px-6 py-4 flex items-center justify-between">
          <div></div>
          <div
            className="flex items-center gap-4 relative"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
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
                  Hồ sơ
                </button>
                <div className="border-t border-gray-200"></div>
                {!user?.roles?.includes('admin') && (
                  <>
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
                  </>
                )}
                {user?.roles?.includes('admin') && (
                  <>
                    {user?.roles?.includes('teacher') && (
                      <>
                        <button
                          onClick={handleSwitchToTeacher}
                          className="w-full text-left px-4 py-3 text-gray-800 hover:bg-gray-100 transition font-semibold"
                        >
                          Qua màn Giáo viên
                        </button>
                        <div className="border-t border-gray-200"></div>
                      </>
                    )}
                    <button
                      onClick={handleSwitchToAdmin}
                      className="w-full text-left px-4 py-3 text-gray-800 hover:bg-gray-100 transition font-semibold"
                    >
                      Qua màn Admin
                    </button>
                    <div className="border-t border-gray-200"></div>
                  </>
                )}
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-3 text-gray-800 hover:bg-gray-100 transition font-semibold"
                >
                  Đăng xuất
                </button>
              </div>
            )}

            <div className="text-right cursor-pointer hover:opacity-80 transition">
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
