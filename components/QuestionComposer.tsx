'use client';

import React, { useState, useMemo, useEffect } from 'react';

interface Question {
  question: string;
  answers: {
    A: string;
    B: string;
    C: string;
    D: string;
  };
  correctAnswer?: 'A' | 'B' | 'C' | 'D';
}

interface ParseResult {
  questions: Question[];
}

interface QuestionComposerProps {
  onQuestionsChange?: (questions: Question[]) => void;
  compact?: boolean;
}

const QuestionComposer: React.FC<QuestionComposerProps> = ({ onQuestionsChange, compact = false }) => {
  const [input, setInput] = useState<string>('');
  const [correctAnswers, setCorrectAnswers] = useState<Record<number, 'A' | 'B' | 'C' | 'D'>>({});

  const parseQuestions = (text: string): Question[] => {
    if (!text.trim()) {
      return [];
    }

    const questions: Question[] = [];
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

  const parsedData: ParseResult = useMemo(() => {
    const questions = parseQuestions(input).map((q, index) => ({
      ...q,
      correctAnswer: correctAnswers[index] || 'A',
    }));
    return { questions };
  }, [input, correctAnswers]);

  useEffect(() => {
    if (onQuestionsChange) {
      onQuestionsChange(parsedData.questions);
    }
  }, [parsedData.questions, onQuestionsChange]);

  const PreviewSection = () => (
    <div className="bg-white border border-gray-300 rounded-lg shadow-sm p-6 overflow-y-auto">
      {parsedData.questions.length === 0 ? (
        <p className="text-gray-400 italic">Chưa có câu hỏi nào. Bắt đầu nhập ở bên trái...</p>
      ) : (
        <div className="space-y-6">
          {parsedData.questions.map((q, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
              <div className="mb-4">
                <h3 className="font-semibold text-gray-900">
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
                    <span className="font-semibold text-gray-600 min-w-6">{key}:</span>
                    <span className="flex-1 text-gray-700">
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
      )}

      {parsedData.questions.length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            <strong>Tổng cộng:</strong> {parsedData.questions.length} câu
          </p>
        </div>
      )}
    </div>
  );

  if (compact) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="flex flex-col">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Nhập nội dung (format: câu hỏi / A. đáp án A / B. đáp án B / C. ... / D. ...)
            </label>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`1+1=
A. 1
B. 2
C. 3
D. 4

2+2=
A. 3
B. 4
C. 5
D. 6`}
              className="h-96 p-4 border border-gray-300 rounded-lg shadow-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm text-black bg-white placeholder-gray-400 overflow-y-auto"
            />
          </div>

          <div className="flex flex-col">
            <label className="block text-sm font-semibold text-gray-700 mb-3">Preview</label>
            <div className="h-96 overflow-y-auto">
              <PreviewSection />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Soạn thảo câu hỏi trắc nghiệm</h1>
        <p className="text-gray-600 mb-6">Nhập câu hỏi theo format, xem preview tức thì bên phải</p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="flex flex-col">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Nhập nội dung (format: câu hỏi / A. đáp án A / B. đáp án B / C. ... / D. ...)
            </label>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`1+1=
A. 1
B. 2
C. 3
D. 4

2+2=
A. 3
B. 4
C. 5
D. 6`}
              className="h-96 p-4 border border-gray-300 rounded-lg shadow-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm text-black bg-white placeholder-gray-400 overflow-y-auto"
            />
          </div>

          <div className="flex flex-col">
            <label className="block text-sm font-semibold text-gray-700 mb-3">Preview</label>
            <div className="h-96 overflow-y-auto">
              <PreviewSection />
            </div>
          </div>
        </div>

        {parsedData.questions.length > 0 && (
          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-900">
              ✅ Đã parse thành công <strong>{parsedData.questions.length} câu hỏi</strong>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuestionComposer;
