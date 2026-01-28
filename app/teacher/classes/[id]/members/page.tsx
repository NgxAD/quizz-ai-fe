'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import TeacherLayout from '@/layouts/TeacherLayout';
import classApi from '@/api/class.api';
import examApi from '@/api/exam.api';

interface Student {
  _id: string;
  fullName: string;
  email: string;
  joinedAt: string;
}

interface ClassData {
  _id: string;
  name: string;
  code: string;
  assignedExams?: any[];
}

interface Exam {
  _id: string;
  title: string;
  description?: string;
  createdAt: string;
  totalQuestions: number;
}

export default function ClassMembersPage() {
  const router = useRouter();
  const params = useParams() as any;
  const classId = params?.id as string;

  const [tab, setTab] = useState<'members' | 'exams'>('members');
  const [classData, setClassData] = useState<ClassData | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadClassAndMembers();
  }, [classId]);

  const loadClassAndMembers = async () => {
    try {
      setLoading(true);
      const classResponse = await classApi.getById(classId);
      setClassData(classResponse.data);

      const membersResponse = await classApi.getMembers(classId);
      setStudents(membersResponse.data);

      // Load assigned exams
      if (classResponse.data.assignedExams && classResponse.data.assignedExams.length > 0) {
        const assignedExams = classResponse.data.assignedExams;
        
        // Check if exams are already populated objects or just IDs
        const examsToLoad: Exam[] = [];
        const examIds: string[] = [];
        
        for (const item of assignedExams) {
          if (typeof item === 'string') {
            // It's an ID, need to fetch
            examIds.push(item);
          } else if (item && item._id) {
            // It's already a populated object
            examsToLoad.push(item);
          }
        }
        
        // Fetch any remaining exams by ID
        if (examIds.length > 0) {
          const examPromises = examIds.map((examId: string) =>
            examApi.getById(examId).catch(() => null)
          );
          const examResponses = await Promise.all(examPromises);
          const loadedExams = examResponses
            .filter((res: any) => res !== null)
            .map((res: any) => res.data);
          setExams([...examsToLoad, ...loadedExams]);
        } else {
          setExams(examsToLoad);
        }
      }

      setError('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Lỗi khi tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveStudent = async (studentId: string) => {
    if (confirm('Bạn chắc chắn muốn xóa học sinh này khỏi lớp?')) {
      try {
        await classApi.removeMember(classId, studentId);
        loadClassAndMembers();
      } catch (err: any) {
        setError(err.response?.data?.message || 'Lỗi khi xóa học sinh');
      }
    }
  };

  // Group exams by date
  const groupedExams = exams.reduce(
    (acc, exam) => {
      const date = new Date(exam.createdAt).toLocaleDateString('vi-VN', {
        weekday: 'long',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      });
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(exam);
      return acc;
    },
    {} as Record<string, Exam[]>,
  );

  const filteredExams = Object.entries(groupedExams).reduce(
    (acc, [date, examsList]) => {
      acc[date] = examsList.filter((exam) =>
        exam.title.toLowerCase().includes(searchTerm.toLowerCase()),
      );
      return acc;
    },
    {} as Record<string, Exam[]>,
  );

  return (
    <TeacherLayout>
      <div className="space-y-6">
        <button
          onClick={() => router.back()}
          className="text-blue-600 hover:text-blue-700 font-semibold"
        >
          ← Quay lại
        </button>

        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {classData?.name || 'Đang tải...'}
          </h1>
          {classData && (
            <p className="text-gray-600 mt-2">
              Mã: <span className="font-mono bg-gray-100 px-2 py-1 rounded">{classData.code}</span>
            </p>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-4 border-b border-gray-200">
          <button
            onClick={() => setTab('members')}
            className={`px-4 py-2 font-semibold border-b-2 transition ${
              tab === 'members'
                ? 'text-blue-600 border-blue-600'
                : 'text-gray-600 border-transparent hover:text-gray-800'
            }`}
          >
            Danh sách học sinh
          </button>
          <button
            onClick={() => setTab('exams')}
            className={`px-4 py-2 font-semibold border-b-2 transition ${
              tab === 'exams'
                ? 'text-blue-600 border-blue-600'
                : 'text-gray-600 border-transparent hover:text-gray-800'
            }`}
          >
            Bài tập đã giao
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="text-gray-500">Đang tải...</div>
          </div>
        ) : (
          <>
            {/* Members Tab */}
            {tab === 'members' && (
              <>
                {students.length === 0 ? (
                  <div className="bg-white rounded-lg shadow p-6 text-center text-gray-600">
                    Chưa có học sinh nào tham gia lớp
                  </div>
                ) : (
                  <div className="bg-white rounded-lg shadow overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b">
                        <tr>
                          <th className="text-left p-4 font-semibold text-gray-700">Tên học sinh</th>
                          <th className="text-left p-4 font-semibold text-gray-700">Email</th>
                          <th className="text-left p-4 font-semibold text-gray-700">Ngày tham gia</th>
                          <th className="text-right p-4 font-semibold text-gray-700">Hành động</th>
                        </tr>
                      </thead>
                      <tbody>
                        {students.map((student) => (
                          <tr key={student._id} className="border-b hover:bg-gray-50 transition">
                            <td className="p-4 font-semibold text-gray-900">{student.fullName}</td>
                            <td className="p-4 text-gray-600">{student.email}</td>
                            <td className="p-4 text-gray-600">
                              {new Date(student.joinedAt).toLocaleDateString('vi-VN')}
                            </td>
                            <td className="p-4 text-right">
                              <button
                                onClick={() => handleRemoveStudent(student._id)}
                                className="bg-red-500 text-white px-4 py-1 rounded text-sm hover:bg-red-600 transition"
                              >
                                Xóa
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}

            {/* Exams Tab */}
            {tab === 'exams' && (
              <>
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      placeholder="Tìm kiếm bài tập..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <button
                    onClick={() => router.push('/teacher/exams/create')}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition"
                  >
                    + Giao bài mới
                  </button>
                </div>

                {exams.length === 0 ? (
                  <div className="bg-white rounded-lg shadow p-8 text-center">
                    <p className="text-gray-600 text-lg mb-4">Chưa có bài tập nào được giao</p>
                    <button
                      onClick={() => router.push('/teacher/exams/create')}
                      className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition"
                    >
                      + Tạo bài tập mới
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {Object.entries(filteredExams).map(([date, dateExams]) =>
                      dateExams.length > 0 ? (
                        <div key={date}>
                          <h3 className="text-sm font-semibold text-gray-700 mb-3 pl-4 border-l-4 border-blue-500">
                            {date}
                          </h3>
                          <div className="space-y-3">
                            {dateExams.map((exam) => (
                              <div
                                key={exam._id}
                                className="bg-white rounded-lg shadow p-4 hover:shadow-md transition cursor-pointer"
                                onClick={() => router.push(`/teacher/exams/${exam._id}`)}
                              >
                                <div className="flex items-start justify-between">
                                  <div className="flex items-start gap-4 flex-1">
                                    <div>
                                      <h4 className="font-semibold text-gray-900 text-lg">
                                        {exam.title}
                                      </h4>
                                      {exam.description && (
                                        <p className="text-gray-600 text-sm mt-1">
                                          {exam.description}
                                        </p>
                                      )}
                                      <p className="text-gray-500 text-xs mt-2">
                                        Số câu hỏi: {exam.totalQuestions}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : null,
                    )}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </TeacherLayout>
  );
}