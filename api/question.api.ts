import axiosClient from './axiosClient';

export interface QuestionPayload {
  content: string;
  type: 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'SHORT_ANSWER';
  options?: string[];
  correctAnswer: string;
  explanation?: string;
  subjectId: string;
}

export interface Question extends QuestionPayload {
  _id: string;
  createdAt: string;
  updatedAt: string;
}

export interface GenerateQuestionsPayload {
  topic: string;
  count: number;
  type: 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'SHORT_ANSWER';
  subjectId: string;
}

const questionApi = {
  create: (payload: QuestionPayload) =>
    axiosClient.post<Question>('/questions', payload),

  list: (subjectId?: string) =>
    axiosClient.get<Question[]>('/questions', {
      params: { subjectId },
    }),

  update: (id: string, payload: Partial<QuestionPayload>) =>
    axiosClient.put<Question>(`/questions/${id}`, payload),

  delete: (id: string) =>
    axiosClient.delete(`/questions/${id}`),

  generateByAI: (payload: GenerateQuestionsPayload) =>
    axiosClient.post<Question[]>('/ai/generate-questions', payload),
};

export default questionApi;
