'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import authApi from '@/api/auth.api';
import { useAuthStore } from '@/store/auth.store';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuthStore();

  // Handle Google callback
  useEffect(() => {
    const token = searchParams?.get('token');
    const userParam = searchParams?.get('user');
    const errorMsg = searchParams?.get('error');

    if (errorMsg) {
      setError(decodeURIComponent(errorMsg));
      return;
    }

    if (token && userParam) {
      try {
        // Decode user data from URL
        const user = JSON.parse(decodeURIComponent(userParam));
        
        // Đăng nhập với full user data
        login(user, token);
        
        if (user.role?.toLowerCase() === 'admin') {
          router.push('/admin/dashboard');
        } else if (user.role?.toLowerCase() === 'teacher') {
          router.push('/teacher/dashboard');
        } else {
          router.push('/student/exams');
        }
      } catch (err) {
        setError('Lỗi xử lý thông tin đăng nhập từ Google');
      }
    }
  }, [searchParams, router, login]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authApi.login({ email, password });
      login(response.data.user as any, response.data.access_token);
      
      // Redirect based on role
      if (response.data.user.role?.toLowerCase() === 'admin') {
        router.push('/admin/dashboard');
      } else if (response.data.user.role?.toLowerCase() === 'teacher') {
        router.push('/teacher/dashboard');
      } else {
        router.push('/student/exams');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Đăng nhập thất bại');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    const redirectUri = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'}/auth/google/callback`;
    
    if (!clientId) {
      setError('Google Client ID không được cấu hình');
      return;
    }

    const scope = 'profile email';
    const responseType = 'code';
    const state = btoa(JSON.stringify({ from: 'login' }));
    
    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=${responseType}&scope=${encodeURIComponent(scope)}&state=${state}`;
    
    window.location.href = googleAuthUrl;
  };

  return (
    <>
      {/* Header */}
      <nav className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div
              className="flex items-center gap-2 cursor-pointer hover:opacity-70"
              onClick={() => router.push('/')}
            >
              <div className="text-2xl font-bold text-blue-600">📚</div>
              <h1 className="text-2xl font-bold text-gray-900">Quizz App</h1>
            </div>
            <div className="flex gap-4">
              <Link
                href="/register"
                className="text-gray-700 px-4 py-2 hover:text-blue-600"
              >
                Đăng ký
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Login Form */}
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-blue-500 to-purple-600">
        <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
          <h1 className="text-3xl font-bold text-center mb-6 text-gray-800">Đăng Nhập</h1>
          
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-gray-700 font-semibold mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black placeholder-gray-400"
                placeholder="your@email.com"
                required
              />
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-2">Mật khẩu</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black placeholder-gray-400"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg transition duration-200 disabled:opacity-50"
            >
              {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </button>
          </form>

          <div className="mt-6">
            <button 
              type="button"
              onClick={handleGoogleLogin}
              className="w-full bg-white border-2 border-gray-300 hover:border-blue-500 text-gray-700 font-bold py-2 px-4 rounded-lg transition duration-200 flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <image href="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNMjIuNTYgMTIuMjVjMCAwLjYyLS4wMyAxLjIxLS4xNiAxLjc5SDEydjMuMjZoNi4zYzAtLjI2LS4xMyAxLjAzLS40NyAxLjc4aC0zLjYxVjE3LjNoMS40OXYyLjc3aC0zLjI4VjE3LjNoLTMuNjF2LTMuNzZjLS4zNC0uNzUtLjQ3LTEuNTItLjQ3LTEuNzh2LTMuMjZoNi4zYy4xMy0uNTguMTYtMS4xNy4xNi0xLjc5IDAtLjYyLS4wMy0xLjIxLS4xNi0xLjc5SDJ2MTAuNTJjMCAuNjIuMDMgMS4yMS4xNiAxLjc5aDIwLjRjLjEzLS41OC4xNi0xLjE3LjE2LTEuNzlWMTIuMjV6IiBmaWxsPSIjMTI2N0Y3Ii8+PHBhdGggZD0iTTcuODcgMTUuNTZjLS4zLS4yNy0uNTUtLjY3LS43MS0xLjEzSC4wMXYyLjQ0YzAgLjYyLjAzIDEuMjEuMTYgMS43OWgzLjkxYy4xNi0uNTguMzQtMS4xNi41Mi0xLjU5Ljg4LTIuMDcgMi42NC0zLjQyIDQuMjctMy40MnM2LjAzIDEuMzUgNi45MSAzLjQyYzAuMTguNDMuMzYgMS4wMS41MiAxLjU5aDMuOTFjLjEzLS41OC4xNi0xLjE3LjE2LTEuNzl2LTIuNDRoLTYuMTVjLS4xNi40Ni0uNDEuODYtLjcxIDEuMTN6IiBmaWxsPSIjRUE0MzM1Ii8+PC9zdmc+" />
              </svg>
              Đăng nhập bằng Google
            </button>
          </div>

          <p className="mt-4 text-center text-gray-600">
            Chưa có tài khoản?{' '}
            <Link href="/register" className="text-blue-500 hover:text-blue-700 font-semibold">
              Đăng ký
            </Link>
          </p>
        </div>
      </div>
    </>
  );
}
