'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import authApi from '@/api/auth.api';

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const emailParam = searchParams?.get('email');
    const codeParam = searchParams?.get('code');
    
    if (!emailParam || !codeParam) {
      setError('Email hoặc mã xác minh không hợp lệ. Vui lòng yêu cầu đặt lại mật khẩu lại.');
      return;
    }
    
    setEmail(decodeURIComponent(emailParam));
    setCode(codeParam);
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    // Validation
    if (password !== confirmPassword) {
      setError('Mật khẩu không khớp');
      return;
    }

    if (password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }

    setLoading(true);

    try {
      await authApi.resetPassword({
        email,
        code,
        password,
      });

      setMessage('Mật khẩu đã được đặt lại thành công. Đang chuyển hướng đến đăng nhập...');

      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (err: any) {
      console.error('Password reset error:', err);
      setError(
        err.response?.data?.message ||
        'Không thể đặt lại mật khẩu. Mã có thể đã hết hạn.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Header */}
      <nav className="bg-white shadow-lg">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div
              className="flex items-center gap-2 cursor-pointer hover:opacity-70 flex-shrink-0"
              onClick={() => router.push('/')}
            >
              <div className="text-2xl font-bold text-blue-600">📚</div>
              <h1 className="text-2xl font-bold text-gray-900">ADTest</h1>
            </div>
            <div className="flex gap-4">
              <Link
                href="/login"
                className="text-gray-700 px-4 py-2 hover:text-blue-600"
              >
                Đăng nhập
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Reset Password Form */}
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-blue-500 to-purple-600">
        <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
          <h1 className="text-3xl font-bold text-center mb-2 text-gray-800">Đặt Lại Mật Khẩu</h1>
          <p className="text-center text-gray-600 mb-6">
            Nhập mật khẩu mới của bạn
          </p>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          {message && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
              {message}
            </div>
          )}

          {email && code && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-gray-700 font-semibold mb-2">Mật Khẩu Mới</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black placeholder-gray-400"
                  placeholder="••••••••"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-2">Xác Nhận Mật Khẩu</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
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
                {loading ? 'Đang xử lý...' : 'Đặt Lại Mật Khẩu'}
              </button>
            </form>
          )}

          <p className="mt-6 text-center text-gray-600">
            Quay lại{' '}
            <Link href="/login" className="text-blue-500 hover:text-blue-700 font-semibold">
              Đăng nhập
            </Link>
          </p>
        </div>
      </div>
    </>
  );
}
