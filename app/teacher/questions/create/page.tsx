'use client';

import TeacherLayout from '@/layouts/TeacherLayout';
import QuestionForm, { QuestionFormData } from '@/components/QuestionForm';
import { useState } from 'react';
import questionApi from '@/api/question.api';
import questionBankApi from '@/api/question-bank.api';
import { useRouter, useSearchParams } from 'next/navigation';

export default function CreateQuestionPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();
  const bankId = searchParams.get('bankId');

  const handleSubmit = async (data: QuestionFormData) => {
    try {
      setLoading(true);
      setError('');
      
      // Transform options format: string[] -> Array<{text, isCorrect}>
      const transformedData = {
        ...data,
        options: data.type === 'MULTIPLE_CHOICE' && data.options
          ? data.options.map(option => ({
              text: option,
              isCorrect: option === data.correctAnswer,
            }))
          : undefined,
      };
      
      const response = await questionApi.create(transformedData);
      const questionId = response.data._id;

      // If bankId is provided, add question to bank
      if (bankId && questionId) {
        await questionBankApi.addQuestion(bankId, questionId);
        router.push(`/teacher/questions/banks/${bankId}`);
      } else {
        alert('Câu hỏi đã được tạo thành công!');
        router.push('/teacher/questions/list');
      }
    } catch (err: any) {
      console.error('Lỗi khi tạo câu hỏi:', err);
      setError(err.response?.data?.message || 'Không thể tạo câu hỏi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <TeacherLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">Tạo câu hỏi mới</h1>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <QuestionForm onSubmit={handleSubmit} loading={loading} />
      </div>
    </TeacherLayout>
  );
}
