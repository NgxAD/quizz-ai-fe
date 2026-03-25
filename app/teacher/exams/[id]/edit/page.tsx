'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import TeacherLayout from '@/layouts/TeacherLayout';
import examApi, { Exam as ExamType, Question as QuestionType } from '@/api/exam.api';

interface Exam {
  _id: string;
  title: string;
  description?: string;
  duration?: number;
  passingPercentage?: number;
  type?: 'exercise' | 'test';
  questions?: QuestionType[];
}

interface Question {
  _id?: string;
  content: string;
  type: 'multiple_choice' | 'short_answer' | 'true_false';
  options?: Array<{ text: string; isCorrect: boolean }>;
  correctAnswer?: string;
  explanation?: string;
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
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [pendingDeleteIndex, setPendingDeleteIndex] = useState<number | null>(null);
  const [deleteError, setDeleteError] = useState('');

  const [questionForm, setQuestionForm] = useState<Question>({
    content: '',
    type: 'multiple_choice',
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
          const loadedQuestions = response.data.questions.map((q: any) => {
            // Ensure options is properly formatted
            let options = q.options || [];
            
            // Clean and validate options
            if (Array.isArray(options) && options.length > 0) {
              // Convert to proper format with text and isCorrect
              options = options
                .map((opt: any) => ({
                  text: typeof opt === 'string' ? opt : (opt.text || ''),
                  isCorrect: Boolean(opt.isCorrect),
                }))
                .filter(opt => opt.text && opt.text.trim()); // Remove empty options
              
              // Ensure at least one option has isCorrect = true
              if (!options.some((o: any) => o.isCorrect) && options.length > 0) {
                console.warn(`Question ${q._id}: No correct answer, marking first as correct`);
                options[0].isCorrect = true;
              }
              
              // Pad with empty options if needed to have 4 total
              while (options.length < 4) {
                options.push({ text: '', isCorrect: false });
              }
            } else {
              // If no options, create empty ones
              options = [
                { text: '', isCorrect: false },
                { text: '', isCorrect: false },
                { text: '', isCorrect: false },
                { text: '', isCorrect: false },
              ];
            }
            
            return {
              _id: q._id,
              content: q.content || '',
              type: q.type || 'multiple_choice',
              options: options,
              correctAnswer: q.correctAnswer || '',
              explanation: q.explanation || '',
            };
          });
          
          console.log('Loaded questions:', loadedQuestions.map((q, idx) => ({
            index: idx,
            _id: q._id,
            contentLength: q.content.length,
            optionsCount: q.options.length,
            validOptionsCount: q.options.filter((o: any) => o.text && o.text.trim()).length,
            hasCorrect: q.options.some((o: any) => o.isCorrect),
          })));
          
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

  const handleAddQuestion = async () => {
    if (!questionForm.content.trim()) {
      setError('Vui lòng nhập nội dung câu hỏi');
      return;
    }

    if (questionForm.type === 'multiple_choice') {
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
    setLoading(true);

    try {
      if (editingIndex !== null) {
        // Update existing question
        const newQuestions = [...questions];
        newQuestions[editingIndex] = { ...questionForm };
        setQuestions(newQuestions);
        setEditingIndex(null);
      } else {
        // Add new question
        setQuestions([...questions, { ...questionForm, _id: `temp_${Date.now()}` }]);
      }

      // Reset form
      setQuestionForm({
        content: '',
        type: 'multiple_choice',
        options: [
          { text: '', isCorrect: false },
          { text: '', isCorrect: false },
          { text: '', isCorrect: false },
          { text: '', isCorrect: false },
        ],
      });
      setShowAddQuestion(false);
    } catch (err: any) {
      console.error('Error saving question:', err);
      setError(err.response?.data?.message || 'Lỗi khi lưu câu hỏi');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteQuestion = (index: number) => {
    setPendingDeleteIndex(index);
    setShowDeleteModal(true);
  };

  const confirmDeleteQuestion = async () => {
    if (pendingDeleteIndex === null) {
      console.log('No pending delete index');
      return;
    }

    console.log('Starting delete for question at index:', pendingDeleteIndex);
    setDeleteError('');
    setLoading(true);

    try {
      const updatedQuestions = questions.filter((_, i) => i !== pendingDeleteIndex);
      console.log('Updated questions count:', updatedQuestions.length);

      // If no questions left, just close the modal
      if (updatedQuestions.length === 0) {
        console.log('No questions remaining after delete');
        setQuestions(updatedQuestions);
        setShowDeleteModal(false);
        setPendingDeleteIndex(null);
        return;
      }

      // Validate all remaining questions before sending
      console.log('Validating remaining questions...');
      for (let i = 0; i < updatedQuestions.length; i++) {
        const q = updatedQuestions[i];
        
        // Skip validation for new questions (temp IDs) - they can be incomplete while editing
        if (q._id?.startsWith('temp_')) {
          console.log(`Skipping validation for new question ${i + 1} (temp ID)`);
          continue;
        }
        
        console.log(`Validating question ${i + 1}:`, {
          contentLength: q.content?.length || 0,
          optionsCount: q.options?.length || 0,
          hasCorrectAnswer: q.options?.some((o: any) => o.isCorrect) || false,
        });

        // Check content
        if (!q.content || q.content.trim() === '') {
          const msg = `Câu ${i + 1}: Nội dung trống`;
          console.error(msg);
          setDeleteError(msg);
          setLoading(false);
          return;
        }

        // Check options exist
        if (!q.options || q.options.length === 0) {
          const msg = `Câu ${i + 1}: Không có đáp án`;
          console.error(msg);
          setDeleteError(msg);
          setLoading(false);
          return;
        }

        // Check minimum 2 valid options
        const validOptions = q.options.filter(opt => opt.text && opt.text.trim());
        if (validOptions.length < 2) {
          const msg = `Câu ${i + 1}: Chỉ có ${validOptions.length} đáp án hợp lệ (cần 2+)`;
          console.error(msg);
          setDeleteError(msg);
          setLoading(false);
          return;
        }

        // Check correct answer selected
        const hasCorrect = q.options.some((opt: any) => opt.isCorrect);
        if (!hasCorrect) {
          const msg = `Câu ${i + 1}: Chưa chọn đáp án đúng`;
          console.error(msg);
          setDeleteError(msg);
          setLoading(false);
          return;
        }
      }

      const mappedQuestions = updatedQuestions.map(mapQuestionForBackend);
      console.log('✅ All validation passed. Sending delete request with', mappedQuestions.length, 'questions');
      
      // Log full payload for debugging
      const payload = {
        title: exam!.title,
        description: exam!.description,
        duration: exam!.duration,
        passingPercentage: exam!.passingPercentage,
        type: exam!.type,
        questions: mappedQuestions,
      };
      
      console.log('=== FULL PAYLOAD ===');
      console.log('Exam info:', {
        title: payload.title,
        description: payload.description,
        duration: payload.duration,
        passingPercentage: payload.passingPercentage,
        type: payload.type,
      });
      console.log('Questions:', mappedQuestions.map((q, idx) => ({
        index: idx,
        _id: q._id,
        content: q.content.substring(0, 40) + '...',
        type: q.type,
        optionsCount: q.options.length,
        options: q.options,
        hasCorrect: q.options.some((o: any) => o.isCorrect),
      })));
      console.log('=== END PAYLOAD ===');

      const response = await examApi.updateExamWithQuestions(examId!, payload);

      console.log('Delete successful:', response);
      setQuestions(updatedQuestions);
      setShowDeleteModal(false);
      setPendingDeleteIndex(null);
    } catch (err: any) {
      console.error('Delete error:', err);
      const errorMsg = err.response?.data?.message || err.message || 'Lỗi không xác định';
      console.error('Backend error message:', errorMsg);
      setDeleteError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const mapQuestionForBackend = (question: Question) => {
    // Validate and clean options
    const cleanOptions = question.options
      ?.filter(opt => opt && opt.text && opt.text.trim())
      ?.map(opt => ({
        text: opt.text.trim(),
        isCorrect: Boolean(opt.isCorrect),
      })) || [];

    const mapped: any = {
      content: question.content.trim(),
      type: 'multiple-choice',
      options: cleanOptions,
      answer: '', // For multiple choice, answer is determined by options with isCorrect: true
      explanation: (question.explanation || '').trim(),
    };

    // Only include _id if it's not a temporary question (doesn't start with 'temp_')
    if (question._id && !question._id.startsWith('temp_')) {
      mapped._id = question._id;
    }

    console.log('Mapped question:', {
      _id: mapped._id,
      content: mapped.content.substring(0, 30),
      type: mapped.type,
      optionsCount: mapped.options.length,
      hasCorrectAnswer: mapped.options.some((opt: any) => opt.isCorrect),
      options: mapped.options,
    });

    return mapped;
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
      // Validate all questions have proper content and options
      for (let i = 0; i < questions.length; i++) {
        const q = questions[i];
        if (!q.content || q.content.trim() === '') {
          setError(`Câu ${i + 1}: Vui lòng nhập nội dung câu hỏi`);
          setLoading(false);
          return;
        }

        if (!q.options || q.options.length === 0) {
          setError(`Câu ${i + 1}: Vui lòng thêm đáp án`);
          setLoading(false);
          return;
        }

        const validOptions = q.options.filter(opt => opt.text && opt.text.trim());
        if (validOptions.length < 2) {
          setError(`Câu ${i + 1}: Cần có ít nhất 2 đáp án hợp lệ`);
          setLoading(false);
          return;
        }

        const hasCorrectAnswer = q.options.some(opt => opt.isCorrect);
        if (!hasCorrectAnswer) {
          setError(`Câu ${i + 1}: Vui lòng chọn đáp án đúng`);
          setLoading(false);
          return;
        }
      }

      // Map questions to backend format and update exam with questions
      const mappedQuestions = questions.map(mapQuestionForBackend);
      
      console.log('Sending payload:', {
        title: exam.title,
        description: exam.description,
        duration: exam.duration,
        passingPercentage: exam.passingPercentage,
        type: exam.type,
        questions: mappedQuestions,
      });
      
      const response = await examApi.updateExamWithQuestions(examId!, {
        title: exam.title,
        description: exam.description,
        duration: exam.duration,
        passingPercentage: exam.passingPercentage,
        type: exam.type,
        questions: mappedQuestions,
      });

      // Update state with the actual question IDs from backend
      if (response.data.questions && Array.isArray(response.data.questions)) {
        const updatedQuestions = questions.map((q, idx) => {
          const backendQuestion = response.data.questions?.[idx];
          if (backendQuestion && backendQuestion._id) {
            return {
              ...q,
              _id: backendQuestion._id,
            };
          }
          return q;
        });
        setQuestions(updatedQuestions);
      }

      // Reload to get the latest data from backend
      router.push(`/teacher/exams/${examId}`);
    } catch (err: any) {
      console.error('Error saving exam:', err);
      console.error('Error details:', {
        message: err.message,
        status: err.response?.status,
        statusText: err.response?.statusText,
        data: err.response?.data,
      });
      setError(err.response?.data?.message || err.message || 'Lưu đề thất bại');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setShowCancelModal(true);
  };

  const confirmCancel = () => {
    router.push('/teacher/exams/list');
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
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-lg">📋</span>
            <h2 className="text-lg font-bold text-gray-900">Nhập thông tin</h2>
          </div>

          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-gray-700 font-semibold mb-1 text-sm">
                  Tên đề
                </label>
                <input
                  type="text"
                  value={exam.title}
                  onChange={(e) => setExam({ ...exam, title: e.target.value })}
                  className="w-full border rounded p-2 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-1 text-sm">
                  Loại đề
                </label>
                <select
                  value={exam.type || 'exercise'}
                  onChange={(e) => setExam({ ...exam, type: e.target.value as 'exercise' | 'test' })}
                  className="w-full border rounded p-2 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="exercise">📝 Bài tập</option>
                  <option value="test">✅ Bài kiểm tra</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-gray-700 font-semibold mb-1 text-sm">
                Mô tả
              </label>
              <textarea
                value={exam.description || ''}
                onChange={(e) => setExam({ ...exam, description: e.target.value })}
                className="w-full border rounded p-2 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-gray-700 font-semibold mb-1 text-sm">
                  Thời gian (phút)
                </label>
                <input
                  type="number"
                  value={exam.duration || 60}
                  onChange={(e) => setExam({ ...exam, duration: parseInt(e.target.value) })}
                  className="w-full border rounded p-2 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-1 text-sm">
                  Điểm đạt (%)
                </label>
                <input
                  type="number"
                  value={exam.passingPercentage || 50}
                  onChange={(e) => setExam({ ...exam, passingPercentage: parseInt(e.target.value) })}
                  min="0"
                  max="100"
                  className="w-full border rounded p-2 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Questions Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">📝 Danh sách câu hỏi ({questions.length})</h2>
            <Link
              href={`/teacher/exams/${examId}/add-questions`}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
            >
              + Thêm câu hỏi
            </Link>
          </div>

          {/* Add/Edit Question Form */}
          {showAddQuestion && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                ➕ Thêm câu hỏi mới
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

                {/* Multiple Choice Options */}
                <div>
                    <label className="block text-gray-700 font-semibold mb-3">
                      Đáp án (chọn đáp án đúng)
                    </label>
                    <div className="space-y-2">
                      {questionForm.options?.map((option, idx) => (
                        <div key={idx} className="flex items-center gap-3 p-2 rounded hover:bg-gray-50">
                          <input
                            type="radio"
                            name="correctAnswer"
                            checked={option.isCorrect}
                            onChange={(e) => {
                              const newOptions = [...(questionForm.options || [])];
                              newOptions.forEach((opt, i) => {
                                opt.isCorrect = i === idx && e.target.checked;
                              });
                              setQuestionForm({
                                ...questionForm,
                                options: newOptions,
                              });
                            }}
                            className="w-5 h-5 cursor-pointer accent-green-600"
                          />
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
                          {option.isCorrect && (
                            <span className="text-green-600 font-semibold text-sm">✓</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => {
                      setShowAddQuestion(false);
                      setEditingIndex(null);
                      setError('');
                    }}
                    className="px-4 py-2 text-gray-700 bg-gray-200 rounded hover:bg-gray-300 transition"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={handleAddQuestion}
                    disabled={loading}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? '⏳ Đang xử lý...' : editingIndex !== null ? 'Cập nhật' : 'Thêm'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Questions List */}
          <div className="space-y-6">
            {questions.map((question, idx) => (
              <div key={question._id || idx} className="bg-white rounded-lg shadow p-6 space-y-4">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <h3 className="text-lg font-bold text-gray-900">
                    Câu {idx + 1}
                  </h3>
                  <button
                    onClick={() => handleDeleteQuestion(idx)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 p-2 rounded transition"
                    title="Xóa"
                  >
                    🗑️
                  </button>
                </div>

                {/* Question Content */}
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">
                    Nội dung câu hỏi
                  </label>
                  <textarea
                    value={question.content}
                    onChange={(e) => {
                      const newQuestions = [...questions];
                      newQuestions[idx] = { ...question, content: e.target.value };
                      setQuestions(newQuestions);
                    }}
                    placeholder="Nhập nội dung câu hỏi"
                    className="w-full border rounded p-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    rows={2}
                  />
                </div>

                {/* Multiple Choice Options */}
                {question.type === 'multiple_choice' && question.options && (
                  <div>
                    <label className="block text-gray-700 font-semibold mb-3">
                      Đáp án (chọn đáp án đúng)
                    </label>
                    <div className="space-y-2">
                      {question.options.map((option, optIdx) => (
                        <div key={optIdx} className="flex items-center gap-3 p-2 rounded hover:bg-gray-50">
                          <input
                            type="radio"
                            name={`correctAnswer-${idx}`}
                            checked={option.isCorrect}
                            onChange={(e) => {
                              const newQuestions = [...questions];
                              const newOptions = [...(newQuestions[idx].options || [])];
                              newOptions.forEach((opt, i) => {
                                opt.isCorrect = i === optIdx && e.target.checked;
                              });
                              newQuestions[idx] = { ...newQuestions[idx], options: newOptions };
                              setQuestions(newQuestions);
                            }}
                            className="w-5 h-5 cursor-pointer accent-green-600"
                          />
                          <span className="font-semibold text-gray-700 min-w-12">
                            {String.fromCharCode(65 + optIdx)})
                          </span>
                          <input
                            type="text"
                            value={option.text}
                            onChange={(e) => {
                              const newQuestions = [...questions];
                              const newOptions = [...(newQuestions[idx].options || [])];
                              newOptions[optIdx] = { ...option, text: e.target.value };
                              newQuestions[idx] = { ...newQuestions[idx], options: newOptions };
                              setQuestions(newQuestions);
                            }}
                            placeholder={`Nhập đáp án ${String.fromCharCode(65 + optIdx)}`}
                            className="flex-1 border rounded p-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          {option.isCorrect && (
                            <span className="text-green-600 font-semibold text-sm">✓</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
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
            {loading ? '⏳ Đang lưu...' : '✓ Lưu đề'}
          </button>
        </div>
      </div>

      {/* Delete Question Modal */}
      {showDeleteModal && pendingDeleteIndex !== null && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-96 max-w-[90vw]">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Xóa câu hỏi</h2>
            <p className="text-gray-600 mb-6">Bạn có chắc muốn xóa câu hỏi này?</p>
            
            {deleteError && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded mb-4 text-sm">
                {deleteError}
              </div>
            )}
            
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setPendingDeleteIndex(null);
                  setDeleteError('');
                }}
                disabled={loading}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Hủy
              </button>
              <button
                onClick={confirmDeleteQuestion}
                disabled={loading}
                className="px-6 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Đang xóa...' : 'Xóa'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-96 max-w-[90vw]">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Hủy tạo đề</h2>
            <p className="text-gray-600 mb-6">Hủy tạo đề? Thông tin sẽ không được lưu.</p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowCancelModal(false)}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition"
              >
                Tiếp tục
              </button>
              <button
                onClick={confirmCancel}
                className="px-6 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition"
              >
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}
    </TeacherLayout>
  );
}
