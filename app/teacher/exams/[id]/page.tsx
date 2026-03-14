'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import TeacherLayout from '@/layouts/TeacherLayout';
import examApi, { Exam, Question } from '@/api/exam.api';
import classApi from '@/api/class.api';

interface Class {
  _id: string;
  name: string;
  code: string;
}

export default function ExamDetailPage() {
  const router = useRouter();
  const params = useParams();
  const examId = params?.id as string | undefined;

  const [exam, setExam] = useState<Exam | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedQuestionId, setExpandedQuestionId] = useState<string | null>(null);
  const [classes, setClasses] = useState<Class[]>([]);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [assignLoading, setAssignLoading] = useState(false);
  const [assignSuccess, setAssignSuccess] = useState('');

  useEffect(() => {
    if (examId) {
      loadExam();
      loadClasses();
    }
  }, [examId]);

  const loadClasses = async () => {
    try {
      const response = await classApi.list();
      setClasses(response.data);
    } catch (err: any) {
      console.error('Error loading classes:', err);
    }
  };

  const loadExam = async () => {
    try {
      setLoading(true);
      const response = await examApi.getById(examId!);
      setExam(response.data);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Lỗi khi tải dữ liệu đề');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignToClass = async () => {
    if (!selectedClassId) {
      setError('Vui lòng chọn lớp');
      return;
    }

    setAssignLoading(true);
    setError('');

    try {
      await classApi.assignExamToClass(selectedClassId, examId!);
      setAssignSuccess('✓ Giao đề vào lớp thành công!');
      setShowAssignModal(false);
      setSelectedClassId('');
      setTimeout(() => setAssignSuccess(''), 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Lỗi khi giao đề');
    } finally {
      setAssignLoading(false);
    }
  };

  const renderQuestionOptions = (question: any) => {
    // Handle multiple-choice questions
    if ((question.type === 'multiple-choice' || question.type === 'multiple_choice') && question.options && question.options.length > 0) {
      return (
        <div className="space-y-2 mt-3">
          {question.options.map((option: any, idx: number) => (
            <div
              key={idx}
              className={`p-3 rounded border ${
                option.isCorrect
                  ? 'bg-green-50 border-green-300'
                  : 'bg-white border-gray-200'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  <div
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center text-xs font-bold ${
                      option.isCorrect
                        ? 'bg-green-500 border-green-500 text-white'
                        : 'border-gray-300 text-gray-700'
                    }`}
                  >
                    {String.fromCharCode(65 + idx)}
                  </div>
                </div>
                <div className="flex-1">
                  <p className="text-gray-900">{option.text}</p>
                  {option.isCorrect && (
                    <p className="text-green-600 text-sm font-semibold mt-1">Đáp án đúng</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      );
    } 
    // Handle short answer questions
    else if (question.type === 'short_answer') {
      return (
        <div className="mt-3">
          <div className="p-3 bg-gray-50 rounded border border-gray-200">
            <p className="text-gray-500 text-sm italic mb-3">
              Câu trả lời ngắn - Học sinh tự trả lời
            </p>
            {question.correctAnswer ? (
              <div className="pt-3 border-t border-gray-300">
                <p className="text-sm font-semibold text-gray-700 mb-2">Đáp án tham khảo:</p>
                <p className="text-gray-900 whitespace-pre-wrap break-words">{question.correctAnswer}</p>
              </div>
            ) : (
              <div className="pt-3 border-t border-gray-300">
                <p className="text-sm italic text-gray-500">Chưa có đáp án tham khảo</p>
              </div>
            )}
          </div>
        </div>
      );
    }
    // Handle true/false questions
    else if (question.type === 'true_false') {
      return (
        <div className="mt-3">
          <div className="p-3 bg-gray-50 rounded border border-gray-200">
            <p className="text-gray-500 text-sm italic mb-3">Câu hỏi Đúng/Sai</p>
            {question.correctAnswer ? (
              <div className="pt-3 border-t border-gray-300">
                <p className="text-sm font-semibold text-gray-700 mb-2">Đáp án:</p>
                <p className="text-lg font-bold text-gray-900">
                  {question.correctAnswer === 'true' || question.correctAnswer === true ? '✓ Đúng' : '✗ Sai'}
                </p>
              </div>
            ) : (
              <p className="text-sm italic text-gray-500">Chưa có đáp án</p>
            )}
          </div>
        </div>
      );
    }
    
    // Default fallback
    return (
      <div className="mt-3 p-3 bg-yellow-50 rounded border border-yellow-200">
        <p className="text-sm text-yellow-700">Loại câu hỏi: {question.type}</p>
      </div>
    );
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

  if (error || !exam) {
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
            {error || 'Không tìm thấy đề thi'}
          </div>
        </div>
      </TeacherLayout>
    );
  }

  return (
    <TeacherLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.back()}
            className="text-blue-600 hover:text-blue-700 font-semibold"
          >
            ← Quay lại
          </button>
          <div className="flex gap-3">
            <button
              onClick={() => setShowAssignModal(true)}
              className="bg-green-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-green-700 transition"
            >
              Giao vào lớp
            </button>
            <button
              onClick={() => router.push(`/teacher/exams/${exam._id}/edit`)}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition"
            >
              Chỉnh sửa đề
            </button>
          </div>
        </div>

        {/* Success/Error Messages */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}
        {assignSuccess && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
            {assignSuccess}
          </div>
        )}

        {/* Exam Info */}
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">{exam.title}</h1>
          
          {exam.description && (
            <p className="text-gray-600 text-lg mb-4">{exam.description}</p>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
            <div>
              <p className="text-gray-600 text-sm font-semibold">Thời gian</p>
              <p className="text-2xl font-bold text-gray-900">
                {exam.duration ? `${exam.duration} phút` : 'Không giới hạn'}
              </p>
            </div>
            <div>
              <p className="text-gray-600 text-sm font-semibold">Điểm đạt</p>
              <p className="text-2xl font-bold text-gray-900">
                {exam.passingPercentage ? `${exam.passingPercentage}%` : '-'}
              </p>
            </div>
            <div>
              <p className="text-gray-600 text-sm font-semibold">Tổng câu hỏi</p>
              <p className="text-2xl font-bold text-gray-900">
                {exam.totalQuestions || exam.questions?.length || 0}
              </p>
            </div>
          </div>
        </div>

        {/* File Content Section */}
        {exam.fileContent && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span>📄 Nội dung đề</span>
              {exam.fileName && (
                <span className="text-lg font-normal text-gray-600">
                  ({exam.fileName})
                </span>
              )}
            </h2>
            <div className="bg-gray-50 border border-gray-300 rounded-lg p-6 max-h-96 overflow-y-auto whitespace-pre-wrap break-words text-gray-900 font-mono text-sm leading-relaxed">
              {exam.fileContent}
            </div>
          </div>
        )}

        {/* Questions Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Danh sách câu hỏi ({exam.questions?.length || 0})
          </h2>

          {exam.questions && exam.questions.length > 0 ? (
            <div className="space-y-4">
              {exam.questions.map((question, idx) => {
                const isExpanded = expandedQuestionId === (question._id || `question-${idx}`);
                const questionId = question._id || `question-${idx}`;
                
                return (
                  <div
                    key={questionId}
                    className="border border-gray-200 rounded-lg overflow-hidden hover:border-blue-300 hover:shadow-md transition cursor-pointer"
                    onClick={() => setExpandedQuestionId(isExpanded ? null : questionId)}
                  >
                    <div className="p-6 bg-white">
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-semibold">
                          {idx + 1}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-start justify-between gap-4">
                            <p className="text-gray-900 text-lg font-semibold flex-1">
                              {question.content}
                            </p>
                            <div className="flex items-center gap-2 whitespace-nowrap">
                              <span className="inline-block bg-blue-100 text-blue-700 px-3 py-1 rounded text-sm font-semibold">
                                {question.type === 'multiple-choice' || question.type === 'multiple_choice'
                                  ? 'Trắc nghiệm'
                                  : question.type === 'short-answer' || question.type === 'short_answer'
                                  ? 'Trả lời ngắn'
                                  : question.type === 'true_false'
                                  ? 'Đúng/Sai'
                                  : 'Khác'}
                              </span>
                              <span className={`text-2xl text-gray-400 transition ${isExpanded ? 'rotate-180' : ''}`}>
                                ▼
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="border-t border-gray-200 p-6 bg-gray-50">
                        {question.explanation && (
                          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
                            <p className="text-sm font-semibold text-blue-900 mb-1">Giải thích:</p>
                            <p className="text-gray-900">{question.explanation}</p>
                          </div>
                        )}

                        <div className="mt-4">
                          <p className="text-sm font-semibold text-gray-700 mb-3">Đáp án:</p>
                          {renderQuestionOptions(question)}
                        </div>
                      </div>
                    )}
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

        {/* Assign to Class Modal */}
        {showAssignModal && (
          <div className="fixed inset-0 bg-transparent flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-96 shadow-lg">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Giao đề vào lớp</h2>
              
              {assignSuccess && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">
                  {assignSuccess}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Chọn lớp
                  </label>
                  <select
                    value={selectedClassId}
                    onChange={(e) => setSelectedClassId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                  >
                    <option value="">-- Chọn lớp --</option>
                    {classes.map((cls) => (
                      <option key={cls._id} value={cls._id}>
                        {cls.name} ({cls.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-3 justify-end pt-4">
                  <button
                    onClick={() => {
                      setShowAssignModal(false);
                      setSelectedClassId('');
                    }}
                    className="px-4 py-2 text-gray-700 bg-gray-200 rounded hover:bg-gray-300 transition"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={handleAssignToClass}
                    disabled={assignLoading || !selectedClassId}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    {assignLoading ? '⏳ Đang giao...' : 'Giao'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </TeacherLayout>
  );
}
