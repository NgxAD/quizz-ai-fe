'use client';

import TeacherLayout from '@/layouts/TeacherLayout';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import questionBankApi from '@/api/question-bank.api';

export default function CreateBankPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Tên ngân hàng không được để trống');
      return;
    }

    if (name.trim().length > 255) {
      setError('Tên ngân hàng không vượt quá 255 ký tự');
      return;
    }

    try {
      setLoading(true);
      await questionBankApi.create({
        name: name.trim(),
        description: description.trim() || undefined,
      });
      router.push('/teacher/questions/list');
    } catch (err) {
      console.error('Lỗi khi tạo ngân hàng câu hỏi:', err);
      setError('Không thể tạo ngân hàng câu hỏi. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <TeacherLayout>
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Tạo ngân hàng câu hỏi mới</h1>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-semibold text-gray-900 mb-2">
                Tên ngân hàng <span className="text-red-600">*</span>
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nhập tên ngân hàng câu hỏi"
                maxLength={255}
                disabled={loading}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              />
              <p className="text-xs text-gray-500 mt-1">
                {name.length}/255 ký tự
              </p>
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-semibold text-gray-900 mb-2">
                Mô tả (Tùy chọn)
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Nhập mô tả ngân hàng câu hỏi"
                rows={4}
                disabled={loading}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              />
            </div>

            <div className="flex gap-3 justify-end pt-6">
              <button
                type="button"
                onClick={handleCancel}
                disabled={loading}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50"
              >
                {loading ? 'Đang tạo...' : 'Tạo ngân hàng'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </TeacherLayout>
  );
}
