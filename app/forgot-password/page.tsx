'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import authApi from '@/api/auth.api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'email' | 'code'>('email'); // email or code
  const router = useRouter();

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      // Make API call to request password reset
      await authApi.requestPasswordReset({ email });
      
      setMessage(
        'Mã xác minh 6 số đã được gửi đến email của bạn. Vui lòng kiểm tra hộp thư.'
      );
      setStep('code');
      setCode('');
    } catch (err: any) {
      console.error('Password reset error:', err);
      setError(
        err.response?.data?.message ||
        'Không thể gửi yêu cầu đặt lại mật khẩu. Vui lòng thử lại.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (code.length !== 6 || !/^\d+$/.test(code)) {
      setError('Vui lòng nhập mã 6 số hợp lệ');
      return;
    }

    setLoading(true);

    try {
      // Verify code and redirect to reset password page
      await authApi.verifyResetCode({ email, code });
      
      setMessage('Mã xác minh hợp lệ. Đang chuyển hướng...');
      
      // Redirect to reset password page with email and code
      setTimeout(() => {
        router.push(`/reset-password?email=${encodeURIComponent(email)}&code=${code}`);
      }, 1000);
    } catch (err: any) {
      console.error('Code verification error:', err);
      setError(
        err.response?.data?.message ||
        'Mã xác minh không hợp lệ hoặc đã hết hạn. Vui lòng thử lại.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleBackToEmail = () => {
    setStep('email');
    setCode('');
    setMessage('');
    setError('');
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

      {/* Forgot Password Form */}
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-blue-500 to-purple-600">
        <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
          <h1 className="text-3xl font-bold text-center mb-2 text-gray-800">Quên Mật Khẩu</h1>
          <p className="text-center text-gray-600 mb-6">
            {step === 'email'
              ? 'Nhập email của bạn và chúng tôi sẽ gửi mã xác minh'
              : 'Nhập mã 6 số được gửi đến email của bạn'}
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

          {step === 'email' ? (
            <form onSubmit={handleEmailSubmit} className="space-y-4">
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

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg transition duration-200 disabled:opacity-50"
              >
                {loading ? 'Đang gửi...' : 'Gửi Yêu Cầu'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleCodeSubmit} className="space-y-4">
              <div>
                <label className="block text-gray-700 font-semibold mb-2">Mã Xác Minh (6 Số)</label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black placeholder-gray-400 text-center text-2xl tracking-widest"
                  placeholder="000000"
                  maxLength={6}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg transition duration-200 disabled:opacity-50"
              >
                {loading ? 'Đang xác minh...' : 'Xác Minh Mã'}
              </button>

              <button
                type="button"
                onClick={handleBackToEmail}
                className="w-full bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-lg transition duration-200"
              >
                Quay Lại
              </button>
            </form>
          )}

          <p className="mt-6 text-center text-gray-600">
            <Link href="/login" className="text-blue-500 hover:text-blue-700 font-semibold">
              Đăng nhập
            </Link>
          </p>
        </div>
      </div>
    </>
  );
}
