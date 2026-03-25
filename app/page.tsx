'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth.store';
import { useState } from 'react';

export default function Home() {
  const router = useRouter();
  const { isLoggedIn, user } = useAuthStore();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-white shadow-lg">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="text-2xl font-bold text-blue-600">📚</div>
              <h1 className="text-2xl font-bold text-gray-900">ADTest</h1>
            </div>
            <div className="flex gap-4 items-center">
              {isLoggedIn ? (
                <div className="relative">
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-gray-100 transition"
                  >
                    {user?.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.fullName}
                        className="w-8 h-8 rounded-full object-cover border border-gray-300"
                      />
                    ) : (
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                        {user?.fullName?.charAt(0)?.toUpperCase() || 'U'}
                      </div>
                    )}
                    <span className="text-gray-700 font-medium text-sm">{user?.fullName}</span>
                  </button>

                  {dropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg z-50 border border-gray-100">
                      <Link
                        href={user?.roles?.includes('teacher') ? '/teacher/profile' : '/student/profile'}
                        className="block px-4 py-3 text-gray-700 hover:bg-blue-50 first:rounded-t-lg border-b border-gray-100 transition"
                        onClick={() => setDropdownOpen(false)}
                      >
                        Hồ sơ
                      </Link>
                      {user?.roles?.includes('teacher') ? (
                        <Link
                          href="/teacher/dashboard"
                          className="block px-4 py-3 text-gray-700 hover:bg-blue-50 border-b border-gray-100 transition"
                          onClick={() => setDropdownOpen(false)}
                        >
                          Bảng điều khiển
                        </Link>
                      ) : (
                        <Link
                          href="/student/exams"
                          className="block px-4 py-3 text-gray-700 hover:bg-blue-50 border-b border-gray-100 transition"
                          onClick={() => setDropdownOpen(false)}
                        >
                          Làm bài kiểm tra
                        </Link>
                      )}
                      <button
                        onClick={() => {
                          useAuthStore.setState({ isLoggedIn: false, user: null, token: null });
                          router.push('/');
                          setDropdownOpen(false);
                        }}
                        className="w-full text-left px-4 py-3 text-red-600 hover:bg-red-50 last:rounded-b-lg transition"
                      >
                        Đăng xuất
                      </button>
                    </div>
                  )}
                </div>
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

      {/* Quiz CTA Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Quiz CTA Section */}
        <div className="bg-gradient-to-br from-blue-100 to-cyan-100 rounded-2xl mt-0 p-12 mb-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div>
              <div className="inline-block bg-white text-green-600 px-4 py-2 rounded-full text-sm font-semibold mb-6 shadow-sm">
                ● Nền tảng kiểm tra hiện đại
              </div>
              <h2 className="text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                Làm bài kiểm tra <br />
                <span className="text-blue-600">trực tuyến dễ dàng</span>
              </h2>
              <p className="text-gray-700 text-lg mb-8 leading-relaxed">
                Nền tảng làm bài kiểm tra hiện đại với nhiều loại câu hỏi, timer đếm ngược, và giao diện đẹp mắt. Bắt đầu ngay để trải nghiệm!
              </p>
              <div className="flex gap-4 flex-wrap">
                {!isLoggedIn ? (
                  <>
                    <Link
                      href="/student/exams"
                      className="bg-blue-600 text-white px-8 py-4 rounded-xl font-semibold hover:bg-blue-700 transition shadow-lg text-lg flex items-center gap-2"
                    >
                      ⏱️ Xem bài kiểm tra
                    </Link>
                    <Link
                      href="/register"
                      className="bg-white text-gray-900 px-8 py-4 rounded-xl font-semibold hover:bg-gray-50 border-2 border-gray-200 transition text-lg"
                    >
                      📖 Hướng dẫn
                    </Link>
                  </>
                ) : (
                  <Link
                    href={user?.roles?.includes('teacher') ? '/teacher/exams' : '/student/exams'}
                    className="bg-blue-600 text-white px-8 py-4 rounded-xl font-semibold hover:bg-blue-700 transition shadow-lg text-lg"
                  >
                    Bắt đầu ngay
                  </Link>
                )}
              </div>
            </div>

            {/* Right Side - Mockup & Stats */}
            <div className="relative">
              {/* Mock App Interface */}
              <div className="bg-white rounded-2xl shadow-2xl p-6 mb-6">
                <div className="bg-gray-100 rounded-xl p-4 space-y-3">
                  <div className="h-3 bg-gradient-to-r from-blue-400 to-blue-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-full"></div>
                  <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                  <div className="space-y-2 pt-2">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 bg-white border-2 border-green-500 rounded-full"></div>
                      <div className="h-2 bg-green-500 rounded flex-1"></div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 bg-white border-2 border-gray-300 rounded-full"></div>
                      <div className="h-2 bg-gray-200 rounded flex-1"></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Stats & Badges */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white rounded-xl p-4 shadow-lg">
                  <div className="text-3xl font-bold text-gray-900">100k+</div>
                  <p className="text-gray-600 text-sm">Lượt kiểm tra</p>
                </div>
                <div className="bg-white rounded-xl p-4 shadow-lg">
                  <div className="text-3xl font-bold text-gray-900">5k+</div>
                  <p className="text-gray-600 text-sm">Người dùng hoạt động</p>
                </div>
              </div>

              {/* Achievement Badges */}
              <div className="absolute -bottom-6 -right-6 bg-purple-500 text-white rounded-full px-4 py-2 shadow-lg font-bold text-sm">
                🏆 Xuất sắc! <br /> Top 10%
              </div>
              <div className="absolute -bottom-12 left-4 bg-blue-500 text-white rounded-full px-4 py-2 shadow-lg font-bold text-sm">
                ⚡ Tốc độ <br /> 50 câu/phút
              </div>
            </div>
          </div>
        </div>

        {/* What You Need Section */}
        <div className="py-5">
          <div className="text-center mb-16">
            <div className="inline-block text-blue-600 text-sm font-semibold px-4 py-2 rounded-full bg-blue-50 mb-6">
              ● Công Cụ Kiểm Tra Online
            </div>
            <h2 className="text-5xl font-bold text-gray-900 mb-4">
              Mọi Thứ Bạn Cần Để <br />
              <span className="bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">Kiểm Tra Hiệu Quả</span>
            </h2>
            <p className="text-gray-600 text-lg max-w-3xl mx-auto">
              Giảm tải công việc cho giáo viên, tạo môi trường ôn tập mới lạ và hiện đại cho học sinh, sinh viên.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-xl transition">
              <div className="text-4xl mb-3">📊</div>
              <p className="text-gray-500 text-xs font-semibold uppercase tracking-wide mb-4">5 LOẠI</p>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Đa Dạng Câu Hỏi</h3>
              <p className="text-gray-600">
                Hỗ trợ 5 loại câu hỏi: trắc nghiệm một/nhiều đáp án, đúng/sai, điền từ, ghép cặp. Tùy chính theo nhu cầu.
              </p>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-xl transition">
              <div className="text-4xl mb-3">💾</div>
              <p className="text-gray-500 text-xs font-semibold uppercase tracking-wide mb-4">LIVE SYNC</p>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Lưu Trữ Thời Gian Thực</h3>
              <p className="text-gray-600">
                Mọi tiến độ làm bài được đồng bộ tức thì. Không bao giờ mất dữ liệu dù mạng chập chờn.
              </p>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-xl transition">
              <div className="text-4xl mb-3">📱</div>
              <p className="text-gray-500 text-xs font-semibold uppercase tracking-wide mb-4">RESPONSIVE</p>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Giao Diện Thích Ứng</h3>
              <p className="text-gray-600">
                Trải nghiệm mượt mà trên mọi thiết bị từ Laptop, Tablet đến Smartphone. Thiết kế chuẩn UX.
              </p>
            </div>
          </div>
        </div>

        {/* Advanced Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-4">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl shadow-lg p-8 hover:shadow-xl transition">
            <div className="flex items-center gap-4 mb-6">
              <div className="bg-blue-200 rounded-xl p-3">
                <div className="text-2xl">⚡</div>
              </div>
              <p className="text-gray-500 text-xs font-semibold uppercase tracking-wide">TURBO MODE</p>
            </div>
            <h3 className="text-2xl font-bold text-blue-600 mb-3">Tối Ưu Hiệu Năng</h3>
            <p className="text-gray-600">
              Tốc độ tải trang nhanh người chạp mắt. Hệ thống chiều tải lớn cho hàng ngàn học sinh thí cùng lúc.
            </p>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl shadow-lg p-8 hover:shadow-xl transition">
            <div className="flex items-center gap-4 mb-6">
              <div className="bg-purple-200 rounded-xl p-3">
                <div className="text-2xl">🔒</div>
              </div>
              <p className="text-gray-500 text-xs font-semibold uppercase tracking-wide">ANTI-CHEAT</p>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">Chống Gian Lận</h3>
            <p className="text-gray-600">
              Đảo thứ tự câu hỏi và đáp án, giới hạn thời gian làm bài, theo dõi khi học sinh sử dụng phím tắt, tab ra ngoài,...
            </p>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl shadow-lg p-8 hover:shadow-xl transition">
            <div className="flex items-center gap-4 mb-6">
              <div className="bg-green-200 rounded-xl p-3">
                <div className="text-2xl">💻</div>
              </div>
              <p className="text-gray-500 text-xs font-semibold uppercase tracking-wide">NEXT.JS 16</p>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">Công Nghệ Hiện Đại</h3>
            <p className="text-gray-600">
              Xây dựng trên nền tảng Next.js mạnh mẽ, đảm bảo tính ổn định và khả năng mở rộng trong tương lai.
            </p>
          </div>
        </div>
      </div>

      {/* Mission Section */}
      <div className="py-20 bg-gradient-to-b from-transparent to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div>
              <div className="inline-block bg-cyan-100 text-cyan-600 text-sm font-semibold px-4 py-2 rounded-full mb-6">
                Our Mission
              </div>
              <h2 className="text-5xl font-bold mb-8">
                <span className="text-blue-600">Câu chuyện</span> <br />
                <span className="text-cyan-600">của chúng tôi</span>
              </h2>
              <p className="text-gray-700 text-lg mb-6 leading-relaxed">
                Xuất phát từ nhu cầu học tập thực tế, chúng tôi nhận thấy việc kiểm tra đánh giá truyền thống còn nhiều hạn chế. Với mong muốn tìm giải pháp để nâng cao trải nghiệm học tập, giúp tiếp thu kiến thức để đạng hơn và truyền cầm hứng, tạo động lục học tập cho sinh viên, chúng tôi đã bắt đầu hành trình xây dựng nên tầng này.
              </p>
              <p className="text-gray-700 text-lg leading-relaxed">
                Chúng tôi tạo ra môi trường trao đổi cho học sinh, sinh viên, nơi họ có thể học tập, thực hành và phát triển kỹ năng một cách hiệu quả. Với công nghệ hiện đại và giao diện thân thiện, chúng tôi hy vọng mang đến trải nghiệm học tập tốt nhất cho mọi người.
              </p>
            </div>

            {/* Right Content - Timeline & Highlights */}
            <div className="space-y-8">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-8 flex items-center gap-3">
                  <div className="h-1 w-8 bg-blue-600 rounded"></div>
                  Các cột mốc nội bật
                </h3>
                
                <div className="space-y-6">
                  {/* 2024 */}
                  <div className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-4 h-4 bg-cyan-500 rounded-full"></div>
                      <div className="w-1 h-12 bg-cyan-200 mt-2"></div>
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 mb-2">2025</h4>
                      <p className="text-gray-600 text-sm">
                        Nhen nhóm ý tưởng và bắt đầu nghiên cứu, phát triển sản phẩm từ nhu cầu thực tế của học sinh, sinh viên.
                      </p>
                    </div>
                  </div>

                  {/* 2025 */}
                  <div className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-4 h-4 bg-cyan-500 rounded-full"></div>
                      <div className="w-1 h-12 bg-cyan-200 mt-2"></div>
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 mb-2">2026</h4>
                      <p className="text-gray-600 text-sm">
                        Triển khai và ra mắt nền tảng, mang đến giải pháp kiểm tra trực tuyến hiện đại với nhiều tính năng tiên tiến.
                      </p>
                    </div>
                  </div>

                  {/* Future */}
                  <div className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-4 h-4 bg-cyan-500 rounded-full"></div>
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 mb-2">Tương lai</h4>
                      <p className="text-gray-600 text-sm">
                        Tiếp tục phát triển và mở rộng, mang đến nhiều tính năng mới và cải thiện trải nghiệm người dùng.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Additional Highlights */}
              <div className="grid grid-cols-2 gap-4 pt-8 border-t border-gray-200">
                <div>
                  <h4 className="font-bold text-gray-900 mb-2">Tập trung vào trải <br /> nghiệm học tập</h4>
                  <p className="text-gray-600 text-sm">
                    Mọi tính năng được hướng tới việc giúp học viên hiểu sâu và yêu thích việc kiểm tra đánh giá.
                  </p>
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 mb-2">Đồng hành cùng giáo <br /> viên</h4>
                  <p className="text-gray-600 text-sm">
                    Cung cấp công cụ để dùng, tiết kiệm thời gian và giúp giáo viên tạo thu nhập bên vững.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Section */}
      <div className="py-20 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-block bg-blue-100 text-blue-600 text-sm font-semibold px-4 py-2 rounded-full mb-8">
            ● Contact Us
          </div>
          
          <h2 className="text-5xl font-bold mb-6 leading-tight">
            <span className="text-blue-600">Luôn động hành cùng</span>
            <br />
            <span className="text-cyan-600">giáo viên và học viên</span>
          </h2>
          
          <p className="text-gray-600 text-lg max-w-3xl mx-auto mb-16">
            Liên hệ với chúng tôi để được tư vấn giải pháp phù hợp hoặc hợp tác xây dựng nền tảng kiểm tra trực tuyến cho tổ chức của bạn.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Email Support */}
            <div className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-xl transition">
              <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                <div className="text-3xl">✉️</div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Email hỗ trợ</h3>
              <p className="text-blue-600 font-semibold text-lg mb-4">adtest@gmail.com</p>
              <p className="text-gray-600">
                Chúng tôi phản hồi trong vòng 24 giờ làm việc.
              </p>
            </div>

            {/* Facebook Fanpage */}
            <div className="bg-white rounded-2xl shadow-lg p-8 hover:shadow-xl transition">
              <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                <div className="text-3xl">👥</div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Truy cập Fanpage</h3>
              <p className="text-blue-600 font-semibold text-lg mb-4">Fanpage ADTest trên Facebook</p>
              <p className="text-gray-600">
                Theo dõi để nhận tin tức, cập nhật mới và hỗ trợ trực tiếp từ đội ngũ.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-blue-50 border-t border-blue-100 py-16 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            {/* Brand Section */}
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <span className="text-3xl">📚</span>
                <h3 className="text-2xl font-bold text-gray-900">ADTest</h3>
              </div>
              <p className="text-gray-600 mb-6 max-w-sm">
                Nền tảng làm bài kiểm tra trực tuyến hiện đại, hỗ trợ nhiều loại câu hỏi và giao diện đẹp mắt.
              </p>
              <div className="flex gap-4">
                <a href="#" className="w-10 h-10 bg-white rounded-lg shadow-md flex items-center justify-center hover:shadow-lg transition text-gray-900 hover:text-gray-700" title="GitHub">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v 3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                  </svg>
                </a>
                <a href="#" className="w-10 h-10 bg-white rounded-lg shadow-md flex items-center justify-center hover:shadow-lg transition text-gray-900 hover:text-gray-700" title="X (Twitter)">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                  </svg>
                </a>
                <a href="#" className="w-10 h-10 bg-white rounded-lg shadow-md flex items-center justify-center hover:shadow-lg transition text-gray-900 hover:text-gray-700" title="Telegram">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a11.955 11.955 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.96 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.365-1.337.185-.437-.148-1.33-.514-1.98-.942-.798-.529-1.432-1.493-.1-1.678.381-.084 1.646-.223 2.976-.539z"/>
                  </svg>
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-lg font-bold text-gray-900 mb-4">Sản phẩm</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-600 hover:text-blue-600 transition">Tạo bài kiểm tra</a></li>
                <li><a href="#" className="text-gray-600 hover:text-blue-600 transition">AI Tạo Câu Hỏi</a></li>
                <li><a href="#" className="text-gray-600 hover:text-blue-600 transition">Theo dõi kết quả</a></li>
              </ul>
            </div>

            {/* Support */}
            <div>
              <h4 className="text-lg font-bold text-gray-900 mb-4">Hỗ trợ</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-gray-600 hover:text-blue-600 transition">Tài liệu hướng dẫn</a></li>
                <li><a href="#" className="text-gray-600 hover:text-blue-600 transition">Liên hệ chúng tôi</a></li>
                <li><a href="#" className="text-gray-600 hover:text-blue-600 transition">Chính sách bảo mật</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-blue-200 mt-12 pt-8">
            <p className="text-gray-600 text-center">&copy; 2026 ADTest. Tất cả quyền được bảo lưu.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
