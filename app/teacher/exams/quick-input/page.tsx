'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import TeacherLayout from '@/layouts/TeacherLayout';
import examApi from '@/api/exam.api';

interface ParsedQuestion {
  content: string;
  options: string[];
  correctAnswer: number;
}

export default function QuickInputExamPage() {
  const router = useRouter();
  const [step, setStep] = useState<'input' | 'preview'>('input');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    duration: '',
    passingPercentage: '',
  });
  const [textContent, setTextContent] = useState('');
  const [questions, setQuestions] = useState<ParsedQuestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingQuestion, setEditingQuestion] = useState<number | null>(null);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleExtractQuestions = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!textContent.trim()) {
        setError('Vui lòng nhập nội dung đề thi');
        setLoading(false);
        return;
      }

      const response = await examApi.extractQuestionsFromText(textContent);
      
      setQuestions(response.data.questions);
      setSuccess(`Tìm thấy ${response.data.questionsFound} câu hỏi`);
      setStep('preview');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Lỗi phân tích câu hỏi');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateQuestion = (index: number, updatedQuestion: ParsedQuestion) => {
    const newQuestions = [...questions];
    newQuestions[index] = updatedQuestion;
    setQuestions(newQuestions);
    setEditingQuestion(null);
  };

  const handleDeleteQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (!formData.title.trim()) {
        setError('Vui lòng nhập tên đề');
        setLoading(false);
        return;
      }

      if (questions.length === 0) {
        setError('Vui lòng có ít nhất một câu hỏi');
        setLoading(false);
        return;
      }

      const payload = {
        title: formData.title,
        description: formData.description,
        duration: formData.duration ? parseInt(formData.duration) : 60,
        passingPercentage: formData.passingPercentage ? parseInt(formData.passingPercentage) : 50,
        questions: questions.map((q) => ({
          content: q.content,
          options: q.options,
          correctAnswer: q.correctAnswer,
        })),
      };

      const response = await examApi.createExamWithQuestions(payload);

      setSuccess('Tạo đề thành công');
      setTimeout(() => {
        router.push(`/teacher/exams/${response.data._id}/edit`);
      }, 1000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Lỗi tạo đề');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setStep('input');
    setTextContent('');
    setQuestions([]);
    setFormData({
      title: '',
      description: '',
      duration: '',
      passingPercentage: '',
    });
    setError('');
    setSuccess('');
  };

  return (
    <TeacherLayout>
      <div className="max-w-6xl mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">📝 Nhập đề nhanh</h1>
          <p className="text-gray-600">Dán hoặc gõ nội dung đề thi, hệ thống sẽ tự động phân tích</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            <strong>Lỗi:</strong> {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">
            ✓ {success}
          </div>
        )}

        {step === 'input' ? (
          <form onSubmit={handleExtractQuestions} className="bg-white rounded-lg shadow-md p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tên đề <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleFormChange}
                  placeholder="Nhập tên đề"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Mô tả</label>
                <input
                  type="text"
                  name="description"
                  value={formData.description}
                  onChange={handleFormChange}
                  placeholder="Nhập mô tả (tùy chọn)"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Thời gian (phút)</label>
                <input
                  type="number"
                  name="duration"
                  value={formData.duration}
                  onChange={handleFormChange}
                  placeholder="60"
                  min="1"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Điểm đạt (%)</label>
                <input
                  type="number"
                  name="passingPercentage"
                  value={formData.passingPercentage}
                  onChange={handleFormChange}
                  placeholder="70"
                  min="0"
                  max="100"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nội dung đề thi <span className="text-red-500">*</span>
              </label>
              <textarea
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                placeholder={`Dán hoặc gõ nội dung đề thi. Ví dụ:

1. Thủ đô của Việt Nam là?
A) Hà Nội
B) TP. Hồ Chí Minh
C) Đà Nẵng
D) Huế
Đáp án: A

2. Năm 1945 có sự kiện gì quan trọng?
A) Cách mạng Tháng Tám
B) Chiến tranh Thế giới 2 kết thúc
C) Thành lập Liên Hiệp Quốc
D) Tất cả đều đúng
Đáp án: D`}
                rows={12}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="mt-2 text-xs text-gray-500">
                📌 Định dạng hỗ trợ: "1. Câu hỏi?" hoặc "Câu 1:" với các đáp án (A, B, C, D) và "Đáp án:" hoặc "Answer:"
              </p>
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 text-white py-2 px-6 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Đang phân tích...' : '▶ Phân tích câu hỏi'}
              </button>
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Hủy
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleCreateExam} className="bg-white rounded-lg shadow-md p-6">
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">
                  ✓ Tìm thấy {questions.length} câu hỏi
                </h2>
                <button
                  type="button"
                  onClick={() => setStep('input')}
                  className="text-blue-600 hover:underline"
                >
                  Quay lại chỉnh sửa
                </button>
              </div>

              <div className="space-y-4">
                {questions.map((question, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                    {editingQuestion === index ? (
                      <QuestionEditor
                        question={question}
                        onSave={(updated) => handleUpdateQuestion(index, updated)}
                        onCancel={() => setEditingQuestion(null)}
                      />
                    ) : (
                      <>
                        <div className="mb-3">
                          <p className="font-semibold text-gray-700">
                            Câu {index + 1}: {question.content}
                          </p>
                        </div>
                        <div className="space-y-2 mb-3">
                          {question.options.map((option, optIdx) => (
                            <div
                              key={optIdx}
                              className={`p-2 rounded ${
                                optIdx === question.correctAnswer
                                  ? 'bg-green-100 border border-green-300'
                                  : 'bg-gray-100'
                              }`}
                            >
                              <span className="font-medium">
                                {String.fromCharCode(65 + optIdx)})
                              </span>{' '}
                              {option}
                              {optIdx === question.correctAnswer && (
                                <span className="ml-2 text-green-700 font-semibold">✓ Đáp án</span>
                              )}
                            </div>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setEditingQuestion(index)}
                            className="text-blue-600 hover:underline text-sm"
                          >
                            ✏ Sửa
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteQuestion(index)}
                            className="text-red-600 hover:underline text-sm"
                          >
                            🗑 Xóa
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={loading || questions.length === 0}
                className="flex-1 bg-green-600 text-white py-2 px-6 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? 'Đang tạo...' : '✓ Tạo đề'}
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Nhập lại
              </button>
            </div>
          </form>
        )}
      </div>
    </TeacherLayout>
  );
}

function QuestionEditor({
  question,
  onSave,
  onCancel,
}: {
  question: ParsedQuestion;
  onSave: (updated: ParsedQuestion) => void;
  onCancel: () => void;
}) {
  const [edited, setEdited] = useState(question);

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...edited.options];
    newOptions[index] = value;
    setEdited({ ...edited, options: newOptions });
  };

  const handleCorrectAnswerChange = (index: number) => {
    setEdited({ ...edited, correctAnswer: index });
  };

  return (
    <div>
      <div className="mb-3">
        <label className="block text-sm font-medium text-gray-700 mb-1">Câu hỏi</label>
        <input
          type="text"
          value={edited.content}
          onChange={(e) => setEdited({ ...edited, content: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded"
        />
      </div>

      <div className="space-y-2 mb-3">
        {edited.options.map((option, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <input
              type="radio"
              name="correctAnswer"
              checked={edited.correctAnswer === idx}
              onChange={() => handleCorrectAnswerChange(idx)}
              className="w-4 h-4"
            />
            <label className="text-sm font-medium w-8">
              {String.fromCharCode(65 + idx)})
            </label>
            <input
              type="text"
              value={option}
              onChange={(e) => handleOptionChange(idx, e.target.value)}
              className="flex-1 px-3 py-1 border border-gray-300 rounded text-sm"
            />
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onSave(edited)}
          className="px-4 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
        >
          Lưu
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50"
        >
          Hủy
        </button>
      </div>
    </div>
  );
}
