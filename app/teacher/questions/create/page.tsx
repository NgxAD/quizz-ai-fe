'use client';

import TeacherLayout from '@/layouts/TeacherLayout';
import QuestionForm from '@/components/QuestionForm';

export default function CreateQuestionPage() {
  const handleSubmit = async (data: any) => {
    // TODO: Submit question via API
    console.log('Submit question:', data);
  };

  return (
    <TeacherLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">Tạo câu hỏi mới</h1>
        <div className="bg-white rounded-lg shadow p-6">
          <form className="space-y-4">
            <input type="text" placeholder="Nội dung câu hỏi" className="w-full border rounded p-2 text-black placeholder-gray-400" />
            <select className="w-full border rounded p-2 text-black">
              <option>Loại câu hỏi</option>
              <option>Trắc nghiệm</option>
              <option>Đúng/Sai</option>
              <option>Tự luận</option>
            </select>
            <textarea placeholder="Giải thích" className="w-full border rounded p-2 text-black placeholder-gray-400" rows={3} />
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">
              Lưu câu hỏi
            </button>
          </form>
        </div>
      </div>
    </TeacherLayout>
  );
}
