'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import TeacherLayout from '@/layouts/TeacherLayout';
import QuestionComposer from '@/components/QuestionComposer';
import examApi from '@/api/exam.api';

interface Question {
  question: string;
  answers: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  correctAnswer?: 'A' | 'B' | 'C' | 'D';
}

export default function ComposeQuestionsPage() {
  const params = useParams();
  const router = useRouter();
  const examId = (params?.id as string) || '';

  const [exam, setExam] = useState<any>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchExamData();
  }, [examId]);

  const fetchExamData = async () => {
    try {
      setLoading(true);
      const response = await examApi.getById(examId);
      setExam(response.data);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Lỗi khi tải thông tin đề');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleQuestionsChange = useCallback((newQuestions: Question[]) => {
    setQuestions(newQuestions);
  }, []);

  const handleSaveQuestions = async () => {
    if (questions.length === 0) {
      setError('Vui lòng thêm ít nhất 1 câu hỏi');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      // Transform questions to match backend format
      const payload = {
        title: exam?.title || '', // Include title
        description: exam?.description || '',
        duration: exam?.duration || 60,
        passingPercentage: exam?.passingPercentage || 50,
        type: exam?.type || 'exercise',
        questions: questions.map((q) => {
          // Get correct answer key and value
          const correctAnswerKey = q.correctAnswer || 'A';
          const correctAnswerText = q.answers[correctAnswerKey];

          return {
            content: q.question,
            type: 'multiple-choice', // Required by backend
            options: [
              { text: q.answers.A, isCorrect: 'A' === correctAnswerKey },
              { text: q.answers.B, isCorrect: 'B' === correctAnswerKey },
              { text: q.answers.C, isCorrect: 'C' === correctAnswerKey },
              { text: q.answers.D, isCorrect: 'D' === correctAnswerKey },
            ].filter(opt => opt.text), // Filter out empty answers
          };
        }),
      };

      // Add questions to exam
      await examApi.updateExamWithQuestions(examId, payload);
      setSuccess('✓ Lưu câu hỏi thành công!');
      
      setTimeout(() => {
        router.push(`/teacher/exams/${examId}/edit`);
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Lỗi khi lưu câu hỏi');
      console.error('Error:', err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <TeacherLayout>
        <div className="flex justify-center items-center min-h-screen">
          <div className="text-gray-600">⏳ Đang tải...</div>
        </div>
      </TeacherLayout>
    );
  }

  return (
    <TeacherLayout>
      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">
            ✏️ Soạn câu hỏi cho: {exam?.title}
          </h1>
          <p className="text-gray-600 mt-2">{exam?.description}</p>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            <strong>Lỗi:</strong> {error}
          </div>
        )}

        {success && (
          <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
            {success}
          </div>
        )}

        {/* Exam Info Section */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Exam Info */}
            <div className="lg:col-span-2">
              <h2 className="text-sm font-bold text-gray-900 mb-3">📋 Thông tin đề</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                <div>
                  <p className="text-xs text-gray-600 font-semibold">Tên</p>
                  <p className="text-xs text-gray-900 font-semibold line-clamp-2">{exam?.title}</p>
                </div>

                <div>
                  <p className="text-xs text-gray-600 font-semibold">Mô tả</p>
                  <p className="text-xs text-gray-900 line-clamp-2">{exam?.description || '(Không có)'}</p>
                </div>

                <div>
                  <p className="text-xs text-gray-600 font-semibold">Loại</p>
                  <p className="text-xs text-gray-900">
                    {exam?.type === 'exercise' ? '📝 Bài tập' : '✅ Kiểm tra'}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-600 font-semibold">Thời gian</p>
                  <p className="text-xs text-gray-900">{exam?.duration} phút</p>
                </div>

                <div>
                  <p className="text-xs text-gray-600 font-semibold">Điểm qua</p>
                  <p className="text-xs text-gray-900">{exam?.passingPercentage}%</p>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded p-2">
                  <p className="text-xs text-blue-900 font-semibold">Câu hỏi</p>
                  <p className="text-lg font-bold text-blue-600">{questions.length}</p>
                </div>
              </div>
            </div>

            {/* Right: Action Buttons */}
            <div className="lg:col-span-1">
              <h2 className="text-sm font-bold text-gray-900 mb-3">⚡ Hành động</h2>
              <div className="space-y-2">
                <button
                  onClick={handleSaveQuestions}
                  disabled={saving || questions.length === 0}
                  className="w-full bg-blue-600 text-white px-3 py-2 rounded-lg font-semibold text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  {saving ? '⏳ Lưu...' : '💾 Lưu & tiếp'}
                </button>

                <button
                  onClick={() => router.back()}
                  className="w-full bg-gray-200 text-gray-700 px-3 py-2 rounded-lg font-semibold text-sm hover:bg-gray-300 transition"
                >
                  ← Quay lại
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Input and Preview Section */}
        <div>
          <QuestionComposer 
            compact={true}
            onQuestionsChange={handleQuestionsChange} 
          />
        </div>
      </div>
    </TeacherLayout>
  );
}
