'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import TeacherLayout from '@/layouts/TeacherLayout';
import MathSymbolPicker from '@/components/MathSymbolPicker';
import examApi from '@/api/exam.api';

interface Question {
  id: string;
  content: string;
  type: 'MULTIPLE_CHOICE' | 'ESSAY';
  options: string[];
  correctAnswer: number;
  image?: string; // base64 image data
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
  const [focusedInputType, setFocusedInputType] = useState<'title' | 'content' | `option-${number}` | null>(null);

  // Formula modal states
  const [showFormulaModal, setShowFormulaModal] = useState(false);
  const [formulaInput, setFormulaInput] = useState('');
  const [targetFormulaField, setTargetFormulaField] = useState<'title' | 'content' | `option-${number}` | null>(null);

  const titleRef = useRef<HTMLInputElement>(null);
  const contentRef = useRef<HTMLTextAreaElement>(null);
  const optionRefs = useRef<(HTMLInputElement | null)[]>([null, null, null, null]);
  const formulaInputRef = useRef<HTMLInputElement>(null);

  // Insert formula into modal input
  const insertFormula = (formula: string) => {
    if (formulaInputRef.current) {
      const input = formulaInputRef.current;
      const start = input.selectionStart ?? 0;
      const end = input.selectionEnd ?? 0;
      const newText = formulaInput.substring(0, start) + formula + formulaInput.substring(end);
      setFormulaInput(newText);
      
      setTimeout(() => {
        input.focus();
        input.setSelectionRange(start + formula.length, start + formula.length);
      }, 0);
    }
  };

  // Insert formula from modal to target field
  const insertFormulaToField = () => {
    if (!formulaInput.trim() || !targetFormulaField) return;

    if (targetFormulaField === 'title' && titleRef.current) {
      const input = titleRef.current;
      const start = input.selectionStart ?? 0;
      const end = input.selectionEnd ?? 0;
      const newValue = examTitle.substring(0, start) + formulaInput + examTitle.substring(end);
      setExamTitle(newValue);
      setTimeout(() => {
        input.focus();
        input.setSelectionRange(start + formulaInput.length, start + formulaInput.length);
      }, 0);
    } else if (targetFormulaField === 'content' && contentRef.current) {
      const input = contentRef.current;
      const start = input.selectionStart ?? 0;
      const end = input.selectionEnd ?? 0;
      const currentContent = currentQuestion.content || '';
      const newValue = currentContent.substring(0, start) + formulaInput + currentContent.substring(end);
      setCurrentQuestion({ ...currentQuestion, content: newValue });
      setTimeout(() => {
        input.focus();
        input.setSelectionRange(start + formulaInput.length, start + formulaInput.length);
      }, 0);
    } else if (targetFormulaField?.startsWith('option-')) {
      const optionIdx = parseInt(targetFormulaField.split('-')[1]);
      if (optionRefs.current[optionIdx]) {
        const input = optionRefs.current[optionIdx]!;
        const start = input.selectionStart ?? 0;
        const end = input.selectionEnd ?? 0;
        const options = [...(currentQuestion.options || [])];
        const newValue = options[optionIdx].substring(0, start) + formulaInput + options[optionIdx].substring(end);
        options[optionIdx] = newValue;
        setCurrentQuestion({ ...currentQuestion, options });
        setTimeout(() => {
          if (optionRefs.current[optionIdx]) {
            optionRefs.current[optionIdx]!.focus();
            optionRefs.current[optionIdx]!.setSelectionRange(start + formulaInput.length, start + formulaInput.length);
          }
        }, 0);
      }
    }

    setFormulaInput('');
    setShowFormulaModal(false);
    setTargetFormulaField(null);
  };

  // Open formula modal for a specific field
  const openFormulaModal = (fieldType: typeof targetFormulaField) => {
    setTargetFormulaField(fieldType);
    setShowFormulaModal(true);
    setFormulaInput('');
  };

