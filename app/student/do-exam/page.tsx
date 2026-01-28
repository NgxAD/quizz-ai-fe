'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import StudentLayout from '@/layouts/StudentLayout';
import Timer from '@/components/Timer';
import examApi from '@/api/exam.api';
import submissionApi from '@/api/submission.api';

interface Question {
  _id: string;
  content: string;
  type: 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'SHORT_ANSWER';
  options?: string[];
}

interface Exam {
  _id: string;
  title: string;
  description?: string;
  duration?: number;
  passingPercentage?: number;
  questionIds?: string[];
  questions?: Question[];
}

export default function DoExamPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const examId = searchParams?.get('examId') as string;

  const [exam, setExam] = useState<Exam | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [timeUp, setTimeUp] = useState(false);
  const [submissionId, setSubmissionId] = useState<string | null>(null);

  useEffect(() => {
    if (examId) {
      loadExam();
    }
  }, [examId]);

  const loadExam = async () => {
    try {
      setLoading(true);
      const examResponse = await examApi.getById(examId);
      setExam(examResponse.data);
      console.log('Exam loaded:', examResponse.data);

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
            _id: q._id || q.id,
            content: q.content,
            type: questionType,
            options: optionsArray
          };
        });
        setQuestions(questionsData);
      }

      // Start the exam to create a submission record
      if (examResponse.data._id) {
        try {
          console.log('Starting exam:', examResponse.data._id);
          const submissionResponse = await submissionApi.startExam(examResponse.data._id);
          console.log('Submission started:', submissionResponse.data);
          // Backend returns { submission: { _id, ... }, exam: { ... } }
          const submissionId = submissionResponse.data.submission?._id || submissionResponse.data._id;
          if (!submissionId) {
            throw new Error('No submission ID returned from server');
          }
          setSubmissionId(submissionId);
        } catch (submissionErr: any) {
          console.error('Error starting exam:', submissionErr);
          const errorMsg = submissionErr.response?.data?.message || 'Lỗi khi bắt đầu bài kiểm tra';
          setError(errorMsg);
          return;
        }
      }

      setError('');
    } catch (err: any) {
      console.error('Error loading exam:', err);
      setError(err.response?.data?.message || 'Lỗi khi tải bài kiểm tra');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (questionId: string, answer: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer
    }));
  };

  const handleSubmit = async () => {
    if (!exam || !submissionId) {
      console.error('Missing exam or submissionId:', { exam: !!exam, submissionId });
      setError('Lỗi: Bài kiểm tra hoặc session không hợp lệ');
      return;
    }

    try {
      setSubmitting(true);
      
      // First, save all answers
      const saveData = {
        answers: Object.entries(answers).map(([questionId, answer]) => ({
          questionId,
          answer
        }))
      };

      console.log('Saving answers:', { submissionId, answerCount: saveData.answers.length, saveData });
      
      try {
        await submissionApi.saveAnswers(submissionId, saveData);
        console.log('Answers saved successfully');
      } catch (saveErr: any) {
        console.error('Error saving answers:', saveErr.response?.data || saveErr.message);
        const errorMsg = saveErr.response?.data?.message || 'Lỗi khi lưu đáp án';
        setError(errorMsg);
        return;
      }

      // Then, submit the exam
      const submitData = {
        notes: '',
        timeElapsed: undefined
      };

      console.log('Submitting exam:', { submissionId, submitData });
      
      const response = await submissionApi.submitExam(submissionId, submitData);
      
      console.log('Submission response:', response.data);
      
      // Redirect to results page - use result ID from response
      const resultId = response.data.result?._id || response.data._id;
      router.push(`/student/results?submissionId=${resultId}`);
    } catch (err: any) {
      console.error('Submission error:', err);
      const errorMsg = err.response?.data?.message || err.message || 'Lỗi khi nộp bài';
      setError(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <StudentLayout>
        <div className="text-center py-12">
          <div className="text-gray-500">Đang tải bài kiểm tra...</div>
        </div>
      </StudentLayout>
    );
  }

  if (!exam) {
    return (
      <StudentLayout>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error || 'Không tìm thấy bài kiểm tra'}
        </div>
      </StudentLayout>
    );
  }

  return (
    <StudentLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{exam.title}</h1>
            {exam.description && (
              <p className="text-gray-600 mt-2">{exam.description}</p>
            )}
          </div>
          {exam.duration && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <Timer totalSeconds={exam.duration * 60} onTimeUp={() => {
                setTimeUp(true);
                handleSubmit();
              }} />
            </div>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <div className="bg-white rounded-lg shadow p-6">
          {questions.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              Bài kiểm tra không có câu hỏi
            </div>
          ) : (
            <>
          <div className="mb-6 pb-6 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-600">
                Câu hỏi {currentQuestionIndex + 1} / {questions.length}
              </p>
              <div className="flex gap-1">
                {questions.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentQuestionIndex(idx)}
                    className={`w-8 h-8 rounded text-xs font-semibold transition ${
                      answers[questions[idx]._id]
                        ? 'bg-green-500 text-white'
                        : idx === currentQuestionIndex
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                    }`}
                  >
                    {idx + 1}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {questions.length > 0 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  {questions[currentQuestionIndex]?.content}
                </h2>

                <div className="space-y-3">
                  {questions[currentQuestionIndex]?.type === 'MULTIPLE_CHOICE' && (
                    <div className="space-y-2">
                      {questions[currentQuestionIndex]?.options && questions[currentQuestionIndex].options.length > 0 ? (
                        questions[currentQuestionIndex].options.map((option, idx) => (
                          <label key={idx} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                            <input
                              type="radio"
                              name={`question-${questions[currentQuestionIndex]._id}`}
                              value={option}
                              checked={answers[questions[currentQuestionIndex]._id] === option}
                              onChange={(e) => handleAnswerChange(questions[currentQuestionIndex]._id, e.target.value)}
                              className="w-4 h-4"
                            />
                            <span className="text-gray-900">{option}</span>
                          </label>
                        ))
                      ) : (
                        <div className="text-gray-500 text-sm">Không có lựa chọn nào cho câu hỏi này</div>
                      )}
                    </div>
                  )}

                  {questions[currentQuestionIndex]?.type === 'TRUE_FALSE' && (
                    <div className="space-y-2">
                      {['Đúng', 'Sai'].map((option) => (
                        <label key={option} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                          <input
                            type="radio"
                            name={`question-${questions[currentQuestionIndex]._id}`}
                            value={option}
                            checked={answers[questions[currentQuestionIndex]._id] === option}
                            onChange={(e) => handleAnswerChange(questions[currentQuestionIndex]._id, e.target.value)}
                            className="w-4 h-4"
                          />
                          <span>{option}</span>
                        </label>
                      ))}
                    </div>
                  )}

                  {questions[currentQuestionIndex]?.type === 'SHORT_ANSWER' && (
                    <textarea
                      value={answers[questions[currentQuestionIndex]._id] || ''}
                      onChange={(e) => handleAnswerChange(questions[currentQuestionIndex]._id, e.target.value)}
                      placeholder="Nhập câu trả lời của bạn..."
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-32"
                    />
                  )}
                </div>
              </div>

              <div className="flex gap-3 justify-between pt-6 border-t border-gray-200">
                <button
                  onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                  disabled={currentQuestionIndex === 0}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  Câu trước
                </button>

                <button
                  onClick={() => setCurrentQuestionIndex(prev => Math.min(questions.length - 1, prev + 1))}
                  disabled={currentQuestionIndex === questions.length - 1}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  Câu tiếp theo
                </button>

                <button
                  onClick={handleSubmit}
                  disabled={submitting || timeUp}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  {submitting ? 'Đang nộp...' : 'Nộp bài'}
                </button>
              </div>
            </div>
          )}
            </>
          )}
        </div>
      </div>
    </StudentLayout>
  );
}
