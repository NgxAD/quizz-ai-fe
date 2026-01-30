'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth.store';
import { ReactNode, useState } from 'react';
import { useAdminRoute } from '@/utils/hooks';

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { isChecked } = useAdminRoute();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleLogout = () => {
    logout();
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
          <h1 className="text-2xl font-bold">Quizz Admin</h1>
        </div>

        <nav className="mt-10">
          <Link
            href="/admin/dashboard"
            className="block px-6 py-3 hover:bg-gray-800 transition"
          >
            Dashboard
          </Link>
          <Link
            href="/admin/users"
            className="block px-6 py-3 hover:bg-gray-800 transition"
          >
            Quản lý Người dùng
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
              <p className="text-sm text-gray-600 leading-tight m-0">Admin</p>
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
