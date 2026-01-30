import axiosClient from './axiosClient';

export interface ExamPayload {
  title: string;
  description?: string;
  duration?: number; // in minutes
  passingPercentage?: number; // percentage
  questionIds?: string[];
}

export interface Question {
  _id?: string;
  content: string;
  type: string;
  options?: Array<{ text: string; isCorrect: boolean }>;
  correctAnswer?: string;
  explanation?: string;
}

export interface Exam extends ExamPayload {
  _id: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  isPublished?: boolean;
  questions?: Question[];
  totalQuestions?: number;
}

const examApi = {
  create: (payload: ExamPayload) =>
    axiosClient.post<Exam>('/exams', payload),

  createExam: (payload: ExamPayload) =>
    axiosClient.post<Exam>('/exams', payload),

  previewFile: (formData: FormData) =>
    axiosClient.post<{
      success: boolean;
      rawText: string;
      questionsFound: number;
      preview: any[];
    }>('/exams/preview-file', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }),

  extractQuestionsFromText: (text: string) =>
    axiosClient.post<{
      success: boolean;
      questionsFound: number;
      questions: any[];
    }>('/exams/extract-questions', { text }),

  createExamWithQuestions: (payload: {
    title: string;
    description?: string;
    duration?: number;
    passingPercentage?: number;
    questions: any[];
  }) =>
    axiosClient.post<Exam>('/exams/create-from-questions', payload),

  uploadAndCreate: (formData: FormData) =>
    axiosClient.post<Exam>('/exams/upload-and-create', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }),

  list: () =>
    axiosClient.get<Exam[]>('/exams'),

  getById: (id: string) =>
    axiosClient.get<Exam>(`/exams/${id}`),

  update: (id: string, payload: Partial<ExamPayload>) =>
    axiosClient.put<Exam>(`/exams/${id}`, payload),

  updateExamWithQuestions: (id: string, payload: any) =>
    axiosClient.put<Exam>(`/exams/${id}/with-questions`, payload),

  delete: (id: string) =>
    axiosClient.delete(`/exams/${id}`),

  publish: (id: string) =>
    axiosClient.post(`/exams/${id}/publish`, {}),

  unpublish: (id: string) =>
    axiosClient.post(`/exams/${id}/unpublish`, {}),

  getForStudent: () =>
    axiosClient.get<Exam[]>('/exams/available'),
};

export default examApi;
