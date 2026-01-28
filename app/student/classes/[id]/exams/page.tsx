'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import StudentLayout from '@/layouts/StudentLayout';
import examApi from '@/api/exam.api';
import classApi from '@/api/class.api';

interface Exam {
  _id: string;
  title: string;
  description?: string;
  duration?: number;
  passingPercentage?: number;
  createdAt: string;
}

interface ClassData {
  _id: string;
  name: string;
  code: string;
  assignedExams?: (Exam | string)[];
}

export default function ClassExamsPage() {
  const router = useRouter();
  const params = useParams();
  const classId = params?.id as string;

  const [classData, setClassData] = useState<ClassData | null>(null);
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (classId) {
      loadExams();
    }
  }, [classId]);

  const loadExams = async () => {
    try {
      setLoading(true);
      // Get class data which includes assignedExams
      const classResponse = await classApi.getById(classId);
      setClassData(classResponse.data);

      if (classResponse.data.assignedExams && classResponse.data.assignedExams.length > 0) {
        const assignedExams = classResponse.data.assignedExams;
        const examsToLoad: Exam[] = [];
        const examIds: string[] = [];

        // Separate already-populated exams from IDs
        for (const item of assignedExams) {
          if (typeof item === 'string') {
            examIds.push(item);
          } else if (item && item._id) {
            examsToLoad.push(item);
          }
        }

        // Fetch any exams that are still just IDs
        if (examIds.length > 0) {
          const fetchedExams = await Promise.all(
            examIds.map(id => examApi.getById(id).then(res => res.data))
          );
          examsToLoad.push(...fetchedExams);
        }

        setExams(examsToLoad);
      } else {
        setExams([]);
      }
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Lỗi khi tải danh sách bài kiểm tra');
    } finally {
      setLoading(false);
    }
  };

  return (
    <StudentLayout>
      <div className="space-y-6">
        <button
          onClick={() => router.push('/student/classes')}
          className="text-blue-600 hover:text-blue-700 font-semibold"
        >
          ← Quay lại danh sách lớp
        </button>

        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {classData?.name || 'Đang tải...'}
          </h1>
          {classData && (
            <p className="text-gray-600 mt-2">
              Mã lớp: <span className="font-mono bg-gray-100 px-2 py-1 rounded">{classData.code}</span>
            </p>
          )}
        </div>

        <div>
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Bài kiểm tra của lớp</h2>
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
        ) : exams.length === 0 ? (
          <div className="bg-gray-50 rounded-lg p-8 text-center">
            <div className="text-5xl mb-4">📋</div>
            <p className="text-gray-600 text-lg">Chưa có bài kiểm tra nào được giao</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {exams.map((exam) => (
              <div
                key={exam._id}
                className="bg-white rounded-lg shadow-md hover:shadow-lg transition overflow-hidden"
              >
                <div className="bg-gradient-to-r from-green-500 to-blue-600 p-4 text-white">
                  <h3 className="text-xl font-bold">{exam.title}</h3>
                </div>
                <div className="p-4">
                  {exam.description && (
                    <p className="text-gray-600 text-sm mb-3">{exam.description}</p>
                  )}
                  <div className="space-y-2 text-sm text-gray-600 mb-4">
                    {exam.duration && (
                      <p>Thời gian: {exam.duration} phút</p>
                    )}
                    {exam.passingPercentage && (
                      <p>Điểm đạt: {exam.passingPercentage}%</p>
                    )}
                  </div>
                  <button
                    onClick={() => router.push(`/student/do-exam?examId=${exam._id}`)}
                    className="w-full bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700 transition"
                  >
                    Làm bài kiểm tra
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </StudentLayout>
  );
}
