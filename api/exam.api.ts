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
  image?: string; // base64 image data
}

export interface Exam extends ExamPayload {
  _id: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  isPublished?: boolean;
  questions?: Question[];
  totalQuestions?: number;
  fileContent?: string; // Nội dung file đề (nếu tạo từ file)
  fileName?: string; // Tên file gốc
  examType?: 'exercise' | 'test'; // exercise: can retake & see answers, test: one time only
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
    fileContent?: string;
    fileName?: string;
  }) =>
    axiosClient.post<Exam>('/exams/create-from-questions', payload),

  uploadAndCreate: (formData: FormData) =>
    axiosClient.post<Exam>('/exams/upload-and-create', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }),

  uploadAndCreateStructure: (formData: FormData) =>
    axiosClient.post<Exam>('/exams/upload-and-create-structure', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }),

  list: (status?: 'draft' | 'published') => {
    const url = status ? `/exams?status=${status}` : '/exams';
    return axiosClient.get<Exam[]>(url);
  },

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
