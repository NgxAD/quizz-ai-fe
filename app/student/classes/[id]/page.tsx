'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import StudentLayout from '@/layouts/StudentLayout';
import classApi from '@/api/class.api';
import examApi from '@/api/exam.api';
import submissionApi from '@/api/submission.api';

interface Student {
  _id: string;
  fullName: string;
  email: string;
}

interface ClassDetail {
  _id: string;
  name: string;
  description?: string;
  code: string;
  students: Student[];
  exams?: any[];
}

interface Exam {
  _id: string;
  title: string;
  description?: string;
  duration?: number;
  passingPercentage?: number;
  totalQuestions?: number;
  examType?: 'exercise' | 'test'; // exercise = bài tập, test = kiểm tra
}

interface Submission {
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
}

export default function ClassDetailPage() {
  const router = useRouter();
  const params = useParams();
  const classId = params?.id as string | undefined;

  const [classData, setClassData] = useState<ClassDetail | null>(null);
  const [exams, setExams] = useState<Exam[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'incomplete' | 'pending' | 'history'>('incomplete');

  useEffect(() => {
    if (classId) {
      loadClassData();
    }
  }, [classId]);

  const loadClassData = async () => {
    try {
      setLoading(true);
      const classResponse = await classApi.getById(classId!);
      const classInfo: ClassDetail = {
        _id: classResponse.data._id,
        name: classResponse.data.name,
        description: classResponse.data.description,
        code: classResponse.data.code,
        students: [],
        exams: classResponse.data.assignedExams || [],
      };
      
      setClassData(classInfo);

      // Load students
      try {
        const membersResponse = await classApi.getMembers(classId!);
        setClassData((prev) => prev ? { ...prev, students: membersResponse.data } : null);
      } catch (err: any) {
        console.error('Error loading members:', err);
      }

      // Load exams FIRST (before submissions)
      let loadedExams: Exam[] = [];
      if (classResponse.data.assignedExams && classResponse.data.assignedExams.length > 0) {
        try {
          const examIds = classResponse.data.assignedExams;
          const examPromises = examIds.map((examId: string) => examApi.getById(examId));
          const examResponses = await Promise.allSettled(examPromises);
          loadedExams = examResponses
            .filter((response) => response.status === 'fulfilled')
            .map((response: any) => response.value.data);
          setExams(loadedExams);
        } catch (err: any) {
          console.error('Error loading exams:', err);
        }
      }

      // Load submissions AFTER exams (so we can enrich with exam titles)
      try {
        const submissionsResponse = await submissionApi.getUserSubmissions();
        if (Array.isArray(submissionsResponse.data)) {
          const mappedSubmissions = submissionsResponse.data.map((s: any) => {
            const quizId = s.quizId ? (typeof s.quizId === 'string' ? s.quizId : s.quizId._id) : null;
            
            // Find exam title and passingPercentage from quizId populated data
            let examTitle = 'Bài thi';
            if (s.quizId && typeof s.quizId === 'object') {
              examTitle = s.quizId.title || 'Bài thi';
            }

            // Use resultId if available (populated from backend), otherwise compute from answers
            let resultData: any = {
              score: 0,
              correctAnswers: 0,
              wrongAnswers: 0,
              skipped: 0,
              totalPoints: 100,
              isPassed: false,
            };

            if (s.resultId && typeof s.resultId === 'object') {
              // Use populated result - this is the source of truth (calculated at submit time)
              resultData = {
                score: s.resultId.score || 0,
                correctAnswers: s.resultId.correctAnswers || 0,
                wrongAnswers: s.resultId.wrongAnswers || 0,
                skipped: s.resultId.skipped || 0,
                totalPoints: s.resultId.totalPoints || 100,
                isPassed: s.resultId.isPassed,
              };
            } else {
              // Fallback: compute from answers array (for old submissions without resultId link)
              let correctAnswers = 0;
              let wrongAnswers = 0;
              let skipped = 0;

              if (Array.isArray(s.answers)) {
                s.answers.forEach((ans: any) => {
                  if (ans.isCorrect) {
                    correctAnswers++;
                  } else if (ans.answer) {
                    wrongAnswers++;
                  } else {
                    skipped++;
                  }
                });
              }

              // Assume passed if more correct than wrong (fallback heuristic)
              const isPassed = correctAnswers > wrongAnswers;

              resultData = {
                score: s.score || 0,
                correctAnswers,
                wrongAnswers,
                skipped,
                totalPoints: s.totalPoints || 100,
                isPassed,
              };
            }

            return {
              ...s,
              quizId,
              examTitle,
              score: resultData.score,
              result: resultData,
            };
          }) as Submission[];
          setSubmissions(mappedSubmissions);
        }
      } catch (err: any) {
        console.error('Error loading submissions:', err);
      }
      
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Lỗi khi tải thông tin lớp');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Helper functions to filter exams
  const getExamStatus = (examId: string) => {
    const submission = submissions.find((s) => s.quizId?._id === examId || s.quizId === examId);
    return submission;
  };

  // Đề thi chưa hoàn thành (test type chưa làm)
  const incompleteExams = exams.filter((exam) => {
    if (exam.examType !== 'test') return false;
    const submission = getExamStatus(exam._id);
    // Test: hiện nếu chưa làm
    return !submission;
  });

  // Bài tập chưa hoàn thành - exercise type chưa làm hoặc start nhưng chưa submit
  const pendingExams = exams.filter((exam) => {
    if (exam.examType !== 'exercise') return false;
    const submission = getExamStatus(exam._id);
    
    // Chưa làm
    if (!submission) return true;
    // Start nhưng chưa submit
    if (!submission.submittedAt) return true;
    // Đã submit - không show ở tab này
    return false;
  });

  const historySubmissions = (() => {
    // Lọc submissions của class này
    const classSubmissions = submissions.filter((s) => 
      s.quizId && exams.some((e) => e._id === (typeof s.quizId === 'string' ? s.quizId : s.quizId._id))
    );

    // Dedup: chỉ lấy submission mới nhất cho mỗi quizId (tránh hiển thị lại khi student làm lại)
    const submissionMap = new Map<string, Submission>();
    classSubmissions.forEach((submission) => {
      const quizId = typeof submission.quizId === 'string' ? submission.quizId : submission.quizId._id;
      const existing = submissionMap.get(quizId);
      
      // Chỉ giữ submission với submittedAt mới nhất
      if (!existing || new Date(submission.submittedAt || 0) > new Date(existing.submittedAt || 0)) {
        submissionMap.set(quizId, submission);
      }
    });

    return Array.from(submissionMap.values());
  })();

  if (loading) {
    return (
      <StudentLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-gray-600">Đang tải...</div>
        </div>
      </StudentLayout>
    );
  }

  if (error || !classData) {
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
            {error || 'Không tìm thấy lớp'}
          </div>
        </div>
      </StudentLayout>
    );
  }

  return (
    <StudentLayout>
      <div className="space-y-6">
        {/* Header */}
        <button
          onClick={() => router.back()}
          className="text-blue-600 hover:text-blue-700 font-semibold"
        >
          ← Quay lại
        </button>

        {/* Class Info */}
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">{classData.name}</h1>
          <p className="text-gray-600 text-lg mb-4">Mã lớp: <span className="font-semibold">{classData.code}</span></p>
          
          {classData.description && (
            <p className="text-gray-600 text-lg mb-4">{classData.description}</p>
          )}

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-4 border-t">
            <div>
              <p className="text-gray-600 text-sm font-semibold">Số học sinh</p>
              <p className="text-2xl font-bold text-gray-900">{classData.students?.length || 0}</p>
            </div>
            <div>
              <p className="text-gray-600 text-sm font-semibold">Số bài giao</p>
              <p className="text-2xl font-bold text-gray-900">{exams.length}</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow">
          <div className="border-b flex">
            <button
              onClick={() => setActiveTab('incomplete')}
              className={`px-6 py-4 font-semibold transition border-b-2 ${
                activeTab === 'incomplete'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Đề thi chưa hoàn thành ({incompleteExams.length})
            </button>
            <button
              onClick={() => setActiveTab('pending')}
              className={`px-6 py-4 font-semibold transition border-b-2 ${
                activeTab === 'pending'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Bài tập chưa hoàn thành ({pendingExams.length})
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-6 py-4 font-semibold transition border-b-2 ${
                activeTab === 'history'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              Lịch sử thi/nộp bài gần đây
            </button>
          </div>

          <div className="p-6">
            <div className="space-y-4">
              {activeTab === 'incomplete' && (
                incompleteExams.length > 0 ? (
                  <div className="space-y-4">
                    {incompleteExams.map((exam) => (
                      <div
                        key={exam._id}
                        className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-md transition cursor-pointer"
                        onClick={() => router.push(`/student/do-exam/${exam._id}`)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">{exam.title}</h3>
                            {exam.description && (
                              <p className="text-gray-600 text-sm mb-3">{exam.description}</p>
                            )}
                            <div className="grid grid-cols-3 gap-4 text-sm">
                              <div>
                                <p className="text-gray-500">Thời gian</p>
                                <p className="font-semibold text-gray-900">{exam.duration || '-'} phút</p>
                              </div>
                              <div>
                                <p className="text-gray-500">Câu hỏi</p>
                                <p className="font-semibold text-gray-900">{exam.totalQuestions || 0}</p>
                              </div>
                              <div>
                                <p className="text-gray-500">Điểm đạt</p>
                                <p className="font-semibold text-gray-900">{(exam.passingPercentage || 50) / 10}/10</p>
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/student/do-exam/${exam._id}`);
                            }}
                            className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition whitespace-nowrap ml-4"
                          >
                            Làm bài
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    Không có đề thi nào chưa hoàn thành
                  </div>
                )
              )}

              {activeTab === 'pending' && (
                pendingExams.length > 0 ? (
                  <div className="space-y-4">
                    {pendingExams.map((exam) => {
                      const submission = getExamStatus(exam._id);
                      return (
                        <div
                          key={exam._id}
                          className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-md transition cursor-pointer"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className="text-lg font-semibold text-gray-900 mb-2">{exam.title}</h3>
                              {exam.description && (
                                <p className="text-gray-600 text-sm mb-3">{exam.description}</p>
                              )}
                              <div className="grid grid-cols-3 gap-4 text-sm">
                                <div>
                                  <p className="text-gray-500">Thời gian</p>
                                  <p className="font-semibold text-gray-900">{exam.duration || '-'} phút</p>
                                </div>
                                <div>
                                  <p className="text-gray-500">Câu hỏi</p>
                                  <p className="font-semibold text-gray-900">{exam.totalQuestions || 0}</p>
                                </div>
                                <div>
                                  <p className="text-gray-500">Điểm đạt</p>
                                  <p className="font-semibold text-gray-900">{(exam.passingPercentage || 50) / 10}/10</p>
                                </div>
                              </div>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/student/do-exam/${exam._id}`);
                              }}
                              className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition whitespace-nowrap ml-4"
                            >
                              Làm bài
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    Không có bài tập nào chưa hoàn thành
                  </div>
                )
              )}

              {activeTab === 'history' && (
                historySubmissions.length > 0 ? (
                  <div className="space-y-4">
                    {historySubmissions.map((submission) => {
                      // Find exam to check examType
                      const quizId = typeof submission.quizId === 'string' ? submission.quizId : submission.quizId?._id;
                      const exam = exams.find((e) => e._id === quizId);
                      const isExercise = exam?.examType === 'exercise';
                      
                      return (
                        <div
                          key={submission._id}
                          className="border border-gray-200 rounded-lg p-4 hover:border-green-300 hover:shadow-md transition cursor-pointer"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className="text-lg font-semibold text-gray-900 mb-2">{submission.examTitle || 'Bài thi'}</h3>
                              <div className="grid grid-cols-4 gap-4 text-sm">
                                <div>
                                  <p className="text-gray-500">Ngày nộp</p>
                                  <p className="font-semibold text-gray-900">
                                    {submission.submittedAt 
                                      ? new Date(submission.submittedAt).toLocaleDateString('vi-VN')
                                      : '-'}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-gray-500">Điểm</p>
                                  <p className={`font-semibold ${submission.result?.isPassed ? 'text-green-600' : 'text-red-600'}`}>
                                    {((submission.result?.score || 0) / 10).toFixed(1)}/10
                                  </p>
                                </div>
                                <div>
                                  <p className="text-gray-500">Kết quả</p>
                                  <p className={`font-semibold ${submission.result?.isPassed ? 'text-green-600' : 'text-red-600'}`}>
                                    {submission.result?.isPassed ? 'Đạt' : 'Không đạt'}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-gray-500">Chi tiết</p>
                                  <p className="font-semibold text-gray-900">
                                    {submission.result?.correctAnswers || 0} đúng / {submission.result?.wrongAnswers || 0} sai
                                  </p>
                                </div>
                              </div>
                            </div>
                            {isExercise && (
                              <button
                                onClick={() => {
                                  router.push(`/student/do-exam/${quizId}?retry=true`);
                                }}
                                className="bg-yellow-500 text-white px-6 py-2 rounded-lg font-semibold hover:bg-yellow-600 transition whitespace-nowrap ml-4"
                              >
                                Làm lại
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    Chưa có lịch sử thi/nộp bài nào
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      </div>
    </StudentLayout>
  );
}
