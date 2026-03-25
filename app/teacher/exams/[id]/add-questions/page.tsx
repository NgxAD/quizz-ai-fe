'use client';

import TeacherLayout from '@/layouts/TeacherLayout';
import { useParams, useRouter } from 'next/navigation';
import { useMemo, useState, useRef } from 'react';
import examApi from '@/api/exam.api';
import questionBankApi, { QuestionBank } from '@/api/question-bank.api';
import questionApi, { Question as ApiQuestion } from '@/api/question.api';

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

export default function AddQuestionsToExamPage() {
  const params = useParams();
  const router = useRouter();
  const examId = (params?.id as string) || '';

  const [textInput, setTextInput] = useState('');
  const [correctAnswers, setCorrectAnswers] = useState<Record<number, 'A' | 'B' | 'C' | 'D'>>({});
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

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

  // Local parsing logic (same as QuestionBank)
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
    const newText = textInput.substring(0, start) + formulaInput + textInput.substring(end);
    setTextInput(newText);
    
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

    const currentQuestionsCount = parseQuestions(textInput).length;

    const textarea = textareaRef.current;
    const start = textarea.selectionStart ?? 0;
    const end = textarea.selectionEnd ?? 0;
    
    const formattedQuestion = `${question.content}
A. ${question.options?.[0]?.text || ''}
B. ${question.options?.[1]?.text || ''}
C. ${question.options?.[2]?.text || ''}
D. ${question.options?.[3]?.text || ''}

`;
    
    const newText = textInput.substring(0, start) + formattedQuestion + textInput.substring(end);
    setTextInput(newText);
    
    const correctAnswerIndex = question.options?.findIndex(opt => opt.isCorrect) ?? 0;
    const correctAnswerLetter = String.fromCharCode(65 + correctAnswerIndex) as 'A' | 'B' | 'C' | 'D';
    
    const newCorrectAnswers = { ...correctAnswers };
    newCorrectAnswers[currentQuestionsCount] = correctAnswerLetter;
    setCorrectAnswers(newCorrectAnswers);
    
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + formattedQuestion.length, start + formattedQuestion.length);
    }, 0);

    setShowQuestionBankModal(false);
  };

  const parsedData = useMemo(() => {
    const questions = parseQuestions(textInput).map((q, index) => ({
      ...q,
      correctAnswer: correctAnswers[index] || 'A',
    }));
    return questions;
  }, [textInput, correctAnswers]);

  const handleSubmitQuestions = async () => {
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
      
      // Get current exam to keep existing data
      const examResponse = await examApi.getById(examId);
      const currentExam = examResponse.data;

      // Format new questions
      const newQuestions = parsedData.map(q => ({
        content: q.question,
        type: 'multiple-choice',
        options: [
          { text: q.answers.A, isCorrect: q.correctAnswer === 'A' },
          { text: q.answers.B, isCorrect: q.correctAnswer === 'B' },
          { text: q.answers.C, isCorrect: q.correctAnswer === 'C' },
          { text: q.answers.D, isCorrect: q.correctAnswer === 'D' },
        ],
      }));

      // Combine existing and new questions, ensuring proper type format
      const allQuestions = [
        ...(currentExam.questions || []).map((q: any) => ({
          ...q,
          type: q.type?.includes('-') ? q.type : q.type?.replace('_', '-') || 'multiple-choice',
        })),
        ...newQuestions,
      ];

      // Update exam with all questions
      await examApi.updateExamWithQuestions(examId, {
        title: currentExam.title,
        description: currentExam.description,
        duration: currentExam.duration,
        passingPercentage: currentExam.passingPercentage,
        type: currentExam.examType || 'exercise',
        questions: allQuestions,
      });

      setSuccessMessage(`Đã thêm thành công ${parsedData.length} câu hỏi!`);
      setTimeout(() => {
        router.push(`/teacher/exams/${examId}/edit`);
      }, 1000);
    } catch (err: any) {
      console.error('Lỗi khi thêm câu hỏi:', err);
      alert(err.response?.data?.message || 'Không thể thêm câu hỏi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <TeacherLayout>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Thêm câu hỏi</h1>
          <button
            onClick={() => router.push(`/teacher/exams/${examId}/edit`)}
            className="text-gray-600 hover:text-gray-900 text-2xl"
          >
            ←
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
        {/* Left Pane - Input Form */}
        <div className="space-y-4">
          {successMessage && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-3 py-2 rounded text-sm">
              {successMessage}
            </div>
          )}

          <div className="bg-white rounded-lg shadow p-4 space-y-3">
            <div>
              <h2 className="text-xs font-semibold text-gray-700 mb-1">
                Nhập nội dung
              </h2>
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
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 h-72"
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
        <div className="bg-white rounded-lg shadow p-4 sticky top-6 h-fit flex flex-col max-h-[calc(100vh-50px)]">
          <h3 className="text-xs font-semibold text-gray-700 mb-2">Preview ({parsedData.length})</h3>

          {parsedData.length > 0 ? (
            <div className="flex flex-col gap-2 overflow-y-auto flex-1">
              {parsedData.map((q, index) => (
                <div key={index} className="border border-gray-200 rounded p-2 bg-gray-50 flex-shrink-0">
                  <div className="mb-1">
                    <h3 className="font-semibold text-gray-900 text-xs">
                      {q.question}
                    </h3>
                  </div>

                  <div className="space-y-1 ml-1">
                    {['A', 'B', 'C', 'D'].map((key) => (
                      <div
                        key={key}
                        className="flex items-center gap-2 p-1 rounded hover:bg-gray-100 cursor-pointer"
                        onClick={() => setCorrectAnswers({ ...correctAnswers, [index]: key as 'A' | 'B' | 'C' | 'D' })}
                      >
                        <input
                          type="radio"
                          name={`correct-answer-${index}`}
                          checked={q.correctAnswer === key}
                          onChange={() => setCorrectAnswers({ ...correctAnswers, [index]: key as 'A' | 'B' | 'C' | 'D' })}
                          className="w-3 h-3 cursor-pointer"
                        />
                        <span className="font-semibold text-gray-600 min-w-4 text-xs">{key}:</span>
                        <span className="flex-1 text-gray-700 text-xs">
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
                onClick={handleSubmitQuestions}
                disabled={loading}
                className="w-full px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50"
              >
                {loading ? 'Đang thêm...' : `Thêm tất cả ${parsedData.length} câu`}
              </button>
            </div>
          )}
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
    </TeacherLayout>
  );
}
