import { api } from './api';
import { CourseProgress, Enrollment } from '../types/course';

export const enrollmentService = {
  joinCourse: async (params: { classCode?: string; courseId?: number }): Promise<Enrollment> => {
    const res = await api.post<Enrollment>('/enrollments/join', params);
    return res.data;
  },

  getMyCourses: async (): Promise<Enrollment[]> => {
    const res = await api.get<Enrollment[]>('/enrollments/my-courses');
    return res.data;
  },

  completeLesson: async (courseId: number, lessonId: number): Promise<CourseProgress> => {
    const res = await api.post<CourseProgress>(`/enrollments/${courseId}/lessons/${lessonId}/complete`);
    return res.data;
  },

  getProgress: async (courseId: number): Promise<CourseProgress> => {
    const res = await api.get<CourseProgress>(`/enrollments/${courseId}/progress`);
    return res.data;
  },
};
