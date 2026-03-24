'use client';

import TeacherLayout from '@/layouts/TeacherLayout';
import QuestionForm, { QuestionFormData } from '@/components/QuestionForm';
import { useState, useEffect } from 'react';
import questionApi, { Question } from '@/api/question.api';
import { useRouter, useParams } from 'next/navigation';

export default function EditQuestionPage() {
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');
  const [question, setQuestion] = useState<Question | null>(null);
  const router = useRouter();
  const params = useParams();
  const id = (params?.id as string) || '';

  useEffect(() => {
    if (id) {
      fetchQuestion();
    }
  }, [id]);

  const fetchQuestion = async () => {
    try {
      setLoading(true);
      const response = await questionApi.list();
      const questionItem = response.data.find(q => q._id === id);
      if (questionItem) {
        setQuestion(questionItem);
      } else {
        setError('Câu hỏi không tìm thấy');
      }
    } catch (err: any) {
      console.error('Lỗi khi tải câu hỏi:', err);
      setError('Không thể tải câu hỏi');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (data: QuestionFormData) => {
    try {
      setUpdating(true);
      setError('');
      
      // Transform options format: string[] -> Array<{text, isCorrect}>
      const transformedData = {
        ...data,
        options: data.type === 'MULTIPLE_CHOICE' && data.options
          ? data.options.map(option => ({
              text: option,
              isCorrect: option === data.correctAnswer,
            }))
          : undefined,
      };
      
      await questionApi.update(id, transformedData);
      alert('Câu hỏi đã được cập nhật thành công!');
      router.push('/teacher/questions/list');
    } catch (err: any) {
      console.error('Lỗi khi cập nhật câu hỏi:', err);
      setError(err.response?.data?.message || 'Không thể cập nhật câu hỏi');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <TeacherLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="text-blue-600 hover:text-blue-800"
          >
            ← Quay lại
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Chỉnh sửa câu hỏi</h1>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {loading ? (
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-center">Đang tải câu hỏi...</p>
          </div>
        ) : question ? (
          <QuestionForm onSubmit={handleSubmit} loading={updating} initialData={question} />
        ) : (
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-gray-600 text-center">Câu hỏi không tìm thấy</p>
          </div>
        )}
      </div>
    </TeacherLayout>
  );
}
