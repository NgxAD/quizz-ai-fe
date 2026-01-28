'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import TeacherLayout from '@/layouts/TeacherLayout';
import aiApi from '@/api/ai.api';

interface GeneratedQuestion {
  _id?: string;
  content: string;
  type: string;
  level: string;
  options?: Array<{ text: string; isCorrect: boolean }>;
  explanation: string;
  isActive: boolean;
}

export default function GenerateAIPage() {
  const router = useRouter();
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [generatedQuestions, setGeneratedQuestions] = useState<GeneratedQuestion[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [quizInfo, setQuizInfo] = useState({ quizId: '', quizTitle: '' });
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    setShowPreview(false);

    try {
      if (!prompt.trim()) {
        setError('Vui lòng nhập prompt để tạo đề thi');
        setLoading(false);
        return;
      }

      const response = await aiApi.generateQuestions({
        customPrompt: prompt,
        language: 'vi',
      });

      setGeneratedQuestions(response.data.questions || []);
      setQuizInfo({
        quizId: response.data.quizId,
        quizTitle: response.data.quizTitle,
      });
      setSuccess(
        `Đã sinh ${response.data.count} câu hỏi thành công. Bấm "Lưu" để lưu vào hệ thống.`,
      );
      setShowPreview(true);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Lỗi không xác định';
      setError(`Lỗi: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveQuestions = async () => {
    if (!quizInfo.quizId) {
      setError('Không có quizId. Vui lòng tạo đề lại.');
      return;
    }

    setIsSaving(true);
    setError('');

    try {
      const response = await aiApi.saveQuestions({
        quizId: quizInfo.quizId,
        questions: generatedQuestions,
      });

      setSuccess(`✓ Đã lưu ${response.data.count} câu hỏi thành công!`);
      setGeneratedQuestions([]);
      setShowPreview(false);

      // Redirect to questions management after 2 seconds
      setTimeout(() => {
        router.push('/teacher/questions');
      }, 2000);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Lỗi không xác định';
      setError(`Lỗi: ${errorMessage}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <TeacherLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">Tạo đề thi bằng AI</h1>

        {/* Form */}
        <div className="bg-white rounded-lg shadow p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
                {success}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nhập yêu cầu tạo đề <span className="text-red-600">*</span>
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Ví dụ:&#10;- Tạo 20 câu hỏi trắc nghiệm về Tiếng Anh lớp 10, độ khó trung bình&#10;- Tạo đề thi Toán 12 về phương trình bậc 2, 15 câu, có giải thích chi tiết&#10;- Tạo 5 câu về di truyền tập trung vào quy luật Mendel&#10;&#10;Hệ thống sẽ tự động tạo đề hoàn chỉnh dựa trên yêu cầu của bạn."
                rows={8}
                className="w-full border-2 border-gray-300 rounded-lg p-3 text-black placeholder-gray-400 focus:border-blue-500 focus:outline-none resize-none"
                required
              />
              <p className="text-sm text-gray-500 mt-2">
                💡 Nhập yêu cầu tương tự như dùng ChatGPT. Hệ thống sẽ tự động tạo đề thi, câu hỏi và giải thích.
              </p>
            </div>
            <button
              type="submit"
              disabled={loading || !prompt.trim()}
              className={`w-full px-4 py-3 rounded-lg font-bold text-lg transition ${
                loading || !prompt.trim()
                  ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800'
              }`}
            >
              {loading ? '⏳ Đang tạo đề thi...' : '🚀 Tạo đề thi'}
            </button>
          </form>
        </div>

        {/* Preview Generated Questions */}
        {showPreview && generatedQuestions.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Xem trước câu hỏi ({generatedQuestions.length} câu)
            </h2>
            <div className="space-y-6">
              {generatedQuestions.map((question, index) => (
                <div key={question._id || index} className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Câu {index + 1}: {question.content}
                    </h3>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        question.level === 'easy'
                          ? 'bg-green-100 text-green-800'
                          : question.level === 'medium'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {question.level === 'easy'
                        ? 'Dễ'
                        : question.level === 'medium'
                          ? 'Trung bình'
                          : 'Khó'}
                    </span>
                  </div>

                  {question.options && question.options.length > 0 && (
                    <div className="mb-3">
                      <p className="text-sm font-medium text-gray-700 mb-2">Lựa chọn:</p>
                      <ul className="space-y-1">
                        {question.options.map((option, optionIndex) => (
                          <li
                            key={optionIndex}
                            className={`text-sm p-2 rounded ${
                              option.isCorrect
                                ? 'bg-green-100 text-green-900'
                                : 'bg-white text-gray-700'
                            }`}
                          >
                            {String.fromCharCode(65 + optionIndex)}. {option.text}
                            {option.isCorrect && <span className="ml-2 font-bold">✓</span>}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {question.explanation && (
                    <div className="bg-blue-50 border-l-4 border-blue-500 p-3 rounded">
                      <p className="text-sm text-blue-900">
                        <strong>Giải thích:</strong> {question.explanation}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-6 flex gap-4">
              <button
                onClick={() => {
                  setSuccess('');
                  setGeneratedQuestions([]);
                  setShowPreview(false);
                }}
                className="px-4 py-2 border rounded font-medium text-gray-700 hover:bg-gray-50"
              >
                Tạo lại
              </button>
              <button
                onClick={handleSaveQuestions}
                disabled={isSaving}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded font-medium hover:bg-blue-700 disabled:bg-gray-400"
              >
                {isSaving ? '⏳ Đang lưu...' : '💾 Lưu vào hệ thống'}
              </button>
              <button
                onClick={() => router.push('/teacher/questions')}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded font-medium hover:bg-green-700"
              >
                Quản lý câu hỏi
              </button>
            </div>
          </div>
        )}
      </div>
    </TeacherLayout>
  );
}
