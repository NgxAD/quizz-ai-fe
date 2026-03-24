'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import Timer from '@/components/Timer';
import examApi, { Exam as ExamType } from '@/api/exam.api';
import submissionApi from '@/api/submission.api';
import { useAuthStore } from '@/store/auth.store';

interface Question {
  _id?: string;
  content: string;
  type?: string;
  displayType?: 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'SHORT_ANSWER';
  options?: string[];
  explanation?: string;
  image?: string; // base64 image data
}

export default function DoExamPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const examId = params?.id as string | undefined;
  const isRetry = searchParams?.get('retry') === 'true';
  const { user } = useAuthStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const fullscreenAttemptedRef = useRef(false);

  const [exam, setExam] = useState<ExamType | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [timeUp, setTimeUp] = useState(false);
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showQuestionMenu, setShowQuestionMenu] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (examId) {
      loadExam();
    }
  }, [examId]);

  // Only track fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement
      );
      setIsFullscreen(isCurrentlyFullscreen);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Exit fullscreen when page is unloading
  useEffect(() => {
    return () => {
      exitFullscreenMode();
    };
  }, []);

  // Request fullscreen when exam is loaded
  useEffect(() => {
    if (exam && !loading && questions.length > 0 && !fullscreenAttemptedRef.current) {
      fullscreenAttemptedRef.current = true;
      // Delay to ensure DOM is fully rendered
      const timer = setTimeout(() => {
        requestFullscreenMode();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [exam, loading, questions]);

  const requestFullscreenMode = async () => {
    try {
      const element = document.documentElement;
      
      if (element.requestFullscreen) {
        await element.requestFullscreen({ navigationUI: 'hide' }).catch((err) => {
          console.warn('Fullscreen request error:', err?.message);
        });
      } else if ((element as any).webkitRequestFullscreen) {
        (element as any).webkitRequestFullscreen();
      } else if ((element as any).mozRequestFullScreen) {
        (element as any).mozRequestFullScreen();
      } else if ((element as any).msRequestFullscreen) {
        (element as any).msRequestFullscreen();
      }
    } catch (error: any) {
      console.warn('Fullscreen request warning:', error?.message);
    }
  };

  const exitFullscreenMode = async () => {
    try {
      const isCurrentlyInFullscreen = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement
      );

      if (isCurrentlyInFullscreen) {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if ((document as any).webkitExitFullscreen) {
          await (document as any).webkitExitFullscreen();
        } else if ((document as any).mozCancelFullScreen) {
          await (document as any).mozCancelFullScreen();
        } else if ((document as any).msExitFullscreen) {
          await (document as any).msExitFullscreen();
        }
      }
      setIsFullscreen(false);
    } catch (error) {
      console.error('Error exiting fullscreen:', error);
    }
  };

  const loadExam = async () => {
    try {
      setLoading(true);
      
      if (!examId) {
        setError('Lỗi: Không tìm thấy ID bài thi');
        return;
      }
      
      console.log('Loading exam with ID:', examId);
      const examResponse = await examApi.getById(examId);
      setExam(examResponse.data);
      console.log('Exam loaded:', examResponse.data);
      console.log('Questions from backend:', examResponse.data.questions);

      // Check if user already has a submission for this exam (only if not retrying)
      if (!isRetry) {
        try {
          const submissionsResponse = await submissionApi.getUserSubmissions();
          const userSubmission = submissionsResponse.data.find((sub: any) => {
            const subQuizId = typeof sub.quizId === 'string' ? sub.quizId : (sub.quizId as any)?._id;
            return subQuizId === examId;
          });
          
          if (userSubmission) {
            console.log('User already has submission for this exam:', userSubmission._id);
            setError('');
            // Redirect to results page
            setTimeout(() => {
              router.push(`/student/results/${userSubmission._id}`);
            }, 500);
            return;
          }
        } catch (submissionCheckErr) {
          console.error('Error checking existing submissions:', submissionCheckErr);
          // Continue with exam if check fails
        }
      }

      // Questions should be populated from backend
      if (examResponse.data.questions && examResponse.data.questions.length > 0) {
        const questionsData = examResponse.data.questions.map((q: any) => {
          // Extract options text from the options array
          let optionsArray: string[] = [];
          if (q.options && Array.isArray(q.options) && q.options.length > 0) {
            optionsArray = q.options.map((opt: any) => {
              if (!opt) return '';
              return typeof opt === 'string' ? opt : (opt.text || '');
            }).filter((text: string) => text.length > 0);
          }
          
          // Normalize question type from backend
          let questionType = 'MULTIPLE_CHOICE';
          if (q.type === 'true_false') {
            questionType = 'TRUE_FALSE';
          } else if (q.type === 'short_answer') {
            questionType = 'SHORT_ANSWER';
          } else {
            questionType = 'MULTIPLE_CHOICE';
          }

          console.log('Question:', {
            id: q._id,
            content: q.content,
            type: questionType,
            optionsRaw: q.options,
            optionsExtracted: optionsArray
          });

          return {
            _id: q._id,
            content: q.content,
            type: q.type,
            displayType: questionType as 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'SHORT_ANSWER',
            options: optionsArray,
            explanation: q.explanation,
            image: q.image
          };
        });
        setQuestions(questionsData as any);
      } else {
        console.warn('No questions returned from backend');
        setError('Không có câu hỏi trong bài thi này');
      }

      // Start the exam to create a submission record
      if (examResponse.data._id) {
        try {
          console.log('Starting exam:', examResponse.data._id);
          const submissionResponse = await submissionApi.startExam(examResponse.data._id);
          console.log('Submission started:', submissionResponse.data);
          
          // Backend returns { submission: { _id, ... }, exam: { ... } }
          const submissionData = submissionResponse.data as any;
          if (submissionData.submission && submissionData.submission._id) {
            setSubmissionId(submissionData.submission._id);
            console.log('SubmissionId set to:', submissionData.submission._id);
          } else if (submissionData._id) {
            // Fallback if structure is different
            setSubmissionId(submissionData._id);
            console.log('SubmissionId set to:', submissionData._id);
          } else {
            console.error('No submission ID found in response:', submissionData);
          }
        } catch (submissionError: any) {
          console.error('Error starting exam:', submissionError);
          // Continue without submission tracking if it fails
        }
      }

      setError('');
    } catch (err: any) {
      console.error('Error loading exam:', err);
      const statusCode = err.response?.status;
      const errorMessage = err.response?.data?.message;
      
      if (statusCode === 404) {
        setError('Bài thi không tồn tại. Nó có thể đã bị xóa hoặc ID không đúng.');
      } else if (statusCode === 403) {
        setError('Bạn không có quyền truy cập bài thi này.');
      } else {
        setError(errorMessage || 'Lỗi khi tải đề thi: ' + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (questionId: string, answer: string) => {
    setAnswers({
      ...answers,
      [questionId]: answer,
    });
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleTimeUp = async () => {
    setTimeUp(true);
    await confirmSubmit();
  };

  const handleSubmit = () => {
    // Show confirmation modal instead of submitting immediately
    setShowConfirmModal(true);
  };

  const confirmSubmit = async () => {
    console.log('confirmSubmit called, submissionId:', submissionId, 'submitting:', submitting);
    
    if (submitting) {
      console.log('Already submitting, returning');
      return;
    }
    
    if (!submissionId) {
      console.error('No submissionId available');
      setError('Lỗi: Không tìm thấy ID bài kiểm tra. Vui lòng tải lại trang.');
      return;
    }

    setSubmitting(true);
    setShowConfirmModal(false);
    try {
      console.log('Saving answers before submit...');
      // First save all answers to backend
      const answersToSave = questions.map((q) => ({
        questionId: q._id || '',
        answer: answers[q._id || ''] || '',
      }));
      
      await submissionApi.saveAnswers(submissionId, { answers: answersToSave });
      console.log('Answers saved successfully');
      
      console.log('Submitting exam with submissionId:', submissionId);
      const response = await submissionApi.submitExam(submissionId, {
        timeElapsed: exam?.duration ? Math.floor(Number(exam.duration) * 60) : 0,
      });
      console.log('Submit response:', response);
      setError('');
      
      // Exit fullscreen mode
      await exitFullscreenMode();
      
      // Delay slightly to ensure state updates before navigation
      setTimeout(() => {
        console.log('Navigating to results page');
        router.push(`/student/results/${submissionId}`);
      }, 500);
    } catch (err: any) {
      console.error('Error submitting exam:', err);
      setError(err.response?.data?.message || 'Lỗi khi nộp bài: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const cancelSubmit = () => {
    setShowConfirmModal(false);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center py-12">
          <div className="text-gray-500">Đang tải đề thi...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 p-6 flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded max-w-md">
          {error}
        </div>
      </div>
    );
  }

  if (!exam || questions.length === 0) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center py-12">
          <div className="text-gray-500">Không tìm thấy đề thi</div>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;
  
  // Guard against undefined question
  if (!currentQuestion) {
    return (
      <div className="min-h-screen bg-gray-100 p-6 flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          Lỗi: Không tìm thấy câu hỏi. Vui lòng tải lại trang.
        </div>
        <button
          onClick={() => router.push('/student/exams')}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
        >
          Quay lại
        </button>
      </div>
    );
  }
  
  // Determine display type based on question type
  const getDisplayType = (q: Question): 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'SHORT_ANSWER' => {
    if (q.displayType) return q.displayType;
    
    // Fallback to determine from type property
    const type = (q.type || '').toLowerCase();
    if (type.includes('true_false') || type.includes('trueFalse')) return 'TRUE_FALSE';
    if (type.includes('short_answer') || type.includes('shortAnswer') || type.includes('essay')) return 'SHORT_ANSWER';
    return 'MULTIPLE_CHOICE';
  };
  
  const questionDisplayType = getDisplayType(currentQuestion);

  return (
    <div ref={containerRef} className="h-screen bg-white overflow-hidden flex flex-col">
      {/* Header - Full Width */}
      <div className="bg-white border-b border-gray-200 px-8 py-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{exam.title}</h1>
          {exam.description && (
            <p className="text-gray-600 mt-2">{exam.description}</p>
          )}
        </div>
        {exam.duration && exam.duration > 0 && (
          <Timer totalSeconds={Number(exam.duration) * 60} onTimeUp={handleTimeUp} />
        )}
      </div>

      {/* Content - Scrollable */}
      <div className="flex-1 overflow-y-auto px-8 py-6">
        <div className="space-y-6 max-w-6xl">
        {/* Main Content Layout */}
        {exam.fileContent ? (
          // Single Column Layout - File + Answer Selection Only
          <div className="flex flex-col gap-6">
            {/* File Content - Full Width */}
            <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                📄 {exam.fileName || 'Nội dung đề thi'}
              </h3>
              <div className="bg-gray-50 rounded-lg p-4 max-h-[600px] overflow-y-auto border border-gray-300 text-gray-700 whitespace-pre-wrap break-words text-base leading-7 font-mono">
                {exam.fileContent}
              </div>
            </div>

            {/* Answer Selection */}
            <div className="bg-white rounded-lg shadow-md p-6">
              {/* Question Counter */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-gray-600">
                    Câu {currentQuestionIndex + 1} / {questions.length}
                  </p>
                  <div className="text-sm font-semibold text-gray-600">
                    {Object.keys(answers).length} / {questions.length} đã trả lời
                  </div>
                </div>
                <div className="w-full bg-gray-300 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
                  />
                </div>
              </div>

              {/* Question Content */}
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-lg font-semibold text-gray-900 mb-3">{currentQuestion.content}</p>
                {currentQuestion.image && (
                  <img
                    src={currentQuestion.image}
                    alt="Question illustration"
                    className="max-w-full max-h-64 rounded-lg border border-gray-300"
                  />
                )}
              </div>

              {/* Answer Options */}
              <div className="mb-6">
                {questionDisplayType === 'MULTIPLE_CHOICE' && (
                  <div>
                    <p className="text-lg font-bold text-gray-900 mb-4">Chọn đáp án:</p>
                    <div className="grid grid-cols-4 gap-3">
                      {(currentQuestion.options && currentQuestion.options.length > 0 
                        ? currentQuestion.options 
                        : ['A', 'B', 'C', 'D']
                      ).map((option, idx) => (
                        <label key={idx} className="flex flex-col items-center p-2 border-2 border-gray-300 rounded-lg cursor-pointer hover:bg-blue-50 hover:border-blue-500 transition bg-white" style={{ color: 'black' }}>
                          <div className="flex items-center justify-center w-10 h-10 rounded-lg border-2 border-gray-400 bg-blue-100 font-bold text-lg text-blue-600">
                            <input
                              type="radio"
                              name={`question-${currentQuestion._id}`}
                              value={option}
                              checked={answers[currentQuestion._id!] === option}
                              onChange={(e) => handleAnswer(currentQuestion._id!, e.target.value)}
                              className="hidden"
                            />
                            {String.fromCharCode(65 + idx)}
                          </div>
                          {answers[currentQuestion._id!] === option && (
                            <div className="mt-1 text-green-500 text-base font-bold">✓</div>
                          )}
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {questionDisplayType === 'TRUE_FALSE' && (
                  <div className="space-y-4">
                    <p className="text-lg font-bold text-gray-900 mb-6">Chọn đáp án:</p>
                    {['Đúng', 'Sai'].map((option, idx) => (
                      <label key={option} className="flex items-center p-4 border-2 border-gray-300 rounded-lg cursor-pointer hover:bg-blue-50 hover:border-blue-500 transition bg-white" style={{ color: 'black' }}>
                        <div className="flex items-center justify-center w-12 h-12 rounded-lg border-2 border-gray-400 mr-4 flex-shrink-0 bg-blue-100 font-bold text-xl text-blue-600">
                          <input
                            type="radio"
                            name={`question-${currentQuestion._id}`}
                            value={option}
                            checked={answers[currentQuestion._id!] === option}
                            onChange={(e) => handleAnswer(currentQuestion._id!, e.target.value)}
                            className="hidden"
                          />
                          {String.fromCharCode(65 + idx)}
                        </div>
                        <span className="text-black text-lg flex-1">{option}</span>
                        {answers[currentQuestion._id!] === option && (
                          <div className="ml-2 text-green-500 text-2xl font-bold">✓</div>
                        )}
                      </label>
                    ))}
                  </div>
                )}

                {questionDisplayType === 'SHORT_ANSWER' && (
                  <div>
                    <p className="text-lg font-bold text-gray-900 mb-4">Nhập câu trả lời:</p>
                    <textarea
                      value={answers[currentQuestion._id!] || ''}
                      onChange={(e) => handleAnswer(currentQuestion._id!, e.target.value)}
                      placeholder="Nhập câu trả lời của bạn..."
                      className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black text-lg"
                      rows={6}
                    />
                  </div>
                )}
              </div>

              {/* Navigation */}
              <div className="flex gap-3 justify-between pt-6 border-t border-gray-200 mt-6">
                <button
                  onClick={handlePrevious}
                  disabled={currentQuestionIndex === 0}
                  className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-400 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ← Câu trước
                </button>

                <div className="relative">
                  <button
                    onClick={() => setShowQuestionMenu(!showQuestionMenu)}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition flex items-center gap-2"
                  >
                    ≡ Menu
                  </button>
                  
                  {showQuestionMenu && (
                    <div className="absolute bottom-full mb-2 bg-white border border-gray-300 rounded-lg shadow-lg p-3 grid grid-cols-5 gap-2 z-50 w-80">
                      {questions.map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            setCurrentQuestionIndex(idx);
                            setShowQuestionMenu(false);
                          }}
                          className={`w-12 h-10 rounded font-semibold transition ${
                            answers[questions[idx]._id!]
                              ? 'bg-green-500 text-white'
                              : idx === currentQuestionIndex
                              ? 'bg-blue-500 text-white'
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }`}
                        >
                          {idx + 1}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleNext}
                    disabled={currentQuestionIndex === questions.length - 1}
                    className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-400 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Câu tiếp →
                  </button>

                  {currentQuestionIndex === questions.length - 1 && (
                    <button
                      onClick={handleSubmit}
                      disabled={submitting}
                      className="px-8 py-2 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {submitting ? '⏳ Đang nộp...' : '✓ Nộp bài'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          // Two Column Layout - Existing behavior (no file)
          <div className="flex gap-6 flex-1 min-h-[600px]">
            {/* Right Panel - Question and Options */}
            <div className="flex-1 flex flex-col gap-4">
              {/* Question Counter */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-gray-600">
                    Câu {currentQuestionIndex + 1} / {questions.length}
                  </p>
                  <div className="text-sm font-semibold text-gray-600">
                    {Object.keys(answers).length} / {questions.length} đã trả lời
                  </div>
                </div>
                <div className="w-full bg-gray-300 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
                  />
                </div>
              </div>

              {/* Current Question */}
              <div className="bg-white rounded-lg shadow-md p-6 flex-1 flex flex-col">
                <h2 className="text-xl font-bold text-gray-900 mb-6">
                  {currentQuestion.content}
                </h2>

                {/* Question Image */}
                {currentQuestion.image && (
                  <div className="mb-6">
                    <img
                      src={currentQuestion.image}
                      alt="Question illustration"
                      className="max-w-full max-h-64 rounded-lg border border-gray-300"
                    />
                  </div>
                )}

                {/* Answer Options */}
                <div className="space-y-3 flex-1">
                  {questionDisplayType === 'MULTIPLE_CHOICE' && currentQuestion.options && currentQuestion.options.length > 0 && (
                    <div className="space-y-4">
                      <p className="text-sm font-semibold text-gray-700 mb-4">Chọn đáp án:</p>
                      {(currentQuestion.options as any as string[]).map((option, idx) => (
                        <label key={idx} className="flex items-center p-4 border-2 border-gray-300 rounded-lg cursor-pointer hover:bg-blue-50 hover:border-blue-500 transition bg-white" style={{ color: 'black' }}>
                          <div className="flex items-center justify-center w-10 h-10 rounded-lg border-2 border-gray-400 mr-4 flex-shrink-0 bg-gray-100 font-bold text-lg">
                            <input
                              type="radio"
                              name={`question-${currentQuestion._id}`}
                              value={option}
                              checked={answers[currentQuestion._id!] === option}
                              onChange={(e) => handleAnswer(currentQuestion._id!, e.target.value)}
                              className="hidden"
                            />
                            {String.fromCharCode(65 + idx)}
                          </div>
                          <span className="text-black text-base flex-1">{option}</span>
                          {answers[currentQuestion._id!] === option && (
                            <div className="ml-2 text-blue-500 text-xl font-bold">✓</div>
                          )}
                        </label>
                      ))}
                    </div>
                  )}

                  {questionDisplayType === 'TRUE_FALSE' && (
                    <div className="space-y-4">
                      <p className="text-sm font-semibold text-gray-700 mb-4">Chọn đáp án:</p>
                      {['Đúng', 'Sai'].map((option, idx) => (
                        <label key={option} className="flex items-center p-4 border-2 border-gray-300 rounded-lg cursor-pointer hover:bg-blue-50 hover:border-blue-500 transition bg-white" style={{ color: 'black' }}>
                          <div className="flex items-center justify-center w-10 h-10 rounded-lg border-2 border-gray-400 mr-4 flex-shrink-0 bg-gray-100 font-bold text-lg">
                            <input
                              type="radio"
                              name={`question-${currentQuestion._id}`}
                              value={option}
                              checked={answers[currentQuestion._id!] === option}
                              onChange={(e) => handleAnswer(currentQuestion._id!, e.target.value)}
                              className="hidden"
                            />
                            {String.fromCharCode(65 + idx)}
                          </div>
                          <span className="text-black text-base flex-1">{option}</span>
                          {answers[currentQuestion._id!] === option && (
                            <div className="ml-2 text-blue-500 text-xl font-bold">✓</div>
                          )}
                        </label>
                      ))}
                    </div>
                  )}

                  {questionDisplayType === 'SHORT_ANSWER' && (
                    <div>
                      <p className="text-sm font-semibold text-gray-700 mb-4">Nhập câu trả lời:</p>
                      <textarea
                        value={answers[currentQuestion._id!] || ''}
                        onChange={(e) => handleAnswer(currentQuestion._id!, e.target.value)}
                        placeholder="Nhập câu trả lời của bạn..."
                        className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                        rows={4}
                      />
                    </div>
                  )}
                </div>

                {/* Navigation */}
                <div className="flex gap-3 justify-between pt-6 border-t border-gray-200 mt-6">
                  <button
                    onClick={handlePrevious}
                    disabled={currentQuestionIndex === 0}
                    className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-400 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    ← Câu trước
                  </button>

                  <div className="relative">
                    <button
                      onClick={() => setShowQuestionMenu(!showQuestionMenu)}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition flex items-center gap-2"
                    >
                      ≡ Menu
                    </button>
                    
                    {showQuestionMenu && (
                      <div className="absolute bottom-full mb-2 bg-white border border-gray-300 rounded-lg shadow-lg p-3 grid grid-cols-5 gap-2 z-50 w-80">
                        {questions.map((_, idx) => (
                          <button
                            key={idx}
                            onClick={() => {
                              setCurrentQuestionIndex(idx);
                              setShowQuestionMenu(false);
                            }}
                            className={`w-12 h-10 rounded font-semibold transition ${
                              answers[questions[idx]._id!]
                                ? 'bg-green-500 text-white'
                                : idx === currentQuestionIndex
                                ? 'bg-blue-500 text-white'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                          >
                            {idx + 1}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={handleNext}
                      disabled={currentQuestionIndex === questions.length - 1}
                      className="px-6 py-2 bg-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-400 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Câu tiếp →
                    </button>

                    {currentQuestionIndex === questions.length - 1 && (
                      <button
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="px-8 py-2 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {submitting ? '⏳ Đang nộp...' : '✓ Nộp bài'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Confirmation Modal */}
        {showConfirmModal && (
          <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
            <div className="bg-white rounded-lg shadow-2xl p-8 max-w-sm pointer-events-auto">
              <h2 className="text-2xl font-bold text-gray-900 mb-4 pointer-events-auto">Xác nhận nộp bài</h2>
              <p className="text-gray-600 mb-6 pointer-events-auto">
                Bạn có chắc chắn muốn nộp bài kiểm tra này không? Bạn sẽ không thể thay đổi câu trả lời sau khi nộp.
              </p>
              <div className="flex gap-4">
                <button
                  onClick={cancelSubmit}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-400 transition pointer-events-auto"
                >
                  Hủy
                </button>
                <button
                  onClick={confirmSubmit}
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 transition disabled:opacity-50 pointer-events-auto"
                >
                  {submitting ? 'Đang nộp...' : 'Nộp bài'}
                </button>
              </div>
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
