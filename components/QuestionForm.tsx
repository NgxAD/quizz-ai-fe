'use client';

import { useState } from 'react';

export interface QuestionFormData {
  content: string;
  type: 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'SHORT_ANSWER';
  options?: string[];
  correctAnswer: string;
  explanation?: string;
  subjectId: string;
}

interface QuestionFormProps {
  onSubmit: (data: QuestionFormData) => void;
  loading?: boolean;
  initialData?: Partial<QuestionFormData>;
}

export default function QuestionForm({ onSubmit, loading = false, initialData }: QuestionFormProps) {
  const [formData, setFormData] = useState<QuestionFormData>({
    content: initialData?.content || '',
    type: initialData?.type || 'MULTIPLE_CHOICE',
    options: initialData?.options || ['', '', '', ''],
    correctAnswer: initialData?.correctAnswer || '',
    explanation: initialData?.explanation || '',
    subjectId: initialData?.subjectId || '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...(formData.options || [])];
    newOptions[index] = value;
    setFormData((prev) => ({
      ...prev,
      options: newOptions,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-4">
      <div>
        <label className="block text-gray-700 font-semibold mb-2">Môn học</label>
        <input
          type="text"
          name="subjectId"
          value={formData.subjectId}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="ID môn học"
          required
        />
      </div>

      <div>
        <label className="block text-gray-700 font-semibold mb-2">Loại câu hỏi</label>
        <select
          name="type"
          value={formData.type}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="MULTIPLE_CHOICE">Trắc nghiệm</option>
          <option value="TRUE_FALSE">Đúng/Sai</option>
          <option value="SHORT_ANSWER">Tự luận</option>
        </select>
      </div>

      <div>
        <label className="block text-gray-700 font-semibold mb-2">Nội dung câu hỏi</label>
        <textarea
          name="content"
          value={formData.content}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-24"
          placeholder="Nhập nội dung câu hỏi"
          required
        />
      </div>

      {formData.type === 'MULTIPLE_CHOICE' && (
        <div>
          <label className="block text-gray-700 font-semibold mb-2">Các đáp án</label>
          {formData.options?.map((option, index) => (
            <input
              key={index}
              type="text"
              value={option}
              onChange={(e) => handleOptionChange(index, e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-2"
              placeholder={`Đáp án ${index + 1}`}
            />
          ))}
        </div>
      )}

      <div>
        <label className="block text-gray-700 font-semibold mb-2">Đáp án đúng</label>
        <input
          type="text"
          name="correctAnswer"
          value={formData.correctAnswer}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Nhập đáp án đúng"
          required
        />
      </div>

      <div>
        <label className="block text-gray-700 font-semibold mb-2">Giải thích (tùy chọn)</label>
        <textarea
          name="explanation"
          value={formData.explanation}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 h-20"
          placeholder="Giải thích đáp án"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg transition duration-200 disabled:opacity-50"
      >
        {loading ? 'Đang lưu...' : 'Lưu câu hỏi'}
      </button>
    </form>
  );
}
