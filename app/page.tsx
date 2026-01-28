'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth.store';

export default function Home() {
  const router = useRouter();
  const { isLoggedIn, user } = useAuthStore();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500">
      {/* Navigation */}
      <nav className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="text-2xl font-bold text-blue-600">📚</div>
              <h1 className="text-2xl font-bold text-gray-900">Quizz App</h1>
            </div>
            <div className="flex gap-4">
              {isLoggedIn ? (
                <>
                  <span className="text-gray-700 py-2">
                    Xin chào, {user?.fullName}
                  </span>
                  {user?.role === 'teacher' ? (
                    <Link
                      href="/teacher/dashboard"
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                    >
                      Dashboard
                    </Link>
                  ) : (
                    <Link
                      href="/student/exams"
                      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                    >
                      Làm bài kiểm tra
                    </Link>
                  )}
                  <button
                    onClick={() => {
                      useAuthStore.setState({ isLoggedIn: false, user: null, token: null });
                      router.push('/');
                    }}
                    className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
                  >
                    Đăng xuất
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="text-gray-700 px-4 py-2 hover:text-blue-600"
                  >
                    Đăng nhập
                  </Link>
                  <Link
                    href="/register"
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                  >
                    Đăng ký
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center text-white mb-16">
          <h2 className="text-5xl font-bold mb-4">
            Chào mừng đến với Quizz App
          </h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Nền tảng học tập trực tuyến hiện đại với các bài kiểm tra trực tuyến, tạo câu hỏi bằng AI, và theo dõi tiến độ học tập.
          </p>
          {!isLoggedIn && (
            <div className="flex gap-4 justify-center">
              <Link
                href="/register"
                className="bg-white text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 text-lg"
              >
                Đăng ký ngay
              </Link>
              <Link
                href="/login"
                className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 text-lg border-2 border-white"
              >
                Đăng nhập
              </Link>
            </div>
          )}
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center hover:shadow-xl transition">
            <div className="text-4xl mb-4">📝</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Tạo Bài Kiểm Tra
            </h3>
            <p className="text-gray-600">
              Dễ dàng tạo bài kiểm tra với nhiều loại câu hỏi khác nhau
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-8 text-center hover:shadow-xl transition">
            <div className="text-4xl mb-4">🤖</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              AI Tạo Câu Hỏi
            </h3>
            <p className="text-gray-600">
              Sử dụng AI để tự động tạo câu hỏi từ chủ đề của bạn
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-8 text-center hover:shadow-xl transition">
            <div className="text-4xl mb-4">📊</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Theo Dõi Kết Quả
            </h3>
            <p className="text-gray-600">
              Xem chi tiết kết quả và phân tích hiệu suất học tập
            </p>
          </div>
        </div>

        {/* Roles */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-16">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="text-4xl mb-4">👨‍🏫</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Cho Giáo Viên</h3>
            <ul className="text-gray-600 space-y-2">
              <li>✓ Tạo và quản lý bài kiểm tra</li>
              <li>✓ Tạo câu hỏi bằng AI</li>
              <li>✓ Theo dõi kết quả học sinh</li>
              <li>✓ Phân tích thống kê</li>
            </ul>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="text-4xl mb-4">👨‍🎓</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Cho Học Sinh</h3>
            <ul className="text-gray-600 space-y-2">
              <li>✓ Làm bài kiểm tra trực tuyến</li>
              <li>✓ Xem kết quả chi tiết</li>
              <li>✓ Làm lại bài kiểm tra</li>
              <li>✓ Theo dõi tiến độ học tập</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white text-center py-8 mt-20">
        <p>&copy; 2026 Quizz App. Tất cả quyền được bảo lưu.</p>
      </footer>
    </div>
  );
}
