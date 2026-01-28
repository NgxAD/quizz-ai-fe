'use client';

import Link from 'next/link';

interface ExamCardProps {
  id: string;
  title: string;
  description?: string;
  duration: number;
  questionCount?: number;
  isCompleted?: boolean;
}

export default function ExamCard({
  id,
  title,
  description,
  duration,
  questionCount,
  isCompleted,
}: ExamCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition duration-200">
      <h3 className="text-lg font-bold text-gray-800 mb-2">{title}</h3>
      {description && <p className="text-gray-600 text-sm mb-4">{description}</p>}

      <div className="flex justify-between items-center mb-4">
        <span className="text-sm text-gray-500">
          ⏱️ {duration} phút
        </span>
        {questionCount && (
          <span className="text-sm text-gray-500">
            📝 {questionCount} câu hỏi
          </span>
        )}
      </div>

      <Link
        href={`/student/do-exam/${id}`}
        className={`block text-center py-2 px-4 rounded-lg font-semibold transition duration-200 ${
          isCompleted
            ? 'bg-gray-400 text-white cursor-not-allowed'
            : 'bg-blue-500 hover:bg-blue-600 text-white'
        }`}
      >
        {isCompleted ? 'Đã hoàn thành' : 'Làm bài'}
      </Link>
    </div>
  );
}
