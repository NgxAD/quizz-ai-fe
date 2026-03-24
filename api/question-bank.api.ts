import axiosClient from './axiosClient';

export interface QuestionBank {
  _id: string;
  name: string;
  description?: string;
  createdBy: string;
  questions: string[];
  totalQuestions: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateQuestionBankPayload {
  name: string;
  description?: string;
}

const questionBankApi = {
  create: (payload: CreateQuestionBankPayload) =>
    axiosClient.post<QuestionBank>('/question-banks', payload),

  list: () =>
    axiosClient.get<QuestionBank[]>('/question-banks'),

  getById: (id: string) =>
    axiosClient.get<QuestionBank>(`/question-banks/${id}`),

  update: (id: string, payload: Partial<CreateQuestionBankPayload>) =>
    axiosClient.put<QuestionBank>(`/question-banks/${id}`, payload),

  delete: (id: string) =>
    axiosClient.delete(`/question-banks/${id}`),

  addQuestion: (bankId: string, questionId: string) =>
    axiosClient.post(`/question-banks/${bankId}/questions/${questionId}`),

  removeQuestion: (bankId: string, questionId: string) =>
    axiosClient.delete(`/question-banks/${bankId}/questions/${questionId}`),
};

export default questionBankApi;
