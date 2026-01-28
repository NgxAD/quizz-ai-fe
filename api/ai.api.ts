import axiosClient from './axiosClient';

export interface AIGeneratePayload {
  quizId: string;
  topic: string;
  numberOfQuestions: number;
  difficulty: 'easy' | 'medium' | 'hard';
  language: string;
}

export interface GeneratedQuestion {
  _id?: string;
  content: string;
  type: string;
  options?: Array<{ text: string; isCorrect: boolean }>;
  correctAnswer?: string;
  explanation: string;
  level: string;
  isActive: boolean;
}

export interface GenerateResponse {
  success: boolean;
  message: string;
  count: number;
  questions: GeneratedQuestion[];
  quizId: string;
  status: string;
}

const aiApi = {
  generateQuestions: (payload: AIGeneratePayload) =>
    axiosClient.post<GenerateResponse>('/ai/generate-questions', payload),

  previewQuestions: (payload: Omit<AIGeneratePayload, 'quizId'>) =>
    axiosClient.post<GenerateResponse>('/ai/preview-questions', payload),

  generateExam: (payload: {
    topic: string;
    numberOfQuestions: number;
    difficulty: string;
  }) => axiosClient.post('/ai/generate-exam', payload),
};

export default aiApi;
