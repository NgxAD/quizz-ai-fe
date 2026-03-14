'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import TeacherLayout from '@/layouts/TeacherLayout';
import examApi from '@/api/exam.api';

interface Question {
  id?: string;
  content: string;
  type: string;
  options: string[];
  correctAnswer: number;
  image?: string; // base64 image data
}

interface ExamData {
  title: string;
  description?: string;
  duration?: number;
  passingPercentage?: number;
  questions?: Question[];
  examType?: 'exercise' | 'test'; // 'exercise' = can retake & see answers, 'test' = one time only
}

export default function EditComposedExamPage() {
  const router = useRouter();
  const [examData, setExamData] = useState<ExamData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    // Get composed exam from session storage
    const composedExam = sessionStorage.getItem('composedExam');
    if (composedExam) {
      try {
        const exam = JSON.parse(composedExam);
        setExamData({
          ...exam,
          examType: exam.examType || 'exercise', // Default to exercise
        });
      } catch (err) {
        setError('Lỗi khi tải dữ liệu đề');
      }
    }
  }, []);

  const handleCreateExam = async () => {
    if (!examData?.title.trim()) {
      setError('Vui lòng nhập tên đề');
      return;
    }

    if (!examData?.questions || examData.questions.length === 0) {
      setError('Vui lòng thêm ít nhất một câu hỏi');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const payload = {
        title: examData.title,
        description: examData.description || '',
        duration: examData.duration || 60,
        passingPercentage: examData.passingPercentage || 50,
        examType: examData.examType || 'exercise', // exercise or test
        questions: examData.questions.map((q) => ({
          content: q.content,
          type: q.type || 'MULTIPLE_CHOICE',
          // Convert string array + correctAnswer index to object array {text, isCorrect}
          options: (q.options || []).map((opt, idx) => ({
            text: opt,
            isCorrect: idx === q.correctAnswer,
          })),
          image: q.image, // Include image if provided
        })),
      };

      // Call API to create exam with questions
      await examApi.createExamWithQuestions(payload);
      
      // Clear session storage
      sessionStorage.removeItem('composedExam');
      
      setSuccess('✓ Đề đã được tạo thành công!');
      setTimeout(() => {
        router.push('/teacher/exams/list');
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Lỗi khi tạo đề');
      console.error('Error creating exam:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!examData) {
    return (
      <TeacherLayout>
        <div className="flex items-center justify-center min-h-96">
          <div className="text-gray-500">Đang tải...</div>
        </div>
      </TeacherLayout>
    );
  }

  return (
    <TeacherLayout>
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => router.back()}
          className="text-blue-600 hover:text-blue-700 font-semibold mb-6"
        >
          ← Quay lại
        </button>

        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            Xác nhận tạo đề
          </h1>

          {/* Exam Title */}
          <div className="mb-6">
            <label className="block text-gray-700 font-semibold mb-3">
              Tên đề
            </label>
            <input
              type="text"
              value={examData.title}
              onChange={(e) =>
                setExamData({ ...examData, title: e.target.value })
              }
              className="w-full border rounded-lg p-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Exam Description */}
          <div className="mb-6">
            <label className="block text-gray-700 font-semibold mb-3">
              Mô tả
            </label>
            <textarea
              value={examData.description || ''}
              onChange={(e) =>
                setExamData({ ...examData, description: e.target.value })
              }
              placeholder="Nhập mô tả đề (tùy chọn)"
              rows={3}
              className="w-full border rounded-lg p-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* Duration and Passing Percentage */}
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-gray-700 font-semibold mb-3">
                Thời gian (phút)
              </label>
              <input
                type="number"
                value={examData.duration || 60}
                onChange={(e) =>
                  setExamData({
                    ...examData,
                    duration: parseInt(e.target.value) || 60,
                  })
                }
                min="1"
                className="w-full border rounded-lg p-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-gray-700 font-semibold mb-3">
                Điểm đạt (%)
              </label>
              <input
                type="number"
                value={examData.passingPercentage || 50}
                onChange={(e) =>
                  setExamData({
                    ...examData,
                    passingPercentage: parseInt(e.target.value) || 50,
                  })
                }
                min="0"
                max="100"
                className="w-full border rounded-lg p-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Exam Type */}
          <div className="mb-6">
            <label className="block text-gray-700 font-semibold mb-3">
              Loại đề
            </label>
            <div className="grid grid-cols-2 gap-4">
              <label className={`relative border-2 rounded-lg p-4 cursor-pointer transition ${
                examData.examType === 'exercise' 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-300 bg-white hover:border-gray-400'
              }`}>
                <input
                  type="radio"
                  name="examType"
                  value="exercise"
                  checked={examData.examType === 'exercise'}
                  onChange={(e) =>
                    setExamData({ ...examData, examType: 'exercise' as const })
                  }
                  className="absolute top-4 right-4 w-5 h-5"
                />
                <div className="pr-8">
                  <h4 className="font-semibold text-gray-900 mb-1">📚 Bài tập</h4>
                  <p className="text-sm text-gray-600">
                    • Học sinh có thể làm lại nhiều lần
                    <br />
                    • Xem đáp án sau khi hoàn thành
                  </p>
                </div>
              </label>

              <label className={`relative border-2 rounded-lg p-4 cursor-pointer transition ${
                examData.examType === 'test' 
                  ? 'border-red-500 bg-red-50' 
                  : 'border-gray-300 bg-white hover:border-gray-400'
              }`}>
                <input
                  type="radio"
                  name="examType"
                  value="test"
                  checked={examData.examType === 'test'}
                  onChange={(e) =>
                    setExamData({ ...examData, examType: 'test' as const })
                  }
                  className="absolute top-4 right-4 w-5 h-5"
                />
                <div className="pr-8">
                  <h4 className="font-semibold text-gray-900 mb-1">✏️ Bài kiểm tra</h4>
                  <p className="text-sm text-gray-600">
                    • Học sinh chỉ làm được một lần
                    <br />
                    • Không xem được đáp án
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Questions Summary */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
            <h3 className="font-semibold text-gray-900 mb-3">
              📋 Tóm tắt đề
            </h3>
            <ul className="space-y-2 text-gray-700">
              <li>
                <span className="font-semibold">Số câu hỏi:</span>{' '}
                {examData.questions?.length || 0}
              </li>
              <li>
                <span className="font-semibold">Thời gian:</span>{' '}
                {examData.duration || 60} phút
              </li>
              <li>
                <span className="font-semibold">Điểm đạt:</span>{' '}
                {examData.passingPercentage || 50}%
              </li>
            </ul>
          </div>

          {/* Questions List */}
          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-3">
              📝 Danh sách câu hỏi
            </h3>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {(examData.questions || []).map((q, idx) => (
                <div
                  key={idx}
                  className="border rounded-lg p-4 bg-gray-50 hover:bg-gray-100 transition"
                >
                  <p className="font-semibold text-gray-900">
                    Câu {idx + 1}: {q.content}
                  </p>
                  <p className="text-sm text-gray-600 mt-2">
                    {q.type === 'MULTIPLE_CHOICE' && '📝 Trắc nghiệm'}
                    {q.type === 'FILL_IN_BLANK' && '📄 Điền từ'}
                    {q.type === 'PRONUNCIATION' && '🔊 Phát âm'}
                    {q.options && q.options.length > 0 && (
                      <span className="ml-2">
                        ({q.options.length} tùy chọn)
                      </span>
                    )}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Messages */}
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

          {/* Action Buttons */}
          <div className="flex gap-4">
            <button
              onClick={() => router.back()}
              className="flex-1 border border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-50 transition"
            >
              ← Quay lại chỉnh sửa
            </button>
            <button
              onClick={handleCreateExam}
              disabled={loading}
              className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {loading ? '💾 Đang tạo...' : '✓ Tạo đề'}
            </button>
          </div>
        </div>
      </div>
    </TeacherLayout>
  );
}