  // Insert symbol vào focused input
  const insertSymbol = (symbol: string) => {
    if (!focusedInputType) return;

    if (focusedInputType === 'title' && titleRef.current) {
      const input = titleRef.current;
      const start = input.selectionStart || 0;
      const end = input.selectionEnd || 0;
      const newValue = examTitle.substring(0, start) + symbol + examTitle.substring(end);
      setExamTitle(newValue);
      setTimeout(() => {
        if (titleRef.current) {
          titleRef.current.focus();
          titleRef.current.setSelectionRange(start + symbol.length, start + symbol.length);
        }
      }, 0);
    } else if (focusedInputType === 'content' && contentRef.current) {
      const input = contentRef.current;
      const start = input.selectionStart || 0;
      const end = input.selectionEnd || 0;
      const currentContent = currentQuestion.content || '';
      const newValue = currentContent.substring(0, start) + symbol + currentContent.substring(end);
      setCurrentQuestion({ ...currentQuestion, content: newValue });
      setTimeout(() => {
        if (contentRef.current) {
          contentRef.current.focus();
          contentRef.current.setSelectionRange(start + symbol.length, start + symbol.length);
        }
      }, 0);
    } else if (focusedInputType?.startsWith('option-')) {
      const optionIdx = parseInt(focusedInputType.split('-')[1]);
      if (optionRefs.current[optionIdx]) {
        const input = optionRefs.current[optionIdx]!;
        const start = input.selectionStart || 0;
        const end = input.selectionEnd || 0;
        const options = [...(currentQuestion.options || [])];
        const newValue = options[optionIdx].substring(0, start) + symbol + options[optionIdx].substring(end);
        options[optionIdx] = newValue;
        setCurrentQuestion({ ...currentQuestion, options });
        setTimeout(() => {
          if (optionRefs.current[optionIdx]) {
            optionRefs.current[optionIdx]!.focus();
            optionRefs.current[optionIdx]!.setSelectionRange(start + symbol.length, start + symbol.length);
          }
        }, 0);
      }
    }
  };

