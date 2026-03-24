'use client';

import TeacherLayout from '@/layouts/TeacherLayout';
import { useParams, useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import questionApi from '@/api/question.api';
import questionBankApi from '@/api/question-bank.api';

interface ParsedQuestion {
  question: string;
  answers: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  correctAnswer?: 'A' | 'B' | 'C' | 'D';
}

export default function CreateBankQuestionPage() {
  const params = useParams();
  const router = useRouter();
  const bankId = (params?.id as string) || '';

  const [textInput, setTextInput] = useState('');
  const [correctAnswers, setCorrectAnswers] = useState<Record<number, 'A' | 'B' | 'C' | 'D'>>({});
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Local parsing logic (same as QuestionComposer)
  const parseQuestions = (text: string): ParsedQuestion[] => {
    if (!text.trim()) {
      return [];
    }

    const questions: ParsedQuestion[] = [];
    const lines = text.split('\n').map(line => line.trim()).filter(line => line);
    
    let i = 0;
    while (i < lines.length) {
      // Collect question lines until we hit an answer line (A., B., etc)
      const questionLines: string[] = [];
      while (i < lines.length && !lines[i].match(/^[A-D]\.\s*/)) {
        questionLines.push(lines[i]);
        i++;
      }

      if (questionLines.length === 0) {
        i++;
        continue;
      }

      const questionText = questionLines.join(' ').trim();
      const answers = {
        A: '',
        B: '',
        C: '',
        D: '',
      };

      // Parse answers
      const answerPattern = /^([A-D])\.\s*/;
      for (let j = 0; j < 4 && i < lines.length; j++) {
        const match = lines[i].match(answerPattern);
        if (match) {
          const answerKey = match[1] as 'A' | 'B' | 'C' | 'D';
          answers[answerKey] = lines[i].replace(answerPattern, '').trim();
          i++;
        } else {
          break;
        }
      }

      questions.push({
        question: questionText,
        answers,
      });
    }

    return questions;
  };

  const parsedData = useMemo(() => {
    const questions = parseQuestions(textInput).map((q, index) => ({
      ...q,
      correctAnswer: correctAnswers[index] || 'A',
    }));
    return questions;
  }, [textInput, correctAnswers]);

  const handleSubmitQuestion = async () => {
    if (parsedData.length === 0) {
      alert('Vui lòng nhập ít nhất một câu hỏi');
      return;
    }

    // Validate all questions
    for (const q of parsedData) {
      if (!q.question.trim()) {
        alert('Nội dung câu hỏi không được để trống');
        return;
      }
      if (!q.answers.A || !q.answers.B || !q.answers.C || !q.answers.D) {
        alert('Tất cả đáp án đều phải được điền');
        return;
      }
    }

    try {
      setLoading(true);
      
      // Create all questions
      for (const q of parsedData) {
        const response = await questionApi.create({
          content: q.question,
          type: 'multiple_choice',
          options: [
            { text: q.answers.A, isCorrect: q.correctAnswer === 'A' },
            { text: q.answers.B, isCorrect: q.correctAnswer === 'B' },
            { text: q.answers.C, isCorrect: q.correctAnswer === 'C' },
            { text: q.answers.D, isCorrect: q.correctAnswer === 'D' },
          ],
        });

        const questionId = response.data._id;
        if (bankId && questionId) {
          await questionBankApi.addQuestion(bankId, questionId);
        }
      }

      setSuccessMessage(`Đã tạo thành công ${parsedData.length} câu hỏi!`);
      setTimeout(() => {
        router.push(`/teacher/questions/banks/${bankId}`);
      }, 1000);
    } catch (err: any) {
      console.error('Lỗi khi tạo câu hỏi:', err);
      alert(err.response?.data?.message || 'Không thể tạo câu hỏi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <TeacherLayout>
      <div className="grid grid-cols-2 gap-6">
        {/* Left Pane - Input Form */}
        <div className="space-y-6">
          {successMessage && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
              {successMessage}
            </div>
          )}

          <div className="bg-white rounded-lg shadow p-6 space-y-4">
            <div>
              <h2 className="text-sm font-semibold text-gray-700 mb-2">
                Nhập nội dung (format: câu hỏi / A. đáp án A / B. đáp án B / C. ... / D. ...)
              </h2>
              <p className="text-xs text-gray-500 mb-2">
                Nhập câu hỏi, nó sẽ tự động phân tách khi gặp dòng "A. ..."
              </p>
              <textarea
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 h-80"
                placeholder={`1+1=
A. 2
B. 3
C. 4
D. 5

2+2=
A. 3
B. 4
C. 5
D. 6`}
              />
            </div>
          </div>
        </div>

        {/* Right Pane - Live Preview */}
        <div className="bg-white rounded-lg shadow p-6 sticky top-6 h-fit flex flex-col max-h-[calc(100vh-50px)]">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Preview ({parsedData.length} câu)</h3>

          {parsedData.length > 0 ? (
            <div className="flex flex-col gap-4 overflow-y-auto flex-1">
              {parsedData.map((q, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50 flex-shrink-0">
                  <div className="mb-3">
                    <h3 className="font-semibold text-gray-900 text-sm">
                      <span className="text-blue-600">Câu {index + 1}:</span> {q.question}
                    </h3>
                  </div>

                  <div className="space-y-2 ml-2">
                    {['A', 'B', 'C', 'D'].map((key) => (
                      <div
                        key={key}
                        className="flex items-center gap-3 p-2 rounded hover:bg-gray-100 cursor-pointer"
                        onClick={() => setCorrectAnswers({ ...correctAnswers, [index]: key as 'A' | 'B' | 'C' | 'D' })}
                      >
                        <input
                          type="radio"
                          name={`correct-answer-${index}`}
                          checked={q.correctAnswer === key}
                          onChange={() => setCorrectAnswers({ ...correctAnswers, [index]: key as 'A' | 'B' | 'C' | 'D' })}
                          className="w-4 h-4 cursor-pointer"
                        />
                        <span className="font-semibold text-gray-600 min-w-6 text-sm">{key}:</span>
                        <span className="flex-1 text-gray-700 text-sm">
                          {q.answers[key as 'A' | 'B' | 'C' | 'D'] || (
                            <span className="text-gray-400 italic">(trống)</span>
                          )}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-400 py-12">
              <p>Chưa có câu hỏi nào. Bắt đầu nhập ở bên trái...</p>
            </div>
          )}

          {parsedData.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <button
                onClick={handleSubmitQuestion}
                disabled={loading}
                className="w-full px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50"
              >
                {loading ? 'Đang tạo...' : `Tạo tất cả ${parsedData.length} câu`}
              </button>
            </div>
          )}
        </div>
      </div>
    </TeacherLayout>
  );
}
