'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import TeacherLayout from '@/layouts/TeacherLayout';
import submissionApi, { Submission } from '@/api/submission.api';
import examApi, { Exam } from '@/api/exam.api';

interface SubmissionDetail {
  _id: string;
  examId: string;
  userId: any; // Can be string or populated user object
  answers: Array<{
    questionId: string;
    answer: string;
  }>;
  score: number;
  submittedAt: string;
  userDetails?: {
    fullName: string;
    email: string;
  };
}

export default function StudentSubmissionPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const examId = params?.id as string;
  const studentId = params?.studentId as string;
  const submissionId = searchParams?.get('submissionId');

  const [submission, setSubmission] = useState<SubmissionDetail | null>(null);
  const [exam, setExam] = useState<Exam | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const formatDate = (dateString: string | undefined): string => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'N/A';
      return date.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return 'N/A';
    }
  };

  const getStudentName = (): string => {
    if (typeof submission?.userId === 'object' && submission.userId?.fullName) {
      return submission.userId.fullName;
    }
    if (submission?.userDetails?.fullName) {
      return submission.userDetails.fullName;
    }
    return 'Không xác định';
  };

  const getStudentEmail = (): string => {
    if (typeof submission?.userId === 'object' && submission.userId?.email) {
      return submission.userId.email;
    }
    if (submission?.userDetails?.email) {
      return submission.userDetails.email;
    }
    return 'N/A';
  };

  useEffect(() => {
    if (submissionId) {
      loadData();
    }
  }, [submissionId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');

      // Load submission details
      const submissionResponse = await submissionApi.getById(submissionId!);
      setSubmission(submissionResponse.data as unknown as SubmissionDetail);

      // Load exam details
      const examResponse = await examApi.getById(examId);
      setExam(examResponse.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Lỗi khi tải dữ liệu bài làm');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getQuestionAnswer = (questionId: string): string | undefined => {
    return submission?.answers?.find((a) => a.questionId === questionId)?.answer;
  };

  const checkAnswer = (
    question: any,
    studentAnswer: string | undefined
  ): { isCorrect: boolean; message: string } => {
    if (!studentAnswer) {
      return { isCorrect: false, message: 'Chưa trả lời' };
    }

    if (question.type === 'multiple-choice' || question.type === 'multiple_choice') {
      const correctOption = question.options?.find((opt: any) => opt.isCorrect);
      if (!correctOption) {
        return { isCorrect: false, message: 'Không có đáp án' };
      }
      const isCorrect = studentAnswer === correctOption.text || studentAnswer === correctOption._id;
      return {
        isCorrect,
        message: isCorrect ? 'Đúng' : 'Sai',
      };
    }

    if (question.type === 'true_false') {
      const isCorrect =
        studentAnswer.toLowerCase() === question.correctAnswer?.toLowerCase();
      return {
        isCorrect,
        message: isCorrect ? 'Đúng' : 'Sai',
      };
    }

    // For short answer questions, we can't automatically verify
    return {
      isCorrect: false,
      message: 'Cần kiểm tra thủ công',
    };
  };

  if (loading) {
    return (
      <TeacherLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-gray-600">Đang tải...</div>
        </div>
      </TeacherLayout>
    );
  }

  if (error || !submission || !exam) {
    return (
      <TeacherLayout>
        <div className="space-y-6">
          <button
            onClick={() => router.back()}
            className="text-blue-600 hover:text-blue-700 font-semibold"
          >
            ← Quay lại
          </button>
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error || 'Không tìm thấy dữ liệu bài làm'}
          </div>
        </div>
      </TeacherLayout>
    );
  }

  const totalQuestions = exam.questions?.length || 0;
  const score = submission.score ?? 0;
  const scoreOut10 = (score / 10).toFixed(1);
  const isPassed = exam.passingPercentage ? score >= exam.passingPercentage : false;

  return (
    <TeacherLayout>
      <div className="space-y-6">
        <button
          onClick={() => router.back()}
          className="text-blue-600 hover:text-blue-700 font-semibold"
        >
          ← Quay lại
        </button>

        {/* Header */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="mb-4">
            <h1 className="text-3xl font-bold text-gray-900">{exam.title}</h1>
            {exam.description && (
              <p className="text-gray-600 mt-2">{exam.description}</p>
            )}
          </div>

          <div className="border-t pt-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-gray-600 text-sm font-semibold">Học sinh</p>
                <p className="text-xl font-bold text-gray-900">
                  {getStudentName()}
                </p>
              </div>
              <div>
                <p className="text-gray-600 text-sm font-semibold">Email</p>
                <p className="text-lg text-gray-900">
                  {getStudentEmail()}
                </p>
              </div>
              <div>
                <p className="text-gray-600 text-sm font-semibold">Ngày làm</p>
                <p className="text-lg text-gray-900">
                  {formatDate(submission.submittedAt)}
                </p>
              </div>
              <div>
                <p className="text-gray-600 text-sm font-semibold">Điểm</p>
                <p className={`text-2xl font-bold ${isPassed ? 'text-green-600' : 'text-red-600'}`}>
                  {scoreOut10}/10
                </p>
              </div>
            </div>

            {exam.passingPercentage && (
              <div className="mt-4 pt-4 border-t">
                <span className={`inline-block px-4 py-2 rounded-full font-semibold ${
                  isPassed
                    ? 'bg-green-100 text-green-700'
                    : 'bg-red-100 text-red-700'
                }`}>
                  {isPassed ? '✓ Đạt' : '✗ Không đạt'} (yêu cầu: {(exam.passingPercentage / 10).toFixed(1)}/10)
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Questions and Answers */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Chi tiết bài làm
          </h2>

          {exam.questions && exam.questions.length > 0 ? (
            <div className="space-y-6">
              {exam.questions.map((question: any, idx: number) => {
                const studentAnswer = getQuestionAnswer(question._id || `question-${idx}`);
                const answerCheck = checkAnswer(question, studentAnswer);

                return (
                  <div
                    key={question._id || `question-${idx}`}
                    className="border border-gray-200 rounded-lg p-6"
                  >
                    {/* Question Header */}
                    <div className="flex items-start gap-4 mb-4">
                      <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-semibold">
                        {idx + 1}
                      </div>
                      <div className="flex-1">
                        <p className="text-lg font-semibold text-gray-900">
                          {question.content}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          Loại: {
                            question.type === 'multiple-choice' || question.type === 'multiple_choice'
                              ? 'Trắc nghiệm'
                              : question.type === 'short-answer' || question.type === 'short_answer'
                              ? 'Trả lời ngắn'
                              : question.type === 'true_false'
                              ? 'Đúng/Sai'
                              : 'Khác'
                          }
                        </p>
                      </div>
                    </div>

                    {/* Student Answer */}
                    <div className="space-y-4 mt-6">
                      <div className={`p-4 rounded-lg border-l-4 ${
                        answerCheck.isCorrect
                          ? 'bg-green-50 border-green-500'
                          : 'bg-blue-50 border-blue-500'
                      }`}>
                        <p className="text-sm font-semibold text-gray-700 mb-2">
                          Câu trả lời của học sinh:
                        </p>
                        <p className="text-gray-900">
                          {studentAnswer || 'Chưa trả lời'}
                        </p>
                      </div>

                      {/* Correct Answer */}
                      <div className="p-4 rounded-lg bg-green-50 border-l-4 border-green-500">
                        <p className="text-sm font-semibold text-gray-700 mb-2">
                          Đáp án đúng:
                        </p>
                        {question.type === 'multiple-choice' || question.type === 'multiple_choice' ? (
                          <div className="space-y-2">
                            {question.options?.map((option: any, optIdx: number) => (
                              <div key={optIdx}>
                                {option.isCorrect && (
                                  <p className="text-green-700 font-medium">
                                    {String.fromCharCode(65 + optIdx)}) {option.text}
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-gray-900">
                            {question.correctAnswer || 'Không xác định'}
                          </p>
                        )}
                      </div>

                      {/* Result */}
                      <div className={`p-4 rounded-lg text-center font-semibold ${
                        answerCheck.isCorrect
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {answerCheck.message}
                      </div>

                      {/* Explanation */}
                      {question.explanation && (
                        <div className="p-4 rounded-lg bg-yellow-50 border border-yellow-200">
                          <p className="text-sm font-semibold text-gray-700 mb-2">Giải thích:</p>
                          <p className="text-gray-900">{question.explanation}</p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              Chưa có câu hỏi nào
            </div>
          )}
        </div>
      </div>
    </TeacherLayout>
  );
}
