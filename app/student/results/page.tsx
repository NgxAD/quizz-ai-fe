'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import StudentLayout from '@/layouts/StudentLayout';
import submissionApi from '@/api/submission.api';
import examApi from '@/api/exam.api';

interface SubmissionWithExam {
  _id: string;
  quizId: string | any;
  userId: string;
  score?: number;
  submittedAt?: string;
  result?: {
    score: number;
    correctAnswers: number;
    wrongAnswers: number;
    skipped: number;
    totalPoints: number;
    isPassed: boolean;
  };
  examTitle?: string;
  examDuration?: number;
}

export default function StudentResultsPage() {
  const router = useRouter();

  const [submissions, setSubmissions] = useState<SubmissionWithExam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadAllResults();
  }, []);

  const loadAllResults = async () => {
    try {
      setLoading(true);
      // Get all submissions for the current user
      const response = await submissionApi.getUserSubmissions();
      const submissionsData = response.data as any[];

      // Enrich submissions with exam details
      const enrichedSubmissions = await Promise.all(
        submissionsData.map(async (sub) => {
          try {
            const quizId = typeof sub.quizId === 'string' ? sub.quizId : (sub.quizId as any)._id;
            const examResponse = await examApi.getById(quizId);
            return {
              ...sub,
              examTitle: examResponse.data.title,
              examDuration: examResponse.data.duration,
            };
          } catch (err) {
            console.error('Error loading exam details for submission:', sub._id, err);
            return {
              ...sub,
              examTitle: 'Bài kiểm tra',
              examDuration: 0,
            };
          }
        })
      );

      // Sort by submission date, newest first
      enrichedSubmissions.sort((a, b) => {
        const dateA = new Date(a.submittedAt || '').getTime();
        const dateB = new Date(b.submittedAt || '').getTime();
        return dateB - dateA;
      });

      setSubmissions(enrichedSubmissions);
      setError('');
    } catch (err: any) {
      console.error('Error loading submissions:', err);
      const errorMsg = err.response?.data?.message || err.message || 'Lỗi khi tải danh sách kết quả';
      setError(errorMsg);
      setSubmissions([]);
    } finally {
      setLoading(false);
    }
  };

  const getScoreOutOf10 = (submission: SubmissionWithExam) => {
    if (submission.result) {
      const totalQuestions = submission.result.correctAnswers + submission.result.wrongAnswers + submission.result.skipped;
      return totalQuestions > 0 
        ? ((submission.result.correctAnswers / totalQuestions) * 10).toFixed(1)
        : '0';
    }
    return 'N/A';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', { 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
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
        <div className="space-y-6">
          <button
            onClick={() => router.back()}
            className="text-blue-600 hover:text-blue-700 font-semibold"
          >
            ← Quay lại
          </button>
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        </div>
      </StudentLayout>
    );
  }

  return (
    <StudentLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">Kết quả bài kiểm tra</h1>

        {submissions.length === 0 ? (
          <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded text-center">
            Bạn chưa hoàn thành bài kiểm tra nào
          </div>
        ) : (
          <div className="grid gap-4">
            {submissions.map((submission) => {
              const scoreOutOf10 = getScoreOutOf10(submission);
              const isPassed = submission.result?.isPassed ?? false;

              return (
                <div
                  key={submission._id}
                  onClick={() => router.push(`/student/results/${submission._id}`)}
                  className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition cursor-pointer border-l-4"
                  style={{
                    borderLeftColor: isPassed ? '#10b981' : '#ef4444'
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {submission.examTitle}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">
                        Hoàn thành: {formatDate(submission.submittedAt || '')}
                      </p>
                      {submission.result && (
                        <div className="mt-2 text-sm text-gray-600">
                          <span className="font-medium text-green-600">
                            {submission.result.correctAnswers} đúng
                          </span>
                          {' • '}
                          <span className="font-medium text-red-600">
                            {submission.result.wrongAnswers} sai
                          </span>
                          {' • '}
                          <span className="font-medium text-yellow-600">
                            {submission.result.skipped} bỏ qua
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="text-right ml-4">
                      <div className={`text-3xl font-bold ${isPassed ? 'text-green-600' : 'text-red-600'}`}>
                        {scoreOutOf10}/10
                      </div>
                      <div className="text-sm mt-2">
                        {isPassed ? (
                          <span className="text-green-600 font-semibold">✓ Đạt yêu cầu</span>
                        ) : (
                          <span className="text-red-600 font-semibold">✗ Không đạt</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </StudentLayout>
  );
}
