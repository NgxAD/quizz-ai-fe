'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import TeacherLayout from '@/layouts/TeacherLayout';
import examApi from '@/api/exam.api';

interface Question {
  id: string;
  content: string;
  type: 'MULTIPLE_CHOICE' | 'ESSAY';
  options: string[];
  correctAnswer: number;
}

export default function ComposeExamPage() {
  const router = useRouter();
  const [examTitle, setExamTitle] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<Partial<Question>>({
    type: 'MULTIPLE_CHOICE',
    options: ['', '', '', ''],
    correctAnswer: 0,
  });
  const [selectedQuestionId, setSelectedQuestionId] = useState<string | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Generate unique ID
  const generateId = () => {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };

  // Load saved data from sessionStorage on page load
  useEffect(() => {
    try {
      const savedExam = sessionStorage.getItem('composedExam');
      if (savedExam) {
        const exam = JSON.parse(savedExam);
        setExamTitle(exam.title || '');
        setQuestions(exam.questions || []);
      }
    } catch (err) {
      console.error('Error loading saved exam:', err);
    }
  }, []);

  // Save data to sessionStorage whenever it changes
  useEffect(() => {
    if (examTitle || questions.length > 0) {
      const payload = {
        title: examTitle,
        questions,
      };
      sessionStorage.setItem('composedExam', JSON.stringify(payload));
    }
  }, [examTitle, questions]);

  const addQuestion = () => {
    if (!currentQuestion.content?.trim()) {
      setError('Vui lòng nhập nội dung câu hỏi');
      return;
    }

    const filledOptions = (currentQuestion.options || []).filter(
      (opt) => opt.trim(),
    );
    if (filledOptions.length < 2) {
      setError('Vui lòng nhập ít nhất 2 tùy chọn');
      return;
    }

    const question: Question = {
      id: generateId(),
      content: currentQuestion.content || '',
      type: currentQuestion.type || 'MULTIPLE_CHOICE',
      options: currentQuestion.options || [],
      correctAnswer: currentQuestion.correctAnswer || 0,
    };

    setQuestions([...questions, question]);
    setCurrentQuestion({
      type: 'MULTIPLE_CHOICE',
      options: ['', '', '', ''],
      correctAnswer: 0,
    });
    setError('');
    setSuccess('✓ Đã thêm câu hỏi');
    setTimeout(() => setSuccess(''), 2000);
  };

  const updateQuestion = (id: string) => {
    const existingQuestion = questions.find((q) => q.id === id);
    if (existingQuestion) {
      setCurrentQuestion(existingQuestion);
      setSelectedQuestionId(id);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const saveQuestion = () => {
    if (!currentQuestion.content?.trim()) {
      setError('Vui lòng nhập nội dung câu hỏi');
      return;
    }

    if (selectedQuestionId) {
      const updatedQuestions = questions.map((q) =>
        q.id === selectedQuestionId
          ? ({
              ...q,
              content: currentQuestion.content || '',
              type: currentQuestion.type || 'MULTIPLE_CHOICE',
              options: currentQuestion.options || [],
              correctAnswer: currentQuestion.correctAnswer || 0,
            } as Question)
          : q,
      );
      setQuestions(updatedQuestions);
      setSelectedQuestionId(null);
      setCurrentQuestion({
        type: 'MULTIPLE_CHOICE',
        options: ['', '', '', ''],
        correctAnswer: 0,
      });
      setSuccess('✓ Đã cập nhật câu hỏi');
      setTimeout(() => setSuccess(''), 2000);
    } else {
      addQuestion();
    }
    setError('');
  };

  const removeQuestion = (id: string) => {
    setQuestions(questions.filter((q) => q.id !== id));
    if (selectedQuestionId === id) {
      setSelectedQuestionId(null);
      setCurrentQuestion({
        type: 'MULTIPLE_CHOICE',
        options: ['', '', '', ''],
        correctAnswer: 0,
      });
    }
  };



  const handleSaveExam = async () => {
    if (!examTitle.trim()) {
      setError('Vui lòng nhập tên đề');
      return;
    }

    if (questions.length === 0) {
      setError('Vui lòng thêm ít nhất một câu hỏi');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        title: examTitle,
        description: '',
        duration: 60,
        passingPercentage: 50,
        questions: questions.map((q) => ({
          content: q.content,
          options: q.options,
          correctAnswer: q.correctAnswer,
          type: q.type,
        })),
      };

      sessionStorage.setItem('composedExam', JSON.stringify(payload));
      router.push('/teacher/exams/edit-composed');
    } catch (err: any) {
      setError(err.message || 'Lỗi khi lưu đề');
    } finally {
      setLoading(false);
    }
  };

  return (
    <TeacherLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <button
              onClick={() => router.back()}
              className="text-blue-600 hover:text-blue-700 font-semibold mb-3"
            >
              ← Quay lại
            </button>
            <h1 className="text-3xl font-bold text-gray-900">
              Tự soạn đề thi
            </h1>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-600 mb-2">
              Số câu hỏi: <span className="font-bold text-lg">{questions.length}</span>
            </div>
            <button
              onClick={handleSaveExam}
              disabled={loading || questions.length === 0}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {loading ? 'Đang lưu...' : 'Lưu đề'}
            </button>
          </div>
        </div>

        {/* Exam Title */}
        <div className="bg-white rounded-lg shadow p-4">
          <label className="block text-gray-700 font-semibold mb-2">
            Tên đề <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={examTitle}
            onChange={(e) => setExamTitle(e.target.value)}
            placeholder="Nhập tên đề"
            className="w-full border rounded-lg p-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-3 gap-6">
          {/* Left Panel - Question Input */}
          <div className="col-span-2 space-y-6">
            <div className="bg-white rounded-lg shadow p-6 space-y-4">
              <h3 className="text-lg font-bold text-gray-900">
                {selectedQuestionId ? 'Chỉnh sửa câu hỏi' : 'Thêm câu hỏi'}
              </h3>

              {/* Question Content */}
              <div>
                <label className="block text-gray-700 font-semibold mb-2">
                  Nội dung câu hỏi
                </label>
                <textarea
                  value={currentQuestion.content || ''}
                  onChange={(e) =>
                    setCurrentQuestion({
                      ...currentQuestion,
                      content: e.target.value,
                    })
                  }
                  placeholder="Nhập nội dung câu hỏi"
                  rows={4}
                  className="w-full border rounded-lg p-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              {/* Options */}
              {currentQuestion.type === 'MULTIPLE_CHOICE' && (
                <div>
                  <label className="block text-gray-700 font-semibold mb-3">
                    Các tùy chọn
                  </label>
                  <div className="space-y-2">
                    {(currentQuestion.options || []).map((opt, idx) => (
                      <div key={idx} className="flex items-center gap-3">
                        <span className="w-8 h-8 flex items-center justify-center bg-blue-100 rounded font-semibold text-blue-700 flex-shrink-0">
                          {String.fromCharCode(65 + idx)}
                        </span>
                        <input
                          type="text"
                          value={opt}
                          onChange={(e) => {
                            const newOptions = [
                              ...(currentQuestion.options || []),
                            ];
                            newOptions[idx] = e.target.value;
                            setCurrentQuestion({
                              ...currentQuestion,
                              options: newOptions,
                            });
                          }}
                          placeholder={`Tùy chọn ${String.fromCharCode(65 + idx)}`}
                          className="flex-1 border rounded-lg p-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <input
                          type="radio"
                          name="correct"
                          checked={currentQuestion.correctAnswer === idx}
                          onChange={() =>
                            setCurrentQuestion({
                              ...currentQuestion,
                              correctAnswer: idx,
                            })
                          }
                          title="Chọn đáp án đúng"
                          className="w-5 h-5 cursor-pointer flex-shrink-0"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={saveQuestion}
                  className="flex-1 bg-blue-600 text-white px-4 py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
                >
                    {selectedQuestionId ? 'Cập nhật câu hỏi' : 'Thêm câu hỏi'}
                </button>
                {selectedQuestionId && (
                  <button
                    onClick={() => {
                      setSelectedQuestionId(null);
                      setCurrentQuestion({
                        type: 'MULTIPLE_CHOICE',
                        options: ['', '', '', ''],
                        correctAnswer: 0,
                      });
                    }}
                    className="flex-1 border border-gray-300 text-gray-700 px-4 py-3 rounded-lg font-semibold hover:bg-gray-50 transition"
                  >
                    Hủy chỉnh sửa
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Right Panel - Question Preview and List */}
          <div className="space-y-6">
            {/* Question Preview */}
            {currentQuestion.content && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  Xem trước
                </h3>
                <div className="space-y-4">
                  <div className="bg-blue-50 border-l-4 border-blue-600 p-4 rounded">
                    <p className="font-semibold text-gray-900">
                      {currentQuestion.content}
                    </p>
                  </div>

                  {/* Preview Options */}
                  {currentQuestion.type === 'MULTIPLE_CHOICE' && (
                    <div className="space-y-2">
                      {(currentQuestion.options || []).map(
                        (opt, idx) =>
                          opt && (
                            <div
                              key={idx}
                              className={`flex items-center gap-3 p-3 rounded-lg border transition ${
                                currentQuestion.correctAnswer === idx
                                  ? 'bg-green-50 border-green-300'
                                  : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                              }`}
                            >
                              <span className="font-semibold text-gray-700 w-6">
                                {String.fromCharCode(65 + idx)})
                              </span>
                              <span className="text-gray-700">{opt}</span>
                              {currentQuestion.correctAnswer === idx && (
                                <span className="ml-auto text-green-600 font-bold">
                                  Đúng
                                </span>
                              )}
                            </div>
                          ),
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Questions List */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                Danh sách câu hỏi ({questions.length})
              </h3>

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {questions.length === 0 ? (
                  <p className="text-gray-500 text-center py-6 text-sm">
                    Chưa có câu hỏi nào
                  </p>
                ) : (
                  questions.map((q, idx) => (
                    <div
                      key={q.id}
                      className={`border rounded-lg p-3 transition cursor-pointer ${
                        selectedQuestionId === q.id
                          ? 'bg-blue-50 border-blue-400'
                          : 'bg-gray-50 hover:bg-gray-100 border-gray-200'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div
                          className="flex-1"
                          onClick={() => updateQuestion(q.id)}
                        >
                          <p className="font-semibold text-gray-900 text-sm">
                            Câu {idx + 1}
                          </p>
                          <p className="text-sm text-gray-600 truncate">
                            {q.content}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Trắc nghiệm
                          </p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeQuestion(q.id);
                          }}
                          className="text-red-600 hover:text-red-700 font-bold flex-shrink-0"
                          title="Xóa"
                        >
                          X
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Messages */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
                {error}
              </div>
            )}
            {success && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded text-sm">
                {success}
              </div>
            )}
          </div>
        </div>
      </div>
    </TeacherLayout>
  );
}
