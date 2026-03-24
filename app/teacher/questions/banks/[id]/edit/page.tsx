'use client';

import TeacherLayout from '@/layouts/TeacherLayout';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import questionBankApi, { QuestionBank } from '@/api/question-bank.api';

export default function EditBankPage() {
  const params = useParams();
  const router = useRouter();
  const bankId = (params?.id as string) || '';

  const [bank, setBank] = useState<QuestionBank | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchBank();
  }, [bankId]);

  const fetchBank = async () => {
    try {
      setLoading(true);
      const response = await questionBankApi.getById(bankId);
      setBank(response.data);
      setName(response.data.name);
      setDescription(response.data.description || '');
    } catch (err) {
      console.error('Lỗi khi tải ngân hàng câu hỏi:', err);
      setError('Không thể tải ngân hàng câu hỏi');
    } finally {
      setLoading(false);
    }
  };

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
      setSaving(true);
      await questionBankApi.update(bankId, {
        name: name.trim(),
        description: description.trim() || undefined,
      });
      router.push(`/teacher/questions/banks/${bankId}`);
    } catch (err) {
      console.error('Lỗi khi cập nhật ngân hàng:', err);
      setError('Không thể cập nhật ngân hàng. Vui lòng thử lại.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  if (loading) {
    return (
      <TeacherLayout>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600 text-center">Đang tải ngân hàng câu hỏi...</p>
        </div>
      </TeacherLayout>
    );
  }

  if (!bank) {
    return (
      <TeacherLayout>
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-gray-600 text-center">Không tìm thấy ngân hàng câu hỏi</p>
        </div>
      </TeacherLayout>
    );
  }

  return (
    <TeacherLayout>
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Chỉnh sửa ngân hàng câu hỏi</h1>

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
                disabled={saving}
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
                disabled={saving}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              />
            </div>

            <div className="flex gap-3 justify-end pt-6">
              <button
                type="button"
                onClick={handleCancel}
                disabled={saving}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50"
              >
                {saving ? 'Đang lưu...' : 'Lưu thay đổi'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </TeacherLayout>
  );
}
