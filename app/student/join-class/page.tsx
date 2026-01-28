'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import StudentLayout from '@/layouts/StudentLayout';
import classApi from '@/api/class.api';

export default function JoinClassPage() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleJoinClass = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!code.trim()) {
      setError('Vui lòng nhập mã lớp');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await classApi.joinClass(code.trim());
      setSuccess('✓ Tham gia lớp thành công!');
      setCode('');
      setTimeout(() => {
        router.push('/student/classes?refresh=true');
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Không thể tham gia lớp. Vui lòng kiểm tra mã lớp');
    } finally {
      setLoading(false);
    }
  };

  return (
    <StudentLayout>
      <div className="max-w-md mx-auto">
        <button
          onClick={() => router.back()}
          className="text-blue-600 hover:text-blue-700 font-semibold mb-6"
        >
          ← Quay lại
        </button>

        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-6">
            <div className="text-5xl mb-4">🏫</div>
            <h1 className="text-3xl font-bold text-gray-900">Tham gia lớp học</h1>
            <p className="text-gray-600 mt-2">Nhập mã lớp để tham gia</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-6">
              {success}
            </div>
          )}

          <form onSubmit={handleJoinClass} className="space-y-6">
            <div>
              <label className="block text-gray-700 font-semibold mb-3">
                Mã lớp <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="Nhập mã lớp 6 chữ số"
                maxLength={6}
                className="w-full border-2 border-gray-300 rounded-lg p-4 text-center text-2xl tracking-widest text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 transition"
              />
              <p className="text-gray-500 text-sm mt-2">
                Lấy mã lớp từ giáo viên của bạn
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {loading ? 'Đang xử lý...' : 'Tham gia lớp'}
            </button>
          </form>

          <div className="mt-8 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-2">💡 Hướng dẫn:</h3>
            <ul className="text-gray-700 text-sm space-y-1">
              <li>• Lấy mã lớp từ giáo viên của bạn</li>
              <li>• Mã lớp gồm 6 chữ số</li>
              <li>• Sau khi tham gia, bạn có thể xem các bài kiểm tra</li>
            </ul>
          </div>
        </div>
      </div>
    </StudentLayout>
  );
}
