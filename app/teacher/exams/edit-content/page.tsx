'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import TeacherLayout from '@/layouts/TeacherLayout';
import examApi from '@/api/exam.api';

interface Question {
  content: string;
  options: Array<{ text: string; isCorrect: boolean }>;
  correctAnswer?: string;
  type: string;
}

export default function EditContentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [content, setContent] = useState('');
  const [examData, setExamData] = useState({
    title: '',
    description: '',
    duration: '60',
    passingPercentage: '70',
    numberOfQuestions: '10',
    numberOfAnswersPerQuestion: '4',
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [hasEdited, setHasEdited] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [currentPreviewQuestion, setCurrentPreviewQuestion] = useState(0);
  const [showQuestionList, setShowQuestionList] = useState(false);

  useEffect(() => {
    // Get data from session storage
    const savedData = sessionStorage.getItem('fileContent');
    const savedExamData = sessionStorage.getItem('examData');
    const savedFileName = sessionStorage.getItem('uploadedFileName');
    
    if (savedData) {
      setContent(savedData);
    } else {
      router.push('/teacher/exams/create');
    }

    if (savedExamData) {
      const parsed = JSON.parse(savedExamData);
      // Merge with defaults to ensure all fields have values
      setExamData({
        title: parsed.title || '',
        description: parsed.description || '',
        duration: parsed.duration || '60',
        passingPercentage: parsed.passingPercentage || '70',
        numberOfQuestions: parsed.numberOfQuestions || '10',
        numberOfAnswersPerQuestion: parsed.numberOfAnswersPerQuestion || '4',
      });
    }

    if (savedFileName) {
      setUploadedFileName(savedFileName);
    }

    return () => {
      // Cleanup
    };
  }, [router]);

  const handleGenerateQuestions = () => {
    const numQuestions = parseInt(examData.numberOfQuestions) || 0;
    const numAnswers = parseInt(examData.numberOfAnswersPerQuestion) || 4;

    if (numQuestions <= 0) {
      setError('Số câu hỏi phải lớn hơn 0');
      return;
    }

    if (numAnswers < 2) {
      setError('Số đáp án phải ít nhất là 2');
      return;
    }

    // Generate empty questions structure
    const newQuestions: Question[] = [];
    for (let i = 0; i < numQuestions; i++) {
      const options = [];
      for (let j = 0; j < numAnswers; j++) {
        options.push({
          text: '',
          isCorrect: j === 0, // First option is correct by default
        });
      }
      newQuestions.push({
        content: '',
        options,
        type: 'multiple_choice',
      });
    }

    setQuestions(newQuestions);
    setShowPreview(true);
    setError('');
  };

  const handleCreateExam = async () => {
    if (!examData.title.trim()) {
      setError('Vui lòng nhập tên đề');
      return;
    }

    if (questions.length === 0) {
      setError('Vui lòng nhập số câu hỏi và tạo cấu trúc');
      return;
    }

    // Validate questions are not empty
    const hasEmptyQuestions = questions.some(q => {
      // Check if content is just default placeholder
      if (!q.content.trim() || q.content === 'Câu hỏi') {
        return true;
      }
      // Check if all options are empty
      const allOptionsEmpty = q.options.every(opt => !opt.text || !opt.text.trim());
      return allOptionsEmpty;
    });

    if (hasEmptyQuestions) {
      setError('Vui lòng nhập nội dung câu hỏi và đáp án. Không được để trống.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Convert questions to the format expected by API
      // Backend expects: options as Array<{text: string, isCorrect: boolean}>
      const formattedQuestions = questions.map(q => {
        return {
          content: q.content || `Câu hỏi`,
          type: q.type || 'multiple_choice',
          options: q.options, // Send object array as-is: {text, isCorrect}
        };
      });

      // Get file content and filename from sessionStorage if they exist
      const fileContent = sessionStorage.getItem('fileContent');
      const uploadedFileName = sessionStorage.getItem('uploadedFileName');

      // Create exam with structured questions
      const response = await examApi.createExamWithQuestions({
        title: examData.title,
        description: examData.description,
        duration: examData.duration ? parseInt(examData.duration) : 60,
        passingPercentage: examData.passingPercentage
          ? parseInt(examData.passingPercentage)
          : 70,
        questions: formattedQuestions,
        fileContent: fileContent || undefined,
        fileName: uploadedFileName || undefined,
      });

      sessionStorage.removeItem('fileContent');
      sessionStorage.removeItem('examData');
      sessionStorage.removeItem('uploadedFileName');
      sessionStorage.removeItem('extractedQuestions');
      
      router.push('/teacher/exams/list');
    } catch (err: any) {
      console.error('Error creating exam:', err);
      setError(err.response?.data?.message || err.message || 'Tạo đề thất bại');
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
          {/* File Content Display */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow p-6 space-y-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-3">📄 Nội dung file</h2>
                {uploadedFileName && (
                  <p className="text-sm text-gray-600 mb-3">
                    📎 File: <span className="font-semibold">{uploadedFileName}</span>
                  </p>
                )}
                <div className="bg-gray-50 border border-gray-300 rounded p-4 h-96 overflow-y-auto font-mono text-sm text-gray-700 whitespace-pre-wrap break-words">
                  {content || 'Không có nội dung'}
                </div>
              </div>
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
                  Số lượng câu hỏi <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={examData.numberOfQuestions}
                  onChange={(e) =>
                    setExamData({ ...examData, numberOfQuestions: e.target.value })
                  }
                  placeholder="10"
                  min="1"
                  max="100"
                  className="w-full border rounded p-2 text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-2 text-sm">
                  Số lượng đáp án mỗi câu <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={examData.numberOfAnswersPerQuestion}
                  onChange={(e) =>
                    setExamData({ ...examData, numberOfAnswersPerQuestion: e.target.value })
                  }
                  placeholder="4"
                  min="2"
                  max="10"
                  className="w-full border rounded p-2 text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  min="1"
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
                <p className="font-semibold text-blue-900 mb-2">📊 Cấu trúc</p>
                <p>Câu hỏi: <span className="font-bold text-blue-600">{examData.numberOfQuestions}</span></p>
                <p>Đáp án/câu: <span className="font-bold text-blue-600">{examData.numberOfAnswersPerQuestion}</span></p>
              </div>

              <button
                onClick={handleGenerateQuestions}
                disabled={loading || !examData.numberOfQuestions}
                className="w-full bg-indigo-600 text-white px-4 py-3 rounded hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-semibold text-sm"
              >
                {loading ? '⏳ Đang tạo...' : '🔨 Tạo cấu trúc câu hỏi'}
              </button>

              <button
                onClick={handleCreateExam}
                disabled={
                  loading ||
                  !examData.title.trim() ||
                  questions.length === 0
                }
                className="w-full bg-green-600 text-white px-4 py-3 rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-semibold text-sm"
              >
                {loading ? '⏳ Đang lưu...' : '✓ Lưu đề thi'}
              </button>
            </div>
          </div>
        </div>

        {/* Questions Preview */}
        {showPreview && questions.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6 space-y-4">
            <h2 className="text-xl font-bold text-gray-900">
              ✓ Cấu trúc {questions.length} câu hỏi của đề ({examData.numberOfAnswersPerQuestion} đáp án mỗi câu)
            </h2>

            {/* Single Question Display */}
            <div className="bg-blue-50 border border-blue-200 rounded p-4">
              <p className="font-semibold text-gray-900 mb-3">
                Câu {currentPreviewQuestion + 1}/{questions.length}
              </p>
              <div className="ml-4 space-y-2">
                {questions[currentPreviewQuestion].options.map((opt, oIdx) => (
                  <label key={oIdx} className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name={`question-${currentPreviewQuestion}`}
                      checked={opt.isCorrect}
                      onChange={() => {
                        const newQuestions = [...questions];
                        newQuestions[currentPreviewQuestion].options.forEach((o, i) => {
                          o.isCorrect = i === oIdx;
                        });
                        setQuestions(newQuestions);
                      }}
                      className="w-5 h-5 text-green-600 cursor-pointer"
                    />
                    <span className="text-gray-700 font-semibold">
                      {String.fromCharCode(65 + oIdx)}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-center gap-4 relative">
              <button
                onClick={() => setCurrentPreviewQuestion(Math.max(0, currentPreviewQuestion - 1))}
                disabled={currentPreviewQuestion === 0}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
              >
                ← Câu trước
              </button>

              {/* Menu Button */}
              <div className="relative">
                <button
                  onClick={() => setShowQuestionList(!showQuestionList)}
                  className="px-3 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition font-semibold text-lg"
                  title="Chọn câu nhanh"
                >
                  ≡
                </button>

                {/* Dropdown List */}
                {showQuestionList && (
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 bg-white border border-gray-300 rounded shadow-lg z-10 max-h-64 overflow-y-auto w-48">
                    {questions.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => {
                          setCurrentPreviewQuestion(idx);
                          setShowQuestionList(false);
                        }}
                        className={`w-full text-left px-4 py-2 transition ${
                          idx === currentPreviewQuestion
                            ? 'bg-blue-600 text-white font-semibold'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        Câu {idx + 1}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button
                onClick={() => setCurrentPreviewQuestion(Math.min(questions.length - 1, currentPreviewQuestion + 1))}
                disabled={currentPreviewQuestion === questions.length - 1}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
              >
                Câu tiếp →
              </button>
            </div>

            <p className="text-sm text-gray-600 text-center">
              Chọn đáp án đúng. Bấm "Lưu đề thi" để lưu vào hệ thống.
            </p>
          </div>
        )}
      </div>
    </TeacherLayout>
  );
}
