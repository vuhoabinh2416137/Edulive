import { api } from './api';
import {
  QuizSummary,
  QuizDetail,
  StartQuizData,
  SubmitQuizPayload,
  QuizResult,
  QuizStatistics,
  QuestionResponse
} from '../types/quiz';

export const quizService = {
  // Lấy danh sách quiz theo khóa học
  async getQuizzesByCourse(courseId: number): Promise<QuizSummary[]> {
    const response = await api.get<QuizSummary[]>(`/courses/${courseId}/quizzes`);
    return response.data;
  },

  // Chi tiết bài quiz
  async getQuizById(id: number): Promise<QuizDetail> {
    const response = await api.get<QuizDetail>(`/quizzes/${id}`);
    return response.data;
  },

  // Giảng viên tạo quiz mới
  async createQuiz(courseId: number, data: Partial<QuizDetail>): Promise<QuizDetail> {
    const response = await api.post<QuizDetail>(`/courses/${courseId}/quizzes`, data);
    return response.data;
  },

  // Sửa thông tin quiz
  async updateQuiz(id: number, data: Partial<QuizDetail>): Promise<QuizDetail> {
    const response = await api.put<QuizDetail>(`/quizzes/${id}`, data);
    return response.data;
  },

  // Xóa bài quiz
  async deleteQuiz(id: number): Promise<void> {
    await api.delete(`/quizzes/${id}`);
  },

  // Thêm câu hỏi
  async addQuestion(quizId: number, data: any): Promise<QuestionResponse> {
    const response = await api.post<QuestionResponse>(`/quizzes/${quizId}/questions`, data);
    return response.data;
  },

  // Xóa câu hỏi
  async deleteQuestion(questionId: number): Promise<void> {
    await api.delete(`/quizzes/questions/${questionId}`);
  },

  // Bắt đầu làm bài thi
  async startQuiz(quizId: number): Promise<StartQuizData> {
    const response = await api.post<StartQuizData>(`/quizzes/${quizId}/start`);
    return response.data;
  },

  // Nộp bài thi
  async submitQuiz(attemptId: number, payload: SubmitQuizPayload): Promise<QuizResult> {
    const response = await api.post<QuizResult>(`/quizzes/attempts/${attemptId}/submit`, payload);
    return response.data;
  },

  // Xem kết quả bài thi
  async getAttemptResult(attemptId: number): Promise<QuizResult> {
    const response = await api.get<QuizResult>(`/quizzes/attempts/${attemptId}/result`);
    return response.data;
  },

  // Giảng viên xem thống kê
  async getQuizStatistics(quizId: number): Promise<QuizStatistics> {
    const response = await api.get<QuizStatistics>(`/quizzes/${quizId}/statistics`);
    return response.data;
  },

  // Tải CSV điểm thi
  async exportQuizCsv(quizId: number): Promise<Blob> {
    const response = await api.get(`/quizzes/${quizId}/export-csv`, {
      responseType: 'blob'
    });
    return response.data;
  }
};
