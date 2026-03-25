'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import questionBankApi, { QuestionBank } from '@/api/question-bank.api';
import questionApi, { Question as ApiQuestion } from '@/api/question.api';

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
  
  // Formula modal states
  const [showFormulaModal, setShowFormulaModal] = useState(false);
  const [formulaInput, setFormulaInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const formulaInputRef = useRef<HTMLInputElement>(null);

  // Question bank modal states
  const [showQuestionBankModal, setShowQuestionBankModal] = useState(false);
  const [questionBanks, setQuestionBanks] = useState<QuestionBank[]>([]);
  const [selectedBankId, setSelectedBankId] = useState<string | null>(null);
  const [bankQuestions, setBankQuestions] = useState<ApiQuestion[]>([]);
  const [loadingBanks, setLoadingBanks] = useState(false);
  const [loadingQuestions, setLoadingQuestions] = useState(false);

  // Insert formula into modal input
  const insertFormula = (formula: string) => {
    if (formulaInputRef.current) {
      const input = formulaInputRef.current;
      const start = input.selectionStart ?? 0;
      const end = input.selectionEnd ?? 0;
      const newText = formulaInput.substring(0, start) + formula + formulaInput.substring(end);
      setFormulaInput(newText);
      
      setTimeout(() => {
        input.focus();
        input.setSelectionRange(start + formula.length, start + formula.length);
      }, 0);
    }
  };

  // Insert formula from modal to textarea
  const insertFormulaToTextarea = () => {
    if (!formulaInput.trim() || !textareaRef.current) return;

    const textarea = textareaRef.current;
    const start = textarea.selectionStart ?? 0;
    const end = textarea.selectionEnd ?? 0;
    const newText = input.substring(0, start) + formulaInput + input.substring(end);
    setInput(newText);
    
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + formulaInput.length, start + formulaInput.length);
    }, 0);

    setFormulaInput('');
    setShowFormulaModal(false);
  };

  // Load question banks when modal opens
  const openQuestionBankModal = () => {
    setShowQuestionBankModal(true);
    setLoadingBanks(true);
    
    questionBankApi.list()
      .then((res) => {
        if (res.data) {
          setQuestionBanks(res.data);
          if (res.data.length > 0) {
            setSelectedBankId(res.data[0]._id);
            loadQuestionsFromBank(res.data[0]._id);
          }
        }
      })
      .catch((error) => {
        console.error('Failed to fetch question banks:', error);
      })
      .finally(() => {
        setLoadingBanks(false);
      });
  };

  // Load questions from selected bank
  const loadQuestionsFromBank = (bankId: string) => {
    setLoadingQuestions(true);
    questionApi.list()
      .then((res) => {
        if (res.data) {
          // Filter questions that are in the selected bank
          const bank = questionBanks.find(b => b._id === bankId);
          if (bank) {
            const filteredQuestions = res.data.filter(q => bank.questions.includes(q._id));
            setBankQuestions(filteredQuestions);
          }
        }
      })
      .catch((error) => {
        console.error('Failed to fetch questions:', error);
      })
      .finally(() => {
        setLoadingQuestions(false);
      });
  };

  // Insert question from bank into textarea
  const insertQuestionFromBank = (question: ApiQuestion) => {
    if (!textareaRef.current) return;

    // Get current number of questions to know the index of the new one
    const currentQuestionsCount = parseQuestions(input).length;

    const textarea = textareaRef.current;
    const start = textarea.selectionStart ?? 0;
    const end = textarea.selectionEnd ?? 0;
    
    // Format the question with options
    const formattedQuestion = `${question.content}
A. ${question.options?.[0]?.text || ''}
B. ${question.options?.[1]?.text || ''}
C. ${question.options?.[2]?.text || ''}
D. ${question.options?.[3]?.text || ''}

`;
    
    const newText = input.substring(0, start) + formattedQuestion + input.substring(end);
    setInput(newText);
    
    // Find the correct answer from the question options
    const correctAnswerIndex = question.options?.findIndex(opt => opt.isCorrect) ?? 0;
    const correctAnswerLetter = String.fromCharCode(65 + correctAnswerIndex) as 'A' | 'B' | 'C' | 'D';
    
    // Update correctAnswers state for the newly inserted question
    const newCorrectAnswers = { ...correctAnswers };
    newCorrectAnswers[currentQuestionsCount] = correctAnswerLetter;
    setCorrectAnswers(newCorrectAnswers);
    
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + formattedQuestion.length, start + formattedQuestion.length);
    }, 0);

    setShowQuestionBankModal(false);
  };

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
            <div className="flex gap-2 mb-2">
              <button
                type="button"
                onClick={() => setShowFormulaModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm font-semibold transition"
                title="Chèn công thức"
              >
                ∑ Chèn công thức
              </button>
              <button
                type="button"
                onClick={openQuestionBankModal}
                className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded text-sm font-semibold transition"
                title="Chọn câu hỏi từ ngân hàng"
              >
                Chọn từ ngân hàng cá nhân
              </button>
            </div>
            <textarea
              ref={textareaRef}
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

        {/* Formula Editor Modal */}
        {showFormulaModal && (
          <div className="fixed inset-0 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-black">Soạn thảo công thức</h2>
                <button
                  onClick={() => {
                    setShowFormulaModal(false);
                    setFormulaInput('');
                  }}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ✕
                </button>
              </div>

              {/* Formula Input */}
              <input
                ref={formulaInputRef}
                type="text"
                value={formulaInput}
                onChange={(e) => setFormulaInput(e.target.value)}
                placeholder="Nhập hoặc chèn công thức..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
              />

              {/* Math Keyboard */}
              <div className="bg-gray-100 p-4 rounded-lg mb-4">
                <div className="grid grid-cols-8 gap-2">
                  {/* Row 1 - Roots and Powers */}
                  <button onClick={() => insertFormula('√')} className="bg-gray-400 text-white p-2 rounded text-sm font-semibold hover:bg-gray-500 transition">√</button>
                  <button onClick={() => insertFormula('∛')} className="bg-gray-400 text-white p-2 rounded text-sm font-semibold hover:bg-gray-500 transition">∛</button>
                  <button onClick={() => insertFormula('∜')} className="bg-gray-400 text-white p-2 rounded text-sm font-semibold hover:bg-gray-500 transition">∜</button>
                  <button onClick={() => insertFormula('^')} className="bg-gray-400 text-white p-2 rounded text-sm font-semibold hover:bg-gray-500 transition">^</button>
                  <button onClick={() => insertFormula('x²')} className="bg-gray-400 text-white p-2 rounded text-sm font-semibold hover:bg-gray-500 transition">x²</button>
                  <button onClick={() => insertFormula('x³')} className="bg-gray-400 text-white p-2 rounded text-sm font-semibold hover:bg-gray-500 transition">x³</button>
                  <button onClick={() => insertFormula('π')} className="bg-gray-400 text-white p-2 rounded text-sm font-semibold hover:bg-gray-500 transition">π</button>
                  <button onClick={() => insertFormula('e')} className="bg-gray-400 text-white p-2 rounded text-sm font-semibold hover:bg-gray-500 transition">e</button>

                  {/* Row 2 - Basic Operators */}
                  <button onClick={() => insertFormula('+')} className="bg-gray-400 text-white p-2 rounded text-sm font-semibold hover:bg-gray-500 transition">+</button>
                  <button onClick={() => insertFormula('−')} className="bg-gray-400 text-white p-2 rounded text-sm font-semibold hover:bg-gray-500 transition">−</button>
                  <button onClick={() => insertFormula('×')} className="bg-gray-400 text-white p-2 rounded text-sm font-semibold hover:bg-gray-500 transition">×</button>
                  <button onClick={() => insertFormula('÷')} className="bg-gray-400 text-white p-2 rounded text-sm font-semibold hover:bg-gray-500 transition">÷</button>
                  <button onClick={() => insertFormula('=')} className="bg-gray-400 text-white p-2 rounded text-sm font-semibold hover:bg-gray-500 transition">=</button>
                  <button onClick={() => insertFormula('≠')} className="bg-gray-400 text-white p-2 rounded text-sm font-semibold hover:bg-gray-500 transition">≠</button>
                  <button onClick={() => insertFormula('≈')} className="bg-gray-400 text-white p-2 rounded text-sm font-semibold hover:bg-gray-500 transition">≈</button>
                  <button onClick={() => insertFormula('±')} className="bg-gray-400 text-white p-2 rounded text-sm font-semibold hover:bg-gray-500 transition">±</button>

                  {/* Row 3 - Comparison and Brackets */}
                  <button onClick={() => insertFormula('<')} className="bg-gray-400 text-white p-2 rounded text-sm font-semibold hover:bg-gray-500 transition">&lt;</button>
                  <button onClick={() => insertFormula('>')} className="bg-gray-400 text-white p-2 rounded text-sm font-semibold hover:bg-gray-500 transition">&gt;</button>
                  <button onClick={() => insertFormula('≤')} className="bg-gray-400 text-white p-2 rounded text-sm font-semibold hover:bg-gray-500 transition">≤</button>
                  <button onClick={() => insertFormula('≥')} className="bg-gray-400 text-white p-2 rounded text-sm font-semibold hover:bg-gray-500 transition">≥</button>
                  <button onClick={() => insertFormula('(')} className="bg-gray-400 text-white p-2 rounded text-sm font-semibold hover:bg-gray-500 transition">(</button>
                  <button onClick={() => insertFormula(')')} className="bg-gray-400 text-white p-2 rounded text-sm font-semibold hover:bg-gray-500 transition">)</button>
                  <button onClick={() => insertFormula('[')} className="bg-gray-400 text-white p-2 rounded text-sm font-semibold hover:bg-gray-500 transition">[</button>
                  <button onClick={() => insertFormula(']')} className="bg-gray-400 text-white p-2 rounded text-sm font-semibold hover:bg-gray-500 transition">]</button>

                  {/* Row 4 - Calculus and Greek Letters */}
                  <button onClick={() => insertFormula('∞')} className="bg-gray-400 text-white p-2 rounded text-sm font-semibold hover:bg-gray-500 transition">∞</button>
                  <button onClick={() => insertFormula('∑')} className="bg-gray-400 text-white p-2 rounded text-sm font-semibold hover:bg-gray-500 transition">∑</button>
                  <button onClick={() => insertFormula('∏')} className="bg-gray-400 text-white p-2 rounded text-sm font-semibold hover:bg-gray-500 transition">∏</button>
                  <button onClick={() => insertFormula('∫')} className="bg-gray-400 text-white p-2 rounded text-sm font-semibold hover:bg-gray-500 transition">∫</button>
                  <button onClick={() => insertFormula('∂')} className="bg-gray-400 text-white p-2 rounded text-sm font-semibold hover:bg-gray-500 transition">∂</button>
                  <button onClick={() => insertFormula('∇')} className="bg-gray-400 text-white p-2 rounded text-sm font-semibold hover:bg-gray-500 transition">∇</button>
                  <button onClick={() => insertFormula('α')} className="bg-gray-400 text-white p-2 rounded text-sm font-semibold hover:bg-gray-500 transition">α</button>
                  <button onClick={() => insertFormula('β')} className="bg-gray-400 text-white p-2 rounded text-sm font-semibold hover:bg-gray-500 transition">β</button>

                  {/* Row 5 - Greek Letters */}
                  <button onClick={() => insertFormula('γ')} className="bg-gray-400 text-white p-2 rounded text-sm font-semibold hover:bg-gray-500 transition">γ</button>
                  <button onClick={() => insertFormula('δ')} className="bg-gray-400 text-white p-2 rounded text-sm font-semibold hover:bg-gray-500 transition">δ</button>
                  <button onClick={() => insertFormula('ε')} className="bg-gray-400 text-white p-2 rounded text-sm font-semibold hover:bg-gray-500 transition">ε</button>
                  <button onClick={() => insertFormula('θ')} className="bg-gray-400 text-white p-2 rounded text-sm font-semibold hover:bg-gray-500 transition">θ</button>
                  <button onClick={() => insertFormula('λ')} className="bg-gray-400 text-white p-2 rounded text-sm font-semibold hover:bg-gray-500 transition">λ</button>
                  <button onClick={() => insertFormula('μ')} className="bg-gray-400 text-white p-2 rounded text-sm font-semibold hover:bg-gray-500 transition">μ</button>
                  <button onClick={() => insertFormula('ρ')} className="bg-gray-400 text-white p-2 rounded text-sm font-semibold hover:bg-gray-500 transition">ρ</button>
                  <button onClick={() => insertFormula('σ')} className="bg-gray-400 text-white p-2 rounded text-sm font-semibold hover:bg-gray-500 transition">σ</button>

                  {/* Row 6 - Set and Logic Symbols */}
                  <button onClick={() => insertFormula('∪')} className="bg-gray-400 text-white p-2 rounded text-sm font-semibold hover:bg-gray-500 transition">∪</button>
                  <button onClick={() => insertFormula('∩')} className="bg-gray-400 text-white p-2 rounded text-sm font-semibold hover:bg-gray-500 transition">∩</button>
                  <button onClick={() => insertFormula('⊂')} className="bg-gray-400 text-white p-2 rounded text-sm font-semibold hover:bg-gray-500 transition">⊂</button>
                  <button onClick={() => insertFormula('⊃')} className="bg-gray-400 text-white p-2 rounded text-sm font-semibold hover:bg-gray-500 transition">⊃</button>
                  <button onClick={() => insertFormula('∈')} className="bg-gray-400 text-white p-2 rounded text-sm font-semibold hover:bg-gray-500 transition">∈</button>
                  <button onClick={() => insertFormula('∉')} className="bg-gray-400 text-white p-2 rounded text-sm font-semibold hover:bg-gray-500 transition">∉</button>
                  <button onClick={() => insertFormula('∅')} className="bg-gray-400 text-white p-2 rounded text-sm font-semibold hover:bg-gray-500 transition">∅</button>
                  <button onClick={() => insertFormula('°')} className="bg-gray-400 text-white p-2 rounded text-sm font-semibold hover:bg-gray-500 transition">°</button>
                </div>
              </div>

              {/* Insert Button */}
              <div className="flex justify-end">
                <button
                  onClick={insertFormulaToTextarea}
                  disabled={!formulaInput.trim()}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Chèn
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Question Bank Modal */}
        {showQuestionBankModal && (
          <div className="fixed inset-0 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
              {/* Modal Header */}
              <div className="flex justify-between items-center p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-black">Chọn câu hỏi từ ngân hàng</h2>
                <button
                  onClick={() => setShowQuestionBankModal(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ✕
                </button>
              </div>

              {/* Modal Content */}
              <div className="flex flex-1 overflow-hidden">
                {/* Left Side - Question Banks */}
                <div className="w-1/4 border-r border-gray-200 overflow-y-auto">
                  {loadingBanks ? (
                    <div className="p-4 text-center text-gray-500">Đang tải...</div>
                  ) : questionBanks.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">Không có ngân hàng</div>
                  ) : (
                    <div className="divide-y">
                      {questionBanks.map((bank) => (
                        <button
                          key={bank._id}
                          onClick={() => {
                            setSelectedBankId(bank._id);
                            loadQuestionsFromBank(bank._id);
                          }}
                          className={`w-full text-left px-4 py-3 transition ${
                            selectedBankId === bank._id
                              ? 'bg-blue-50 border-l-4 border-blue-600'
                              : 'hover:bg-gray-50'
                          }`}
                        >
                          <div className="font-semibold text-gray-900 text-sm">{bank.name}</div>
                          <div className="text-xs text-gray-500 mt-1">{bank.totalQuestions} câu</div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Right Side - Questions */}
                <div className="w-3/4 overflow-y-auto p-4">
                  {loadingQuestions ? (
                    <div className="text-center text-gray-500">Đang tải câu hỏi...</div>
                  ) : bankQuestions.length === 0 ? (
                    <div className="text-center text-gray-500">Ngân hàng này không có câu hỏi</div>
                  ) : (
                    <div className="space-y-3">
                      {bankQuestions.map((question) => (
                        <div
                          key={question._id}
                          className="p-4 border border-gray-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition cursor-pointer"
                          onClick={() => insertQuestionFromBank(question)}
                        >
                          <div className="font-semibold text-gray-900 mb-2">{question.content}</div>
                          <div className="space-y-1 text-sm text-gray-700">
                            {question.options?.map((option, idx) => (
                              <div key={idx} className="flex gap-2">
                                <span className="font-semibold text-gray-600">
                                  {String.fromCharCode(65 + idx)}.
                                </span>
                                <span>{option.text}</span>
                                {option.isCorrect && (
                                  <span className="ml-auto text-green-600 font-semibold">✓</span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
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
            <div className="flex gap-2 mb-2">
              <button
                type="button"
                onClick={() => setShowFormulaModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm font-semibold transition"
                title="Chèn công thức"
              >
                ∑ Công thức
              </button>
              <button
                type="button"
                onClick={openQuestionBankModal}
                className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded text-sm font-semibold transition"
                title="Chọn câu hỏi từ ngân hàng"
              >
                Ngân hàng
              </button>
            </div>
            <textarea
              ref={textareaRef}
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

        {/* Formula Editor Modal */}
        {showFormulaModal && (
          <div className="fixed inset-0 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-black">Soạn thảo công thức</h2>
                <button
                  onClick={() => {
                    setShowFormulaModal(false);
                    setFormulaInput('');
                  }}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ✕
                </button>
              </div>

              {/* Formula Input */}
              <input
                ref={formulaInputRef}
                type="text"
                value={formulaInput}
                onChange={(e) => setFormulaInput(e.target.value)}
                placeholder="Nhập hoặc chèn công thức..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
              />

              {/* Math Keyboard */}
              <div className="bg-gray-100 p-4 rounded-lg mb-4">
                <div className="grid grid-cols-8 gap-2">
                  {/* Row 1 - Roots and Powers */}
                  <button onClick={() => insertFormula('√')} className="bg-gray-400 text-white p-2 rounded text-sm font-semibold hover:bg-gray-500 transition">√</button>
                  <button onClick={() => insertFormula('∛')} className="bg-gray-400 text-white p-2 rounded text-sm font-semibold hover:bg-gray-500 transition">∛</button>
                  <button onClick={() => insertFormula('∜')} className="bg-gray-400 text-white p-2 rounded text-sm font-semibold hover:bg-gray-500 transition">∜</button>
                  <button onClick={() => insertFormula('^')} className="bg-gray-400 text-white p-2 rounded text-sm font-semibold hover:bg-gray-500 transition">^</button>
                  <button onClick={() => insertFormula('x²')} className="bg-gray-400 text-white p-2 rounded text-sm font-semibold hover:bg-gray-500 transition">x²</button>
                  <button onClick={() => insertFormula('x³')} className="bg-gray-400 text-white p-2 rounded text-sm font-semibold hover:bg-gray-500 transition">x³</button>
                  <button onClick={() => insertFormula('π')} className="bg-gray-400 text-white p-2 rounded text-sm font-semibold hover:bg-gray-500 transition">π</button>
                  <button onClick={() => insertFormula('e')} className="bg-gray-400 text-white p-2 rounded text-sm font-semibold hover:bg-gray-500 transition">e</button>

                  {/* Row 2 - Basic Operators */}
                  <button onClick={() => insertFormula('+')} className="bg-gray-400 text-white p-2 rounded text-sm font-semibold hover:bg-gray-500 transition">+</button>
                  <button onClick={() => insertFormula('−')} className="bg-gray-400 text-white p-2 rounded text-sm font-semibold hover:bg-gray-500 transition">−</button>
                  <button onClick={() => insertFormula('×')} className="bg-gray-400 text-white p-2 rounded text-sm font-semibold hover:bg-gray-500 transition">×</button>
                  <button onClick={() => insertFormula('÷')} className="bg-gray-400 text-white p-2 rounded text-sm font-semibold hover:bg-gray-500 transition">÷</button>
                  <button onClick={() => insertFormula('=')} className="bg-gray-400 text-white p-2 rounded text-sm font-semibold hover:bg-gray-500 transition">=</button>
                  <button onClick={() => insertFormula('≠')} className="bg-gray-400 text-white p-2 rounded text-sm font-semibold hover:bg-gray-500 transition">≠</button>
                  <button onClick={() => insertFormula('≈')} className="bg-gray-400 text-white p-2 rounded text-sm font-semibold hover:bg-gray-500 transition">≈</button>
                  <button onClick={() => insertFormula('±')} className="bg-gray-400 text-white p-2 rounded text-sm font-semibold hover:bg-gray-500 transition">±</button>

                  {/* Row 3 - Comparison and Brackets */}
                  <button onClick={() => insertFormula('<')} className="bg-gray-400 text-white p-2 rounded text-sm font-semibold hover:bg-gray-500 transition">&lt;</button>
                  <button onClick={() => insertFormula('>')} className="bg-gray-400 text-white p-2 rounded text-sm font-semibold hover:bg-gray-500 transition">&gt;</button>
                  <button onClick={() => insertFormula('≤')} className="bg-gray-400 text-white p-2 rounded text-sm font-semibold hover:bg-gray-500 transition">≤</button>
                  <button onClick={() => insertFormula('≥')} className="bg-gray-400 text-white p-2 rounded text-sm font-semibold hover:bg-gray-500 transition">≥</button>
                  <button onClick={() => insertFormula('(')} className="bg-gray-400 text-white p-2 rounded text-sm font-semibold hover:bg-gray-500 transition">(</button>
                  <button onClick={() => insertFormula(')')} className="bg-gray-400 text-white p-2 rounded text-sm font-semibold hover:bg-gray-500 transition">)</button>
                  <button onClick={() => insertFormula('[')} className="bg-gray-400 text-white p-2 rounded text-sm font-semibold hover:bg-gray-500 transition">[</button>
                  <button onClick={() => insertFormula(']')} className="bg-gray-400 text-white p-2 rounded text-sm font-semibold hover:bg-gray-500 transition">]</button>

                  {/* Row 4 - Calculus and Greek Letters */}
                  <button onClick={() => insertFormula('∞')} className="bg-gray-400 text-white p-2 rounded text-sm font-semibold hover:bg-gray-500 transition">∞</button>
                  <button onClick={() => insertFormula('∑')} className="bg-gray-400 text-white p-2 rounded text-sm font-semibold hover:bg-gray-500 transition">∑</button>
                  <button onClick={() => insertFormula('∏')} className="bg-gray-400 text-white p-2 rounded text-sm font-semibold hover:bg-gray-500 transition">∏</button>
                  <button onClick={() => insertFormula('∫')} className="bg-gray-400 text-white p-2 rounded text-sm font-semibold hover:bg-gray-500 transition">∫</button>
                  <button onClick={() => insertFormula('∂')} className="bg-gray-400 text-white p-2 rounded text-sm font-semibold hover:bg-gray-500 transition">∂</button>
                  <button onClick={() => insertFormula('∇')} className="bg-gray-400 text-white p-2 rounded text-sm font-semibold hover:bg-gray-500 transition">∇</button>
                  <button onClick={() => insertFormula('α')} className="bg-gray-400 text-white p-2 rounded text-sm font-semibold hover:bg-gray-500 transition">α</button>
                  <button onClick={() => insertFormula('β')} className="bg-gray-400 text-white p-2 rounded text-sm font-semibold hover:bg-gray-500 transition">β</button>

                  {/* Row 5 - Greek Letters */}
                  <button onClick={() => insertFormula('γ')} className="bg-gray-400 text-white p-2 rounded text-sm font-semibold hover:bg-gray-500 transition">γ</button>
                  <button onClick={() => insertFormula('δ')} className="bg-gray-400 text-white p-2 rounded text-sm font-semibold hover:bg-gray-500 transition">δ</button>
                  <button onClick={() => insertFormula('ε')} className="bg-gray-400 text-white p-2 rounded text-sm font-semibold hover:bg-gray-500 transition">ε</button>
                  <button onClick={() => insertFormula('θ')} className="bg-gray-400 text-white p-2 rounded text-sm font-semibold hover:bg-gray-500 transition">θ</button>
                  <button onClick={() => insertFormula('λ')} className="bg-gray-400 text-white p-2 rounded text-sm font-semibold hover:bg-gray-500 transition">λ</button>
                  <button onClick={() => insertFormula('μ')} className="bg-gray-400 text-white p-2 rounded text-sm font-semibold hover:bg-gray-500 transition">μ</button>
                  <button onClick={() => insertFormula('ρ')} className="bg-gray-400 text-white p-2 rounded text-sm font-semibold hover:bg-gray-500 transition">ρ</button>
                  <button onClick={() => insertFormula('σ')} className="bg-gray-400 text-white p-2 rounded text-sm font-semibold hover:bg-gray-500 transition">σ</button>

                  {/* Row 6 - Set and Logic Symbols */}
                  <button onClick={() => insertFormula('∪')} className="bg-gray-400 text-white p-2 rounded text-sm font-semibold hover:bg-gray-500 transition">∪</button>
                  <button onClick={() => insertFormula('∩')} className="bg-gray-400 text-white p-2 rounded text-sm font-semibold hover:bg-gray-500 transition">∩</button>
                  <button onClick={() => insertFormula('⊂')} className="bg-gray-400 text-white p-2 rounded text-sm font-semibold hover:bg-gray-500 transition">⊂</button>
                  <button onClick={() => insertFormula('⊃')} className="bg-gray-400 text-white p-2 rounded text-sm font-semibold hover:bg-gray-500 transition">⊃</button>
                  <button onClick={() => insertFormula('∈')} className="bg-gray-400 text-white p-2 rounded text-sm font-semibold hover:bg-gray-500 transition">∈</button>
                  <button onClick={() => insertFormula('∉')} className="bg-gray-400 text-white p-2 rounded text-sm font-semibold hover:bg-gray-500 transition">∉</button>
                  <button onClick={() => insertFormula('∅')} className="bg-gray-400 text-white p-2 rounded text-sm font-semibold hover:bg-gray-500 transition">∅</button>
                  <button onClick={() => insertFormula('°')} className="bg-gray-400 text-white p-2 rounded text-sm font-semibold hover:bg-gray-500 transition">°</button>
                </div>
              </div>

              {/* Insert Button */}
              <div className="flex justify-end">
                <button
                  onClick={insertFormulaToTextarea}
                  disabled={!formulaInput.trim()}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Chèn
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Question Bank Modal */}
        {showQuestionBankModal && (
          <div className="fixed inset-0 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
              {/* Modal Header */}
              <div className="flex justify-between items-center p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-black">Chọn câu hỏi từ ngân hàng</h2>
                <button
                  onClick={() => setShowQuestionBankModal(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ✕
                </button>
              </div>

              {/* Modal Content */}
              <div className="flex flex-1 overflow-hidden">
                {/* Left Side - Question Banks */}
                <div className="w-1/4 border-r border-gray-200 overflow-y-auto">
                  {loadingBanks ? (
                    <div className="p-4 text-center text-gray-500">Đang tải...</div>
                  ) : questionBanks.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">Không có ngân hàng</div>
                  ) : (
                    <div className="divide-y">
                      {questionBanks.map((bank) => (
                        <button
                          key={bank._id}
                          onClick={() => {
                            setSelectedBankId(bank._id);
                            loadQuestionsFromBank(bank._id);
                          }}
                          className={`w-full text-left px-4 py-3 transition ${
                            selectedBankId === bank._id
                              ? 'bg-blue-50 border-l-4 border-blue-600'
                              : 'hover:bg-gray-50'
                          }`}
                        >
                          <div className="font-semibold text-gray-900 text-sm">{bank.name}</div>
                          <div className="text-xs text-gray-500 mt-1">{bank.totalQuestions} câu</div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Right Side - Questions */}
                <div className="w-3/4 overflow-y-auto p-4">
                  {loadingQuestions ? (
                    <div className="text-center text-gray-500">Đang tải câu hỏi...</div>
                  ) : bankQuestions.length === 0 ? (
                    <div className="text-center text-gray-500">Ngân hàng này không có câu hỏi</div>
                  ) : (
                    <div className="space-y-3">
                      {bankQuestions.map((question) => (
                        <div
                          key={question._id}
                          className="p-4 border border-gray-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition cursor-pointer"
                          onClick={() => insertQuestionFromBank(question)}
                        >
                          <div className="font-semibold text-gray-900 mb-2">{question.content}</div>
                          <div className="space-y-1 text-sm text-gray-700">
                            {question.options?.map((option, idx) => (
                              <div key={idx} className="flex gap-2">
                                <span className="font-semibold text-gray-600">
                                  {String.fromCharCode(65 + idx)}.
                                </span>
                                <span>{option.text}</span>
                                {option.isCorrect && (
                                  <span className="ml-auto text-green-600 font-semibold">✓</span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuestionComposer;
