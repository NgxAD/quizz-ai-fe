'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import TeacherLayout from '@/layouts/TeacherLayout';
import examApi from '@/api/exam.api';

interface Question {
  content: string;
  options: string[];
  correctAnswer: number;
}

export default function EditContentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [content, setContent] = useState('');
  const [examData, setExamData] = useState({
    title: '',
    description: '',
    duration: '',
    passingPercentage: '',
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [hasEdited, setHasEdited] = useState(false);

  useEffect(() => {
    // Get data from session storage or URL params
    const savedData = sessionStorage.getItem('fileContent');
    const savedExamData = sessionStorage.getItem('examData');
    
    if (savedData) {
      setContent(savedData);
      setQuestions(JSON.parse(sessionStorage.getItem('extractedQuestions') || '[]'));
    } else {
      router.push('/teacher/exams/create');
    }

    if (savedExamData) {
      setExamData(JSON.parse(savedExamData));
    }

    return () => {
      // Cleanup
    };
  }, [router]);

  const handleExtractQuestions = async () => {
    if (!content.trim()) {
      setError('Vui lòng nhập nội dung');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await examApi.extractQuestionsFromText(content);
      if (response.data.success) {
        setQuestions(response.data.questions);
        setShowPreview(true);
        setHasEdited(false);
      }
    } catch (err: any) {
      console.error('Error extracting questions:', err.response?.data);
      setError(
        err.response?.data?.message ||
          'Không thể phân tích câu hỏi. Vui lòng kiểm tra định dạng.',
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCreateExam = async () => {
    if (!examData.title.trim()) {
      setError('Vui lòng nhập tên đề');
      return;
    }

    if (questions.length === 0) {
      setError('Không có câu hỏi. Vui lòng phân tích nội dung');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Create exam with extracted questions
      const response = await examApi.createExamWithQuestions({
        title: examData.title,
        description: examData.description,
        duration: examData.duration ? parseInt(examData.duration) : undefined,
        passingPercentage: examData.passingPercentage
          ? parseInt(examData.passingPercentage)
          : undefined,
        questions: questions,
      });

      sessionStorage.removeItem('fileContent');
      sessionStorage.removeItem('examData');
      sessionStorage.removeItem('extractedQuestions');
      
      router.push('/teacher/exams/list');
    } catch (err: any) {
      console.error('Error creating exam:', err.response?.data);
      setError(err.response?.data?.message || 'Tạo đề thất bại');
    } finally {
      setLoading(false);
    }
  };

  const handleGoBack = () => {
    if (hasEdited && !window.confirm('Bạn chưa lưu thay đổi. Bạn có chắc muốn quay lại?')) {
      return;
    }
    router.back();
  };

  return (
    <TeacherLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">✏️ Soạn thảo nội dung đề thi</h1>
          <button
            onClick={handleGoBack}
            className="text-gray-600 hover:text-gray-900 text-2xl"
          >
            ←
          </button>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Content Editor */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow p-6 space-y-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-3">📝 Nội dung đề thi</h2>
                <textarea
                  value={content}
                  onChange={(e) => {
                    setContent(e.target.value);
                    setHasEdited(true);
                  }}
                  placeholder="Dán nội dung đề thi ở đây...
                  
Định dạng:
1. Câu hỏi 1?
A) Đáp án A
B) Đáp án B
C) Đáp án C
D) Đáp án D
Answer: A

2. Câu hỏi 2?
A) Đáp án A
B) Đáp án B
C) Đáp án C
D) Đáp án D
Đáp án: B"
                  className="w-full border border-gray-300 rounded p-4 text-gray-900 placeholder-gray-400 font-mono text-sm min-h-96 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded p-4 text-sm text-gray-700 space-y-2">
                <p className="font-semibold text-blue-900">💡 Hướng dẫn định dạng:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Mỗi câu hỏi bắt đầu bằng số: <code className="bg-white px-1">"1."</code></li>
                  <li>Theo sau là nội dung câu hỏi</li>
                  <li>Các đáp án viết theo định dạng: <code className="bg-white px-1">A) Nội dung</code></li>
                  <li>Xác định đáp án đúng: <code className="bg-white px-1">Answer: A</code> hoặc <code className="bg-white px-1">Đáp án: A</code></li>
                  <li>Mỗi câu hỏi phải có ít nhất 2 đáp án</li>
                </ul>
              </div>

              <button
                onClick={handleExtractQuestions}
                disabled={loading || !content.trim()}
                className="w-full bg-indigo-600 text-white px-4 py-3 rounded hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-semibold"
              >
                {loading ? '⏳ Đang phân tích...' : '🔍 Phân tích câu hỏi'}
              </button>
            </div>
          </div>

          {/* Exam Info Panel */}
          <div>
            <div className="bg-white rounded-lg shadow p-6 space-y-4 sticky top-20">
              <h2 className="text-lg font-bold text-gray-900">📋 Thông tin đề thi</h2>

              <div>
                <label className="block text-gray-700 font-semibold mb-2 text-sm">
                  Tên đề <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={examData.title}
                  onChange={(e) =>
                    setExamData({ ...examData, title: e.target.value })
                  }
                  placeholder="Nhập tên"
                  className="w-full border rounded p-2 text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-2 text-sm">
                  Mô tả
                </label>
                <textarea
                  value={examData.description}
                  onChange={(e) =>
                    setExamData({ ...examData, description: e.target.value })
                  }
                  placeholder="Mô tả (tuỳ chọn)"
                  className="w-full border rounded p-2 text-gray-900 placeholder-gray-400 text-sm resize-none h-20 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-2 text-sm">
                  Thời gian (phút)
                </label>
                <input
                  type="number"
                  value={examData.duration}
                  onChange={(e) =>
                    setExamData({ ...examData, duration: e.target.value })
                  }
                  placeholder="60"
                  className="w-full border rounded p-2 text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-2 text-sm">
                  Điểm đạt (%)
                </label>
                <input
                  type="number"
                  value={examData.passingPercentage}
                  onChange={(e) =>
                    setExamData({
                      ...examData,
                      passingPercentage: e.target.value,
                    })
                  }
                  placeholder="70"
                  min="0"
                  max="100"
                  className="w-full border rounded p-2 text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="bg-blue-50 rounded p-3 text-xs text-gray-700">
                <p className="font-semibold text-blue-900 mb-2">📊 Thống kê</p>
                <p>
                  Câu hỏi tìm thấy:{' '}
                  <span className="font-bold text-blue-600">{questions.length}</span>
                </p>
              </div>

              <button
                onClick={handleCreateExam}
                disabled={
                  loading ||
                  !examData.title.trim() ||
                  questions.length === 0
                }
                className="w-full bg-green-600 text-white px-4 py-3 rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-semibold"
              >
                {loading ? '⏳ Đang tạo...' : '✓ Tạo đề thi'}
              </button>
            </div>
          </div>
        </div>

        {/* Questions Preview */}
        {showPreview && questions.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6 space-y-4">
            <h2 className="text-xl font-bold text-gray-900">
              ✓ {questions.length} Câu hỏi được phát hiện
            </h2>

            <div className="space-y-4 max-h-96 overflow-auto">
              {questions.map((q, idx) => (
                <div key={idx} className="bg-blue-50 border border-blue-200 rounded p-4">
                  <p className="font-semibold text-gray-900 mb-2">
                    Câu {idx + 1}: {q.content}
                  </p>
                  <ul className="ml-4 space-y-1 text-sm text-gray-700">
                    {q.options.map((opt, oIdx) => (
                      <li
                        key={oIdx}
                        className={
                          oIdx === q.correctAnswer
                            ? 'text-green-600 font-semibold'
                            : ''
                        }
                      >
                        {String.fromCharCode(65 + oIdx)}) {opt}
                        {oIdx === q.correctAnswer && ' ✓'}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <p className="text-sm text-gray-600 text-center">
              Chỉnh sửa nội dung ở trên và nhấn "Phân tích câu hỏi" để cập nhật danh sách
            </p>
          </div>
        )}
      </div>
    </TeacherLayout>
  );
}
