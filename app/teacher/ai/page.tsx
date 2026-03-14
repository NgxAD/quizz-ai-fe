'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import TeacherLayout from '@/layouts/TeacherLayout';
import aiApi from '@/api/ai.api';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface GeneratedQuestion {
  content: string;
  type: string;
  level: string;
  options?: Array<{ text: string; isCorrect: boolean }>;
  correctAnswer: string;
  explanation: string;
  isActive: boolean;
}

export default function AIChatPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [generatedQuestions, setGeneratedQuestions] = useState<GeneratedQuestion[]>([]);
  const [quizInfo, setQuizInfo] = useState({ quizId: '', quizTitle: '' });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [conversationId, setConversationId] = useState<string>('');

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize empty quiz
  useEffect(() => {
    const initChat = async () => {
      try {
        // Create empty quiz for draft
        const response = await aiApi.initializeAIChat();
        setConversationId(response.data.conversationId);
        setQuizInfo({
          quizId: response.data.quizId,
          quizTitle: response.data.quizTitle,
        });
        
        // Add initial assistant message
        setMessages([
          {
            id: '0',
            role: 'assistant',
            content:
              'Xin chào! 👋 Tôi là trợ lý AI tạo đề thi. Bạn có thể:\n\n📝 **Tạo đề:** "Tạo 20 câu về Toán chương 2"\n✏️ **Sửa toàn bộ:** "Làm khó hơn" hoặc "Thêm 5 câu nữa"\n🔧 **Sửa từng câu:** "Sửa câu 3 để dễ hơn" hoặc "Thay đáp án câu 5"\n\nHãy bắt đầu bằng cách mô tả đề thi bạn muốn!',
            timestamp: new Date(),
          },
        ]);
      } catch (err) {
        setError('Lỗi khởi tạo chat');
      }
    };
    initChat();
  }, []);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    setError('');

    try {
      const response = await aiApi.chatAI({
        conversationId,
        message: input,
        currentQuestions: generatedQuestions,
      });

      // Add assistant message
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.data.message,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);

      // Update questions if AI generated/modified them
      if (response.data.questions && response.data.questions.length > 0) {
        setGeneratedQuestions(response.data.questions);
      }

      // Update quiz info if changed
      if (response.data.quizId) {
        setQuizInfo({
          quizId: response.data.quizId,
          quizTitle: response.data.quizTitle || quizInfo.quizTitle,
        });
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Lỗi xảy ra';
      setError(errorMessage);
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `❌ Lỗi: ${errorMessage}`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveQuestions = async () => {
    if (!quizInfo.quizId || generatedQuestions.length === 0) {
      setError('Chưa có câu hỏi để lưu');
      return;
    }

    setIsSaving(true);
    setError('');

    try {
      const response = await aiApi.saveQuestions({
        quizId: quizInfo.quizId,
        questions: generatedQuestions,
      });

      setError('');
      const successMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `✅ Đã lưu ${response.data.count} câu hỏi thành công!`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, successMsg]);

      // Redirect after 2 seconds
      setTimeout(() => {
        router.push('/teacher/questions');
      }, 2000);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Lỗi lưu đề thi';
      setError(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <TeacherLayout>
      <div className="h-[calc(100vh-200px)] flex gap-4">
        {/* Chat Panel */}
        <div className="flex-1 flex flex-col bg-white rounded-lg shadow">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    msg.role === 'user'
                      ? 'bg-blue-500 text-white rounded-br-none'
                      : 'bg-gray-100 text-gray-900 rounded-bl-none'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  <p className="text-xs opacity-70 mt-1">
                    {msg.timestamp.toLocaleTimeString('vi-VN', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 px-4 py-2 rounded-lg">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 mx-4">
              {error}
            </div>
          )}

          {/* Input */}
          <form onSubmit={handleSendMessage} className="p-4 border-t">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Nhập yêu cầu của bạn (Tạo 20 câu về Toán, Sửa câu 5, ...)"
                className="flex-1 border rounded-lg px-4 py-2 text-sm text-black focus:outline-none focus:border-blue-500"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  loading || !input.trim()
                    ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {loading ? '⏳' : '📤'}
              </button>
            </div>
          </form>
        </div>

        {/* Preview Panel */}
        <div className="flex-1 flex flex-col bg-white rounded-lg shadow overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4">
            <h2 className="font-bold text-lg">
              Xem trước ({generatedQuestions.length} câu)
            </h2>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {generatedQuestions.length === 0 ? (
              <div className="h-full flex items-center justify-center text-gray-400">
                <p>Chưa có câu hỏi. Hãy bắt đầu chat để tạo đề thi.</p>
              </div>
            ) : (
              generatedQuestions.map((question, idx) => (
                <div key={idx} className="border rounded-lg p-3 bg-gray-50">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold text-sm text-gray-900">
                      Câu {idx + 1}: {question.content}
                    </h4>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        question.level === 'easy'
                          ? 'bg-green-100 text-green-800'
                          : question.level === 'medium'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {question.level === 'easy'
                        ? 'Dễ'
                        : question.level === 'medium'
                          ? 'Trung bình'
                          : 'Khó'}
                    </span>
                  </div>

                  {question.options && question.options.length > 0 && (
                    <div className="mb-2 space-y-1">
                      {question.options.map((opt, optIdx) => (
                        <div
                          key={optIdx}
                          className={`text-xs p-1 rounded ${
                            opt.isCorrect
                              ? 'bg-green-100 text-green-900'
                              : 'bg-white text-gray-700'
                          }`}
                        >
                          {opt.text} {opt.isCorrect && '✓'}
                        </div>
                      ))}
                    </div>
                  )}

                  <p className="text-xs text-blue-600 bg-blue-50 p-2 rounded mt-2">
                    <strong>Giải:</strong> {question.explanation}
                  </p>
                </div>
              ))
            )}
          </div>

          {/* Save Button */}
          {generatedQuestions.length > 0 && (
            <div className="border-t p-4 bg-gray-50">
              <button
                onClick={handleSaveQuestions}
                disabled={isSaving}
                className={`w-full py-2 rounded-lg font-bold transition ${
                  isSaving
                    ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                {isSaving
                  ? '⏳ Đang lưu...'
                  : `💾 Lưu ${generatedQuestions.length} câu hỏi`}
              </button>
            </div>
          )}
        </div>
      </div>
    </TeacherLayout>
  );
}

