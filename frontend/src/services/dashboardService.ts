import { api } from './api';
import { StudentDashboardData, LecturerDashboardData } from '../types/dashboard';

export const dashboardService = {
  getStudentDashboard: async (): Promise<StudentDashboardData> => {
    const response = await api.get<StudentDashboardData>('/dashboard/student');
    return response.data;
  },

  getLecturerDashboard: async (): Promise<LecturerDashboardData> => {
    const response = await api.get<LecturerDashboardData>('/dashboard/lecturer');
    return response.data;
  }
};
