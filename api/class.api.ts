import axiosClient from './axiosClient';

export interface ClassPayload {
  name: string;
  description?: string;
}

export interface Class extends ClassPayload {
  _id: string;
  code: string;
  createdBy: string;
  studentCount: number;
  createdAt: string;
  updatedAt: string;
  assignedExams?: any[];
}

const classApi = {
  create: (payload: ClassPayload) =>
    axiosClient.post<Class>('/classes', payload),

  list: () =>
    axiosClient.get<Class[]>('/classes'),

  getById: (id: string) =>
    axiosClient.get<Class>(`/classes/${id}`),

  update: (id: string, payload: Partial<ClassPayload>) =>
    axiosClient.put<Class>(`/classes/${id}`, payload),

  delete: (id: string) =>
    axiosClient.delete(`/classes/${id}`),

  getMembers: (id: string) =>
    axiosClient.get(`/classes/${id}/members`),

  removeMember: (classId: string, studentId: string) =>
    axiosClient.delete(`/classes/${classId}/members/${studentId}`),

  joinClass: (code: string) =>
    axiosClient.post(`/classes/join`, { code }),

  assignExamToClass: (classId: string, examId: string) =>
    axiosClient.post(`/classes/${classId}/exams/${examId}`),
};

export default classApi;
