import axiosClient from './axiosClient';

export interface SubmissionPayload {
  examId: string;
  answers: {
    questionId: string;
    answer: string;
  }[];
}

export interface Submission extends SubmissionPayload {
  _id: string;
  userId: string;
  score: number;
  submittedAt: string;
}

const submissionApi = {
  submit: (payload: SubmissionPayload) =>
    axiosClient.post<Submission>('/submissions', payload),

  startExam: (examId: string) =>
    axiosClient.post<Submission>(`/submissions/start/${examId}`, {}),

  saveAnswers: (submissionId: string, payload: { answers: Array<{ questionId: string; answer: string }> }) =>
    axiosClient.post(`/submissions/${submissionId}/save`, payload),

  submitExam: (submissionId: string, payload: { notes?: string; timeElapsed?: number }) =>
    axiosClient.post<Submission>(`/submissions/${submissionId}/submit`, payload),

  getById: (id: string) =>
    axiosClient.get<Submission>(`/submissions/${id}`),

  getUserSubmissions: () =>
    axiosClient.get<Submission[]>('/submissions/my-submissions'),

  getExamSubmissions: (examId: string) =>
    axiosClient.get<Submission[]>(`/submissions/exam/${examId}`),
};

export default submissionApi;
