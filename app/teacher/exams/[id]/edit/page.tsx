'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import TeacherLayout from '@/layouts/TeacherLayout';
import examApi, { Exam as ExamType, Question as QuestionType } from '@/api/exam.api';

interface Exam {
  _id: string;
  title: string;
  description?: string;
  duration?: number;
  passingPercentage?: number;
  questions?: QuestionType[];
}

interface Question {
  _id?: string;
  content: string;
  type: 'multiple-choice' | 'essay' | 'short-answer';
  options?: Array<{ text: string; isCorrect: boolean }>;
  answer?: string;
}

export default function EditExamPage() {
  const router = useRouter();
  const params = useParams();
  const examId = params?.id as string | undefined;

  const [exam, setExam] = useState<Exam | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showAddQuestion, setShowAddQuestion] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const [questionForm, setQuestionForm] = useState<Question>({
    content: '',
    type: 'multiple-choice',
    options: [
      { text: '', isCorrect: false },
      { text: '', isCorrect: false },
      { text: '', isCorrect: false },
      { text: '', isCorrect: false },
    ],
  });

  useEffect(() => {
    // Load exam data
    const loadExam = async () => {
      try {
        const response = await examApi.getById(examId!);
        setExam(response.data);
        
        // Load questions from the exam response
        if (response.data.questions && Array.isArray(response.data.questions)) {
          const loadedQuestions = response.data.questions.map((q: any) => ({
            _id: q._id,
            content: q.content,
            type: q.type || 'multiple-choice',
            options: q.options || [],
            answer: q.correctAnswer || (q.options && q.options.find((opt: any) => opt.isCorrect)?.text),
          }));
          setQuestions(loadedQuestions);
        }
      } catch (err: any) {
        console.error('Error loading exam:', err);
        setError('Không thể tải dữ liệu đề');
      }
    };

    if (examId) {
      loadExam();
    }
  }, [examId]);

  const handleAddQuestion = () => {
    if (!questionForm.content.trim()) {
      setError('Vui lòng nhập nội dung câu hỏi');
      return;
    }

    if (questionForm.type === 'multiple-choice') {
      const validOptions = questionForm.options?.filter(opt => opt.text.trim());
      if (!validOptions || validOptions.length < 2) {
        setError('Câu hỏi trắc nghiệm cần ít nhất 2 đáp án');
        return;
      }

      const hasCorrectAnswer = validOptions.some(opt => opt.isCorrect);
      if (!hasCorrectAnswer) {
        setError('Vui lòng chọn đáp án đúng');
        return;
      }
    }

    setError('');

    if (editingIndex !== null) {
      const updatedQuestions = [...questions];
      updatedQuestions[editingIndex] = questionForm;
      setQuestions(updatedQuestions);
      setEditingIndex(null);
    } else {
      setQuestions([...questions, { ...questionForm, _id: `temp_${Date.now()}` }]);
    }

    // Reset form
    setQuestionForm({
      content: '',
      type: 'multiple-choice',
      options: [
        { text: '', isCorrect: false },
        { text: '', isCorrect: false },
        { text: '', isCorrect: false },
        { text: '', isCorrect: false },
      ],
    });
    setShowAddQuestion(false);
  };

  const handleEditQuestion = (index: number) => {
    setQuestionForm(questions[index]);
    setEditingIndex(index);
    setShowAddQuestion(true);
  };

  const handleDeleteQuestion = (index: number) => {
    if (window.confirm('Bạn có chắc muốn xóa câu hỏi này?')) {
      setQuestions(questions.filter((_, i) => i !== index));
    }
  };

  const handleSaveExam = async () => {
    if (!exam) {
      setError('Không có thông tin đề');
      return;
    }

    if (questions.length === 0) {
      setError('Vui lòng thêm ít nhất một câu hỏi');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Update exam with questions
      await examApi.updateExamWithQuestions(examId!, {
        ...exam,
        questions: questions,
      });

      router.push('/teacher/exams/list');
    } catch (err: any) {
      console.error('Error saving exam:', err);
      setError(err.response?.data?.message || 'Lưu đề thất bại');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (window.confirm('Hủy tạo đề? Thông tin sẽ không được lưu.')) {
      router.push('/teacher/exams/list');
    }
  };

  if (!exam) {
    return (
      <TeacherLayout>
        <div className="text-center py-12">
          <div className="text-gray-500">Đang tải...</div>
        </div>
      </TeacherLayout>
    );
  }

  return (
    <TeacherLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">✏️ Chỉnh sửa đề thi</h1>
          <button
            onClick={handleCancel}
            className="text-gray-600 hover:text-gray-900 text-2xl"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Exam Info */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-2xl">📋</span>
            <h2 className="text-xl font-bold text-gray-900">Nhập thông tin</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-gray-700 font-semibold mb-2">
                Tên đề
              </label>
              <input
                type="text"
                value={exam.title}
                onChange={(e) => setExam({ ...exam, title: e.target.value })}
                className="w-full border rounded p-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-2">
                Mô tả
              </label>
              <textarea
                value={exam.description || ''}
                onChange={(e) => setExam({ ...exam, description: e.target.value })}
                className="w-full border rounded p-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-700 font-semibold mb-2">
                  Thời gian (phút)
                </label>
                <input
                  type="number"
                  value={exam.duration || 60}
                  onChange={(e) => setExam({ ...exam, duration: parseInt(e.target.value) })}
                  className="w-full border rounded p-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-2">
                  Điểm đạt (%)
                </label>
                <input
                  type="number"
                  value={exam.passingPercentage || 50}
                  onChange={(e) => setExam({ ...exam, passingPercentage: parseInt(e.target.value) })}
                  min="0"
                  max="100"
                  className="w-full border rounded p-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Questions Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">📝 Danh sách câu hỏi ({questions.length})</h2>
            <button
              onClick={() => {
                setShowAddQuestion(true);
                setEditingIndex(null);
                setQuestionForm({
                  content: '',
                  type: 'multiple-choice',
                  options: [
                    { text: '', isCorrect: false },
                    { text: '', isCorrect: false },
                    { text: '', isCorrect: false },
                    { text: '', isCorrect: false },
                  ],
                });
              }}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
            >
              + Thêm câu hỏi
            </button>
          </div>

          {/* Add/Edit Question Form */}
          {showAddQuestion && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                {editingIndex !== null ? '✏️ Chỉnh sửa câu hỏi' : '➕ Thêm câu hỏi mới'}
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">
                    Nội dung câu hỏi
                  </label>
                  <textarea
                    value={questionForm.content}
                    onChange={(e) =>
                      setQuestionForm({ ...questionForm, content: e.target.value })
                    }
                    placeholder="Nhập nội dung câu hỏi"
                    className="w-full border rounded p-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    rows={2}
                  />
                </div>

                {editingIndex === null && (
                  <div>
                    <label className="block text-gray-700 font-semibold mb-2">
                      Loại câu hỏi
                    </label>
                    <select
                      value={questionForm.type}
                      onChange={(e) => {
                        const newType = e.target.value as Question['type'];
                        setQuestionForm({ ...questionForm, type: newType });
                      }}
                      className="w-full border rounded p-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="multiple-choice">Trắc nghiệm (Multiple Choice)</option>
                      <option value="short-answer">Trả lời ngắn (Short Answer)</option>
                      <option value="essay">Tự luận (Essay)</option>
                    </select>
                  </div>
                )}

                {/* Multiple Choice Options */}
                {(questionForm.type === 'multiple-choice' || (questionForm.options && questionForm.options.length > 0)) && (
                  <div>
                    <label className="block text-gray-700 font-semibold mb-3">
                      Đáp án (chọn đáp án đúng)
                    </label>
                    <div className="space-y-2">
                      {questionForm.options?.map((option, idx) => (
                        <div key={idx} className="flex items-center gap-3">
                          <span className="font-semibold text-gray-700 min-w-12">
                            {String.fromCharCode(65 + idx)})
                          </span>
                          <input
                            type="text"
                            value={option.text}
                            onChange={(e) => {
                              const newOptions = [...(questionForm.options || [])];
                              newOptions[idx] = {
                                ...option,
                                text: e.target.value,
                              };
                              setQuestionForm({
                                ...questionForm,
                                options: newOptions,
                              });
                            }}
                            placeholder={`Nhập đáp án ${String.fromCharCode(65 + idx)}`}
                            className="flex-1 border rounded p-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <input
                            type="checkbox"
                            checked={option.isCorrect}
                            onChange={(e) => {
                              const newOptions = [...(questionForm.options || [])];
                              newOptions.forEach((opt, i) => {
                                opt.isCorrect = i === idx ? e.target.checked : false;
                              });
                              setQuestionForm({
                                ...questionForm,
                                options: newOptions,
                              });
                            }}
                            className="w-5 h-5 cursor-pointer"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Short Answer / Essay */}
                {(questionForm.type === 'short-answer' ||
                  questionForm.type === 'essay') && (
                  <div>
                    <label className="block text-gray-700 font-semibold mb-2">
                      Đáp án mẫu (tuỳ chọn)
                    </label>
                    <textarea
                      value={questionForm.answer || ''}
                      onChange={(e) =>
                        setQuestionForm({ ...questionForm, answer: e.target.value })
                      }
                      placeholder="Nhập đáp án tham khảo"
                      className="w-full border rounded p-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      rows={3}
                    />
                  </div>
                )}

                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => {
                      setShowAddQuestion(false);
                      setEditingIndex(null);
                    }}
                    className="px-4 py-2 text-gray-700 bg-gray-200 rounded hover:bg-gray-300 transition"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={handleAddQuestion}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                  >
                    {editingIndex !== null ? 'Cập nhật' : 'Thêm'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Questions List */}
          <div className="space-y-3">
            {questions.map((question, idx) => (
              <div key={question._id || idx} className="bg-white rounded-lg shadow p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">
                      Câu {idx + 1}: {question.content}
                    </p>

                    {question.type === 'multiple-choice' && question.options && (
                      <div className="mt-2 ml-4 space-y-1">
                        {question.options.map((opt, oIdx) => (
                          <p
                            key={oIdx}
                            className={`text-sm ${
                              opt.isCorrect ? 'text-green-600 font-semibold' : 'text-gray-600'
                            }`}
                          >
                            {String.fromCharCode(65 + oIdx)}) {opt.text}
                            {opt.isCorrect && ' ✓'}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditQuestion(idx)}
                      className="px-3 py-1 text-blue-600 hover:bg-blue-50 rounded transition"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleDeleteQuestion(idx)}
                      className="px-3 py-1 text-red-600 hover:bg-red-50 rounded transition"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 sticky bottom-0 bg-white border-t border-gray-200 p-4 rounded-b-lg">
          <button
            onClick={handleCancel}
            className="px-6 py-3 text-gray-700 bg-gray-200 rounded hover:bg-gray-300 transition font-semibold"
          >
            ← Hủy
          </button>
          <button
            onClick={handleSaveExam}
            disabled={loading || questions.length === 0}
            className="ml-auto px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-semibold"
          >
            {loading ? '⏳ Đang lưu...' : '✓ Tạo đề'}
          </button>
        </div>
      </div>
    </TeacherLayout>
  );
}
