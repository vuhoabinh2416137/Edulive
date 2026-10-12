import { api } from './api';
import {
  Category,
  CourseDetail,
  CourseSummary,
  CreateCoursePayload,
  UpdateCoursePayload,
  Chapter,
  Lesson,
  CreateChapterPayload,
  CreateLessonPayload,
} from '../types/course';

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

export const courseService = {
  getCategories: async (): Promise<Category[]> => {
    const res = await api.get<Category[]>('/categories');
    return res.data;
  },

  getCourses: async (params?: {
    keyword?: string;
    categoryId?: number;
    page?: number;
    size?: number;
    sortBy?: string;
    direction?: string;
  }): Promise<PageResponse<CourseSummary>> => {
    const res = await api.get<PageResponse<CourseSummary>>('/courses', { params });
    return res.data;
  },

  getCourseDetail: async (id: number): Promise<CourseDetail> => {
    const res = await api.get<CourseDetail>(`/courses/${id}`);
    return res.data;
  },

  getCourseBySlug: async (slug: string): Promise<CourseDetail> => {
    const res = await api.get<CourseDetail>(`/courses/slug/${slug}`);
    return res.data;
  },

  createCourse: async (payload: CreateCoursePayload): Promise<CourseSummary> => {
    const res = await api.post<CourseSummary>('/courses', payload);
    return res.data;
  },

  updateCourse: async (id: number, payload: UpdateCoursePayload): Promise<CourseSummary> => {
    const res = await api.put<CourseSummary>(`/courses/${id}`, payload);
    return res.data;
  },

  deleteCourse: async (id: number): Promise<void> => {
    await api.delete(`/courses/${id}`);
  },

  createChapter: async (courseId: number, payload: CreateChapterPayload): Promise<Chapter> => {
    const res = await api.post<Chapter>(`/courses/${courseId}/chapters`, payload);
    return res.data;
  },

  updateChapter: async (chapterId: number, payload: CreateChapterPayload): Promise<Chapter> => {
    const res = await api.put<Chapter>(`/courses/chapters/${chapterId}`, payload);
    return res.data;
  },

  deleteChapter: async (chapterId: number): Promise<void> => {
    await api.delete(`/courses/chapters/${chapterId}`);
  },

  createLesson: async (chapterId: number, payload: CreateLessonPayload): Promise<Lesson> => {
    const res = await api.post<Lesson>(`/courses/chapters/${chapterId}/lessons`, payload);
    return res.data;
  },

  updateLesson: async (lessonId: number, payload: CreateLessonPayload): Promise<Lesson> => {
    const res = await api.put<Lesson>(`/courses/lessons/${lessonId}`, payload);
    return res.data;
  },

  deleteLesson: async (lessonId: number): Promise<void> => {
    await api.delete(`/courses/lessons/${lessonId}`);
  },

  getLesson: async (lessonId: number): Promise<Lesson> => {
    const res = await api.get<Lesson>(`/courses/lessons/${lessonId}`);
    return res.data;
  },
};
