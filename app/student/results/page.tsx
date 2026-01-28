'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import StudentLayout from '@/layouts/StudentLayout';
import resultApi from '@/api/result.api';

interface Result {
  _id: string;
  quizId: string;
  userId: string;
  submissionId: string;
  totalPoints: number;
  correctAnswers: number;
  wrongAnswers: number;
  skipped: number;
  score: number;
  isPassed: boolean;
  completedAt: string;
}

export default function StudentResultsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const resultId = searchParams?.get('submissionId') as string;

  const [result, setResult] = useState<Result | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (resultId) {
      loadResults();
    }
  }, [resultId]);

  const loadResults = async () => {
    try {
      setLoading(true);
      const response = await resultApi.getById(resultId);
      setResult(response.data);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Lỗi khi tải kết quả');
      console.error('Error loading results:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <StudentLayout>
        <div className="text-center py-12">
          <div className="text-gray-500">Đang tải kết quả...</div>
        </div>
      </StudentLayout>
    );
  }

  if (error || !result) {
    return (
      <StudentLayout>
        <div className="space-y-6">
          <button
            onClick={() => router.back()}
            className="text-blue-600 hover:text-blue-700 font-semibold"
          >
            ← Quay lại
          </button>
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error || 'Không tìm thấy kết quả'}
          </div>
        </div>
      </StudentLayout>
    );
  }

  const scorePercentage = result.totalPoints 
    ? Math.round((result.score / result.totalPoints) * 100)
    : Math.round(result.score);
  const isPassed = result.isPassed;

  return (
    <StudentLayout>
      <div className="space-y-6">
        <button
          onClick={() => router.back()}
          className="text-blue-600 hover:text-blue-700 font-semibold"
        >
          ← Quay lại
        </button>

        <div>
          <h1 className="text-3xl font-bold text-gray-900">Kết quả bài kiểm tra</h1>
          {result.quizId && (
            <p className="text-gray-600 mt-2">
              Đề: <span className="font-semibold">
                {typeof result.quizId === 'string' ? result.quizId : (result.quizId as any).title || 'Bài kiểm tra'}
              </span>
            </p>
          )}
        </div>

        <div className={`rounded-lg shadow p-8 text-center ${
          isPassed 
            ? 'bg-green-50 border border-green-200' 
            : 'bg-red-50 border border-red-200'
        }`}>
          <div className={`text-6xl font-bold mb-4 ${
            isPassed ? 'text-green-600' : 'text-red-600'
          }`}>
            {scorePercentage}%
          </div>
          <div className={`text-2xl font-semibold mb-4 ${
            isPassed ? 'text-green-700' : 'text-red-700'
          }`}>
            {isPassed ? '✓ Đạt' : '✗ Không đạt'}
          </div>
          <div className="text-gray-600">
            <p className="mb-2">Điểm: <span className="font-semibold">{result.score}{result.totalPoints ? ` / ${result.totalPoints}` : ''}</span></p>
            <p className="text-sm">Thời gian nộp: {new Date(result.completedAt).toLocaleString('vi-VN')}</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 text-center bg-gray-50 rounded-lg p-6">
          <div>
            <div className="text-2xl font-bold text-gray-900">{result.correctAnswers + result.wrongAnswers + result.skipped}</div>
            <div className="text-sm text-gray-600">Câu trả lời</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">
              {result.correctAnswers}
            </div>
            <div className="text-sm text-gray-600">Đúng</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-red-600">
              {result.wrongAnswers}
            </div>
            <div className="text-sm text-gray-600">Sai</div>
          </div>
        </div>

        <div className="flex gap-4 justify-center pt-6">
          <button
            onClick={() => router.push('/student/classes')}
            className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition"
          >
            Quay lại danh sách lớp
          </button>
          <button
            onClick={() => router.push('/student/exams')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            Xem bài khác
          </button>
        </div>
      </div>
    </StudentLayout>
  );
}