  // Handle image upload for question
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Ảnh phải nhỏ hơn 5MB');
      return;
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      setError('Vui lòng chọn tập tin ảnh');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64String = event.target?.result as string;
      setCurrentQuestion({ ...currentQuestion, image: base64String });
      setError('');
      setSuccess('✓ Ảnh đã được thêm');
      setTimeout(() => setSuccess(''), 2000);
    };
    reader.onerror = () => {
      setError('Lỗi khi tải ảnh. Vui lòng thử lại.');
    };
    reader.readAsDataURL(file);
  };

  // Handle paste image directly into textarea
  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.startsWith('image/')) {
        e.preventDefault();
        const file = item.getAsFile();
        if (!file) return;

        // Check file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          setError('Ảnh phải nhỏ hơn 5MB');
          return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
          const base64String = event.target?.result as string;
          setCurrentQuestion({ ...currentQuestion, image: base64String });
          setError('');
          setSuccess('✓ Ảnh đã được dán vào');
          setTimeout(() => setSuccess(''), 2000);
        };
        reader.onerror = () => {
          setError('Lỗi khi dán ảnh. Vui lòng thử lại.');
        };
        reader.readAsDataURL(file);
        break;
      }
    }
  };

  const removeImage = () => {
    setCurrentQuestion({ ...currentQuestion, image: undefined });
    setSuccess('✓ Ảnh đã bị xóa');
    setTimeout(() => setSuccess(''), 2000);
  };

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
      image: currentQuestion.image,
    };

    setQuestions([...questions, question]);
    setCurrentQuestion({
      type: 'MULTIPLE_CHOICE',
      options: ['', '', '', ''],
      correctAnswer: 0,
      image: undefined,
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
              image: currentQuestion.image,
            } as Question)
          : q,
      );
      setQuestions(updatedQuestions);
      setSelectedQuestionId(null);
      setCurrentQuestion({
        type: 'MULTIPLE_CHOICE',
        options: ['', '', '', ''],
        correctAnswer: 0,
        image: undefined,
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
        image: undefined,
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
          image: q.image,
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
          <div className="flex gap-2 items-end">
            <input
              ref={titleRef}
              type="text"
              value={examTitle}
              onChange={(e) => setExamTitle(e.target.value)}
              onFocus={() => setFocusedInputType('title')}
              placeholder="Nhập tên đề"
              className="flex-1 border rounded-lg p-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 select-text"
            />
            <MathSymbolPicker onSymbolSelect={insertSymbol} />
          </div>
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
                <div className="flex gap-2">
                  <textarea
                    ref={contentRef}
                    value={currentQuestion.content || ''}
                    onChange={(e) =>
                      setCurrentQuestion({
                        ...currentQuestion,
                        content: e.target.value,
                      })
                    }
                    onFocus={() => setFocusedInputType('content')}
                    onPaste={handlePaste}
                    placeholder="Nhập nội dung câu hỏi"
                    rows={4}
                    className="flex-1 border rounded-lg p-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none select-text"
                  />
                  <div className="flex flex-col items-center gap-2 pt-1">
                    <MathSymbolPicker onSymbolSelect={insertSymbol} />
                    <button
                      type="button"
                      onClick={() => openFormulaModal('content')}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm font-semibold transition"
                      title="Chèn công thức"
                    >
                      ∑ Công thức
                    </button>
                    <label className="text-center">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          const input = (e.currentTarget.parentElement?.querySelector('input[type="file"]') as HTMLInputElement);
                          input?.click();
                        }}
                        className="bg-green-600 hover:bg-green-700 text-white px-2 py-2 rounded text-sm font-semibold transition w-full"
                        title="Chèn ảnh"
                      >
                        🖼️
                      </button>
                    </label>
                  </div>
                </div>

                {/* Image Preview */}
                {currentQuestion.image && (
                  <div className="mt-3 relative inline-block">
                    <img
                      src={currentQuestion.image}
                      alt="Question preview"
                      className="max-w-xs max-h-48 rounded-lg border border-gray-300"
                    />
                    <button
                      type="button"
                      onClick={removeImage}
                      className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold transition"
                      title="Xóa ảnh"
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>

              {/* Options */}
              {currentQuestion.type === 'MULTIPLE_CHOICE' && (
                <div>
                  <label className="block text-gray-700 font-semibold mb-3">
                    Các tùy chọn
                  </label>
                  <div className="space-y-2">
                    {(currentQuestion.options || []).map((opt, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <span className="w-8 h-8 flex items-center justify-center bg-blue-100 rounded font-semibold text-blue-700 flex-shrink-0">
                          {String.fromCharCode(65 + idx)}
                        </span>
                        <input
                          ref={(el) => { optionRefs.current[idx] = el; }}
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
                          onFocus={() => setFocusedInputType(`option-${idx}` as const)}
                          placeholder={`Tùy chọn ${String.fromCharCode(65 + idx)}`}
                          className="flex-1 border rounded-lg p-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 select-text"
                        />
                        <div className="flex-shrink-0">
                          <MathSymbolPicker onSymbolSelect={insertSymbol} />
                        </div>
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

                  {/* Preview Image */}
                  {currentQuestion.image && (
                    <div className="mt-3">
                      <img
                        src={currentQuestion.image}
                        alt="Question preview"
                        className="max-w-full max-h-40 rounded-lg border border-gray-300"
                      />
                    </div>
                  )}

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
                          {q.image && (
                            <img
                              src={q.image}
                              alt="Question"
                              className="mt-2 h-16 rounded border border-gray-300 object-cover"
                            />
                          )}
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

      {/* Formula Editor Modal */}
      {showFormulaModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-black">Soạn thảo công thức</h2>
              <button
                onClick={() => {
                  setShowFormulaModal(false);
                  setFormulaInput('');
                  setTargetFormulaField(null);
                }}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ✕
              </button>
            </div>

            {/* Formula Input */}
            <input
              ref={formulaInputRef}
              type="text"
              value={formulaInput}
              onChange={(e) => setFormulaInput(e.target.value)}
              placeholder="Nhập hoặc chèn công thức..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
            />

            {/* Math Keyboard */}
            <div className="bg-gray-100 p-4 rounded-lg mb-4">
              <div className="grid grid-cols-8 gap-2">
                {/* Row 1 - Roots and Powers */}
                <button onClick={() => insertFormula('√')} className="bg-gray-400 text-white p-2 rounded text-sm font-semibold hover:bg-gray-500 transition">√</button>
                <button onClick={() => insertFormula('∛')} className="bg-gray-400 text-white p-2 rounded text-sm font-semibold hover:bg-gray-500 transition">∛</button>
                <button onClick={() => insertFormula('∜')} className="bg-gray-400 text-white p-2 rounded text-sm font-semibold hover:bg-gray-500 transition">∜</button>
                <button onClick={() => insertFormula('^')} className="bg-gray-400 text-white p-2 rounded text-sm font-semibold hover:bg-gray-500 transition">^</button>
                <button onClick={() => insertFormula('x²')} className="bg-gray-400 text-white p-2 rounded text-sm font-semibold hover:bg-gray-500 transition">x²</button>
                <button onClick={() => insertFormula('x³')} className="bg-gray-400 text-white p-2 rounded text-sm font-semibold hover:bg-gray-500 transition">x³</button>
                <button onClick={() => insertFormula('π')} className="bg-gray-400 text-white p-2 rounded text-sm font-semibold hover:bg-gray-500 transition">π</button>
                <button onClick={() => insertFormula('e')} className="bg-gray-400 text-white p-2 rounded text-sm font-semibold hover:bg-gray-500 transition">e</button>

                {/* Row 2 - Basic Operators */}
                <button onClick={() => insertFormula('+')} className="bg-gray-400 text-white p-2 rounded text-sm font-semibold hover:bg-gray-500 transition">+</button>
                <button onClick={() => insertFormula('−')} className="bg-gray-400 text-white p-2 rounded text-sm font-semibold hover:bg-gray-500 transition">−</button>
                <button onClick={() => insertFormula('×')} className="bg-gray-400 text-white p-2 rounded text-sm font-semibold hover:bg-gray-500 transition">×</button>
                <button onClick={() => insertFormula('÷')} className="bg-gray-400 text-white p-2 rounded text-sm font-semibold hover:bg-gray-500 transition">÷</button>
                <button onClick={() => insertFormula('=')} className="bg-gray-400 text-white p-2 rounded text-sm font-semibold hover:bg-gray-500 transition">=</button>
                <button onClick={() => insertFormula('≠')} className="bg-gray-400 text-white p-2 rounded text-sm font-semibold hover:bg-gray-500 transition">≠</button>
                <button onClick={() => insertFormula('≈')} className="bg-gray-400 text-white p-2 rounded text-sm font-semibold hover:bg-gray-500 transition">≈</button>
                <button onClick={() => insertFormula('±')} className="bg-gray-400 text-white p-2 rounded text-sm font-semibold hover:bg-gray-500 transition">±</button>

                {/* Row 3 - Comparison and Brackets */}
                <button onClick={() => insertFormula('<')} className="bg-gray-400 text-white p-2 rounded text-sm font-semibold hover:bg-gray-500 transition">&lt;</button>
                <button onClick={() => insertFormula('>')} className="bg-gray-400 text-white p-2 rounded text-sm font-semibold hover:bg-gray-500 transition">&gt;</button>
                <button onClick={() => insertFormula('≤')} className="bg-gray-400 text-white p-2 rounded text-sm font-semibold hover:bg-gray-500 transition">≤</button>
                <button onClick={() => insertFormula('≥')} className="bg-gray-400 text-white p-2 rounded text-sm font-semibold hover:bg-gray-500 transition">≥</button>
                <button onClick={() => insertFormula('(')} className="bg-gray-400 text-white p-2 rounded text-sm font-semibold hover:bg-gray-500 transition">(</button>
                <button onClick={() => insertFormula(')')} className="bg-gray-400 text-white p-2 rounded text-sm font-semibold hover:bg-gray-500 transition">)</button>
                <button onClick={() => insertFormula('[')} className="bg-gray-400 text-white p-2 rounded text-sm font-semibold hover:bg-gray-500 transition">[</button>
                <button onClick={() => insertFormula(']')} className="bg-gray-400 text-white p-2 rounded text-sm font-semibold hover:bg-gray-500 transition">]</button>

                {/* Row 4 - Calculus and Greek Letters */}
                <button onClick={() => insertFormula('∞')} className="bg-gray-400 text-white p-2 rounded text-sm font-semibold hover:bg-gray-500 transition">∞</button>
                <button onClick={() => insertFormula('∑')} className="bg-gray-400 text-white p-2 rounded text-sm font-semibold hover:bg-gray-500 transition">∑</button>
                <button onClick={() => insertFormula('∏')} className="bg-gray-400 text-white p-2 rounded text-sm font-semibold hover:bg-gray-500 transition">∏</button>
                <button onClick={() => insertFormula('∫')} className="bg-gray-400 text-white p-2 rounded text-sm font-semibold hover:bg-gray-500 transition">∫</button>
                <button onClick={() => insertFormula('∂')} className="bg-gray-400 text-white p-2 rounded text-sm font-semibold hover:bg-gray-500 transition">∂</button>
                <button onClick={() => insertFormula('∇')} className="bg-gray-400 text-white p-2 rounded text-sm font-semibold hover:bg-gray-500 transition">∇</button>
                <button onClick={() => insertFormula('α')} className="bg-gray-400 text-white p-2 rounded text-sm font-semibold hover:bg-gray-500 transition">α</button>
                <button onClick={() => insertFormula('β')} className="bg-gray-400 text-white p-2 rounded text-sm font-semibold hover:bg-gray-500 transition">β</button>

                {/* Row 5 - Greek Letters */}
                <button onClick={() => insertFormula('γ')} className="bg-gray-400 text-white p-2 rounded text-sm font-semibold hover:bg-gray-500 transition">γ</button>
                <button onClick={() => insertFormula('δ')} className="bg-gray-400 text-white p-2 rounded text-sm font-semibold hover:bg-gray-500 transition">δ</button>
                <button onClick={() => insertFormula('ε')} className="bg-gray-400 text-white p-2 rounded text-sm font-semibold hover:bg-gray-500 transition">ε</button>
                <button onClick={() => insertFormula('θ')} className="bg-gray-400 text-white p-2 rounded text-sm font-semibold hover:bg-gray-500 transition">θ</button>
                <button onClick={() => insertFormula('λ')} className="bg-gray-400 text-white p-2 rounded text-sm font-semibold hover:bg-gray-500 transition">λ</button>
                <button onClick={() => insertFormula('μ')} className="bg-gray-400 text-white p-2 rounded text-sm font-semibold hover:bg-gray-500 transition">μ</button>
                <button onClick={() => insertFormula('ρ')} className="bg-gray-400 text-white p-2 rounded text-sm font-semibold hover:bg-gray-500 transition">ρ</button>
                <button onClick={() => insertFormula('σ')} className="bg-gray-400 text-white p-2 rounded text-sm font-semibold hover:bg-gray-500 transition">σ</button>

                {/* Row 6 - Set and Logic Symbols */}
                <button onClick={() => insertFormula('∪')} className="bg-gray-400 text-white p-2 rounded text-sm font-semibold hover:bg-gray-500 transition">∪</button>
                <button onClick={() => insertFormula('∩')} className="bg-gray-400 text-white p-2 rounded text-sm font-semibold hover:bg-gray-500 transition">∩</button>
                <button onClick={() => insertFormula('⊂')} className="bg-gray-400 text-white p-2 rounded text-sm font-semibold hover:bg-gray-500 transition">⊂</button>
                <button onClick={() => insertFormula('⊃')} className="bg-gray-400 text-white p-2 rounded text-sm font-semibold hover:bg-gray-500 transition">⊃</button>
                <button onClick={() => insertFormula('∈')} className="bg-gray-400 text-white p-2 rounded text-sm font-semibold hover:bg-gray-500 transition">∈</button>
                <button onClick={() => insertFormula('∉')} className="bg-gray-400 text-white p-2 rounded text-sm font-semibold hover:bg-gray-500 transition">∉</button>
                <button onClick={() => insertFormula('∅')} className="bg-gray-400 text-white p-2 rounded text-sm font-semibold hover:bg-gray-500 transition">∅</button>
                <button onClick={() => insertFormula('°')} className="bg-gray-400 text-white p-2 rounded text-sm font-semibold hover:bg-gray-500 transition">°</button>
              </div>
            </div>

            {/* Insert Button */}
            <div className="flex justify-end">
              <button
                onClick={insertFormulaToField}
                disabled={!formulaInput.trim()}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Chèn
              </button>
            </div>
          </div>
        </div>
      )}
    </TeacherLayout>
  );
}
