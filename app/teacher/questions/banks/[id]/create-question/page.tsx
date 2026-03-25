'use client';

import TeacherLayout from '@/layouts/TeacherLayout';
import { useParams, useRouter } from 'next/navigation';
import { useMemo, useRef, useState } from 'react';
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

  // Tab state
  const [activeTab, setActiveTab] = useState<'new' | 'existing'>('new');

  // New questions form states
  const [textInput, setTextInput] = useState('');
  const [correctAnswers, setCorrectAnswers] = useState<Record<number, 'A' | 'B' | 'C' | 'D'>>({});
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Existing questions states
  const [availableQuestions, setAvailableQuestions] = useState<any[]>([]);
  const [selectedQuestions, setSelectedQuestions] = useState<Set<string>>(new Set());
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Formula modal state
  const [showFormulaModal, setShowFormulaModal] = useState(false);
  const [formulaInput, setFormulaInput] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const formulaInputRef = useRef<HTMLInputElement>(null);

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

  const fetchAvailableQuestions = async () => {
    try {
      setLoadingQuestions(true);
      const [bankRes, questionsRes] = await Promise.all([
        questionBankApi.getById(bankId),
        questionApi.list(),
      ]);
      
      // Filter out questions already in the bank
      const existingQuestionIds = new Set(bankRes.data.questions);
      const available = questionsRes.data.filter(q => !existingQuestionIds.has(q._id));
      setAvailableQuestions(available);
    } catch (error) {
      console.error('Lỗi khi tải câu hỏi:', error);
    } finally {
      setLoadingQuestions(false);
    }
  };

  const handleTabChange = async (tab: 'new' | 'existing') => {
    setActiveTab(tab);
    if (tab === 'existing') {
      await fetchAvailableQuestions();
    }
  };

  const handleToggleQuestion = (questionId: string) => {
    const newSelected = new Set(selectedQuestions);
    if (newSelected.has(questionId)) {
      newSelected.delete(questionId);
    } else {
      newSelected.add(questionId);
    }
    setSelectedQuestions(newSelected);
  };

  const handleAddExistingQuestions = async () => {
    if (selectedQuestions.size === 0) {
      alert('Vui lòng chọn ít nhất một câu hỏi');
      return;
    }

    try {
      setLoading(true);
      await Promise.all(
        Array.from(selectedQuestions).map(qId =>
          questionBankApi.addQuestion(bankId, qId)
        )
      );
      setSuccessMessage(`Đã thêm thành công ${selectedQuestions.size} câu hỏi!`);
      setTimeout(() => {
        router.push(`/teacher/questions/banks/${bankId}`);
      }, 1000);
    } catch (error) {
      console.error('Lỗi khi thêm câu hỏi:', error);
      alert('Không thể thêm câu hỏi. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

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

  const insertFormulaToMain = () => {
    if (formulaInput.trim() && textareaRef.current) {
      const textarea = textareaRef.current;
      const start = textarea.selectionStart ?? 0;
      const end = textarea.selectionEnd ?? 0;
      const newText = textInput.substring(0, start) + formulaInput + textInput.substring(end);
      setTextInput(newText);
      
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + formulaInput.length, start + formulaInput.length);
      }, 0);
    }
    setFormulaInput('');
    setShowFormulaModal(false);
  };

  return (
    <TeacherLayout>
      <div className="space-y-6">
        {/* Top Bar with Back Button and Submit Button */}
        <div className="flex justify-between items-center">
          <button
            onClick={() => router.back()}
            className="text-gray-900 hover:text-gray-700 font-semibold flex items-center gap-2"
          >
            ← Quay lại
          </button>
          
          {activeTab === 'new' && parsedData.length > 0 && (
            <button
              onClick={handleSubmitQuestion}
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50"
            >
              {loading ? 'Đang tạo...' : `Tạo tất cả ${parsedData.length} câu`}
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => handleTabChange('new')}
              className={`flex-1 px-6 py-4 font-semibold text-center transition ${
                activeTab === 'new'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Tạo câu hỏi mới
            </button>
            <button
              onClick={() => handleTabChange('existing')}
              className={`flex-1 px-6 py-4 font-semibold text-center transition ${
                activeTab === 'existing'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Chọn câu hỏi cũ
            </button>
          </div>

          {/* Tab Content */}
          <div className="p-6">
            {/* Tab 1: Create New Questions */}
            {activeTab === 'new' && (
              <div className="grid grid-cols-2 gap-6">
                {/* Left Pane - Input Form */}
                <div className="space-y-0">
                  {successMessage && (
                    <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
                      {successMessage}
                    </div>
                  )}

                  <div className="bg-white rounded-lg p-6 space-y-0">
                    <div className="-mt-2">
                      {/* Button above textarea */}
                      <div className="mb-1">
                        <button
                          onClick={() => setShowFormulaModal(true)}
                          className="px-4 py-2 bg-blue-100 text-blue-600 rounded-lg text-sm font-semibold hover:bg-blue-200 transition"
                        >
                          ∑ Chèn công thức
                        </button>
                      </div>

                      <textarea
                        ref={textareaRef}
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
                <div className="bg-white rounded-lg p-6 sticky top-6 h-fit flex flex-col max-h-[calc(100vh-50px)]">
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
                </div>
              </div>
            )}

            {/* Tab 2: Select Existing Questions */}
            {activeTab === 'existing' && (
              <div className="space-y-4">
                <div>
                  <input
                    type="text"
                    placeholder="Tìm câu hỏi..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                  />
                </div>

                {loadingQuestions ? (
                  <p className="text-gray-600 text-center py-8">Đang tải câu hỏi...</p>
                ) : availableQuestions.filter(q =>
                  q.content.toLowerCase().includes(searchTerm.toLowerCase())
                ).length === 0 ? (
                  <p className="text-gray-600 text-center py-8">
                    {availableQuestions.length === 0 ? 'Không có câu hỏi nào để thêm' : 'Không tìm thấy câu hỏi'}
                  </p>
                ) : (
                  <div className="space-y-2 max-h-[500px] overflow-y-auto">
                    {availableQuestions
                      .filter(q => q.content.toLowerCase().includes(searchTerm.toLowerCase()))
                      .map((question) => (
                        <label key={question._id} className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedQuestions.has(question._id)}
                            onChange={() => handleToggleQuestion(question._id)}
                            className="mt-1 w-4 h-4 text-blue-600 rounded cursor-pointer"
                          />
                          <div className="flex-1">
                            <p className="text-gray-900 font-semibold">{question.content}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {question.type ? (question.type.includes('multiple') ? 'Trắc nghiệm' : question.type) : 'Không xác định'}
                            </p>
                          </div>
                        </label>
                      ))}
                  </div>
                )}

                {selectedQuestions.size > 0 && (
                  <div className="flex justify-end pt-4 border-t border-gray-200">
                    <button
                      onClick={handleAddExistingQuestions}
                      disabled={loading}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50"
                    >
                      {loading ? 'Đang thêm...' : `Thêm ${selectedQuestions.size} câu hỏi`}
                    </button>
                  </div>
                )}
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
                  onClick={insertFormulaToMain}
                  disabled={!formulaInput.trim()}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Chèn
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </TeacherLayout>
  );
}
