import axiosClient from './axiosClient';

export interface Result {
  _id: string;
  quizId: string;
  userId: string;
  submissionId: string;
  totalPoints: number;
  correctAnswers: number;
  wrongAnswers: number;
  skipped: number;
  score: number;
  isPassed: boolean;
  completedAt: string;
}

const resultApi = {
  getById: (id: string) =>
    axiosClient.get<Result>(`/results/${id}`),

  getUserResults: () =>
    axiosClient.get<Result[]>('/results/user'),

  getExamResults: (examId: string) =>
    axiosClient.get<Result[]>(`/results/exam/${examId}`),
};

export default resultApi;
