'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import StudentLayout from '@/layouts/StudentLayout';
import submissionApi from '@/api/submission.api';
import examApi, { Exam } from '@/api/exam.api';

interface Submission {
  _id: string;
  userId?: string;
  score?: number;
  submittedAt?: string;
  quizId?: string | any;
  answers?: Array<{
    questionId: string;
    answer: string | string[];
    isCorrect: boolean;
  }>;
  result?: {
    score: number;
    correctAnswers: number;
    wrongAnswers: number;
    skipped: number;
    totalPoints: number;
    isPassed: boolean;
  };
}

export default function ResultsPage() {
  const router = useRouter();
  const params = useParams();
  const submissionId = params?.id as string | undefined;

  const [submission, setSubmission] = useState<Submission | null>(null);
  const [exam, setExam] = useState<Exam | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (submissionId) {
      loadResults();
    }
  }, [submissionId]);

  const loadResults = async () => {
    try {
      setLoading(true);
      const response = await submissionApi.getById(submissionId!);
      const submissionData = response.data as any as Submission;
      setSubmission(submissionData);
      
      // Load exam data to check examType
      if (submissionData.quizId) {
        const quizId = typeof submissionData.quizId === 'string' 
          ? submissionData.quizId 
          : (submissionData.quizId as any)._id;
        try {
          const examResponse = await examApi.getById(quizId);
          setExam(examResponse.data);
        } catch (examErr) {
          console.error('Error loading exam details:', examErr);
        }
      }
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Lỗi khi tải kết quả');
      console.error('Error loading results:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <StudentLayout>
        <div className="text-center py-12">
          <div className="text-gray-500">Đang tải kết quả...</div>
        </div>
      </StudentLayout>
    );
  }

  if (error) {
    return (
      <StudentLayout>
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
        <button
          onClick={() => router.push('/student/exams')}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
        >
          Quay lại
        </button>
      </StudentLayout>
    );
  }

  if (!submission) {
    return (
      <StudentLayout>
        <div className="text-center py-12">
          <div className="text-gray-500">Không tìm thấy kết quả</div>
        </div>
      </StudentLayout>
    );
  }

  // Calculate score out of 10
  let scoreOutOf10 = 'N/A';
  if (submission.result) {
    const totalQuestions = submission.result.correctAnswers + submission.result.wrongAnswers + submission.result.skipped;
    scoreOutOf10 = totalQuestions > 0 
      ? ((submission.result.correctAnswers / totalQuestions) * 10).toFixed(0)
      : '0';
  }

  return (
    <StudentLayout>
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-8">Kết Quả Bài Kiểm Tra</h1>

          {/* Score Display */}
          <div className="text-center mb-8">
            <div className="text-6xl font-bold text-blue-600 mb-4">
              {scoreOutOf10}/10
            </div>
            <div className="text-xl text-gray-600">
              {scoreOutOf10 !== 'N/A' && parseFloat(scoreOutOf10) >= 5 ? (
                <span className="text-green-600 font-semibold">✓ Đạt yêu cầu</span>
              ) : (
                <span className="text-red-600 font-semibold">✗ Không đạt</span>
              )}
            </div>
          </div>

          {/* Breakdown */}
          {submission.result && (
            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="bg-green-50 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">
                  {submission.result.correctAnswers}
                </div>
                <div className="text-gray-600">Đúng</div>
              </div>
              <div className="bg-red-50 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-red-600 mb-2">
                  {submission.result.wrongAnswers}
                </div>
                <div className="text-gray-600">Sai</div>
              </div>
              <div className="bg-yellow-50 rounded-lg p-4 text-center">
                <div className="text-3xl font-bold text-yellow-600 mb-2">
                  {submission.result.skipped}
                </div>
                <div className="text-gray-600">Chưa trả lời</div>
              </div>
            </div>
          )}



          {/* Action Buttons */}
          <div className="flex gap-4 justify-center flex-wrap">
            <button
              onClick={() => router.push('/student/exams')}
              className="px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
            >
              ← Quay lại danh sách
            </button>
            {submission.quizId && (exam as any)?.type === 'exercise' && (
              <button
                onClick={() => {
                  // Handle both string ID and populated object
                  const quizId = typeof submission.quizId === 'string' 
                    ? submission.quizId 
                    : (submission.quizId as any)._id;
                  router.push(`/student/do-exam/${quizId}?retry=true`);
                }}
                className="px-8 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition"
              >
                Làm lại bài
              </button>
            )}
            {submission.quizId && (exam as any)?.type === 'test' && (
              <button
                disabled
                className="px-8 py-3 bg-gray-400 text-white rounded-lg font-semibold cursor-not-allowed"
                title="Bài kiểm tra chỉ làm được một lần"
              >
                Không thể làm lại (Bài kiểm tra)
              </button>
            )}
          </div>

          {/* Show Full Exam Details for Exercises */}
          {submission.quizId && (exam as any)?.type === 'exercise' && exam?.questions && (
            <div className="mt-12 border-t pt-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">📋 Chi tiết đề thi</h2>
              
              <div className="space-y-6">
                {exam.questions.map((question: any, qIdx: number) => {
                  // Find student's answer for this question
                  const studentAnswer = submission.answers?.find((a: any) => 
                    a.questionId === question._id || a.questionId === (question as any)._id
                  );
                  
                  return (
                    <div key={question._id || qIdx} className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                      <div className="flex items-start gap-4 mb-4">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                          {qIdx + 1}
                        </div>
                        <div className="flex-1">
                          <p className="text-gray-900 font-semibold">{question.content}</p>
                        </div>
                        <div>
                          {studentAnswer?.isCorrect ? (
                            <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-semibold rounded-full">✓ Đúng</span>
                          ) : (
                            <span className="px-3 py-1 bg-red-100 text-red-700 text-sm font-semibold rounded-full">✗ Sai</span>
                          )}
                        </div>
                      </div>

                      {/* Show options if multiple choice */}
                      {question.type === 'multiple_choice' && question.options && (
                        <div className="space-y-2 ml-12">
                          {question.options.map((option: any, optIdx: number) => {
                            const isStudentSelected = studentAnswer?.answer === String.fromCharCode(65 + optIdx);
                            const isCorrectAnswer = option.isCorrect;
                            
                            return (
                              <div
                                key={optIdx}
                                className={`p-3 rounded-lg border-2 ${
                                  isCorrectAnswer
                                    ? 'border-green-500 bg-green-50'
                                    : isStudentSelected
                                    ? 'border-red-500 bg-red-50'
                                    : 'border-gray-200 bg-white'
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-gray-700 min-w-8">
                                    {String.fromCharCode(65 + optIdx)})
                                  </span>
                                  <span className="text-gray-900 flex-1">{option.text}</span>
                                  {isCorrectAnswer && (
                                    <span className="text-green-600 font-bold">✓ Đáp án</span>
                                  )}
                                  {isStudentSelected && !isCorrectAnswer && (
                                    <span className="text-red-600 font-bold">← Câu trả lời của bạn</span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Show short answer if available */}
                      {question.type === 'short_answer' && (
                        <div className="ml-12 space-y-2">
                          <div>
                            <p className="text-sm text-gray-600 font-semibold mb-2">Câu trả lời của bạn:</p>
                            <div className="p-3 bg-white border border-gray-300 rounded-lg text-gray-900">
                              {studentAnswer?.answer || '(Không trả lời)'}
                            </div>
                          </div>
                          {question.correctAnswer && (
                            <div>
                              <p className="text-sm text-gray-600 font-semibold mb-2">Đáp án tham khảo:</p>
                              <div className="p-3 bg-green-50 border border-green-300 rounded-lg text-gray-900">
                                {question.correctAnswer}
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Show true/false answer if available */}
                      {question.type === 'true_false' && (
                        <div className="ml-12 space-y-2">
                          <p className="text-sm text-gray-600 font-semibold">Câu trả lời của bạn:</p>
                          <div className="flex gap-3">
                            <button
                              disabled
                              className={`px-4 py-2 rounded-lg font-semibold ${
                                studentAnswer?.answer === 'true'
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-gray-200 text-gray-600'
                              }`}
                            >
                              Đúng
                            </button>
                            <button
                              disabled
                              className={`px-4 py-2 rounded-lg font-semibold ${
                                studentAnswer?.answer === 'false'
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-gray-200 text-gray-600'
                              }`}
                            >
                              Sai
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </StudentLayout>
  );
}
