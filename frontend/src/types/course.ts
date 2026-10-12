export type CourseStatus = 'PUBLISHED' | 'DRAFT' | 'ARCHIVED';

export type LessonType = 'VIDEO' | 'ARTICLE' | 'PDF' | 'QUIZ';

export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  courseCount?: number;
}

export interface Lesson {
  id: number;
  chapterId: number;
  title: string;
  contentType: LessonType;
  contentUrl?: string;
  durationSeconds: number;
  orderIndex: number;
  isCompleted?: boolean;
}

export interface Chapter {
  id: number;
  courseId: number;
  title: string;
  orderIndex: number;
  lessons: Lesson[];
}

export interface CourseSummary {
  id: number;
  title: string;
  slug: string;
  description?: string;
  thumbnailUrl?: string;
  categoryId?: number;
  categoryName?: string;
  lecturerId: number;
  lecturerName: string;
  lecturerAvatar?: string;
  classCode: string;
  status: CourseStatus;
  totalLessons: number;
  totalDurationSeconds: number;
  enrolledCount: number;
  isEnrolled?: boolean;
  createdAt: string;
}

export interface CourseDetail {
  id: number;
  title: string;
  slug: string;
  description?: string;
  thumbnailUrl?: string;
  category?: Category;
  lecturer: {
    id: number;
    email: string;
    fullName: string;
    avatarUrl?: string;
    role: string;
  };
  classCode: string;
  status: CourseStatus;
  totalLessons: number;
  totalDurationSeconds: number;
  enrolledCount: number;
  isEnrolled: boolean;
  progressPercent: number;
  chapters: Chapter[];
  createdAt: string;
  updatedAt: string;
}

export interface Enrollment {
  id: number;
  courseId: number;
  courseTitle: string;
  courseSlug: string;
  courseThumbnail?: string;
  categoryName?: string;
  lecturerName: string;
  classCode: string;
  progressPercent: number;
  totalLessons: number;
  completedLessons: number;
  enrolledAt: string;
  completedAt?: string;
}

export interface CourseProgress {
  courseId: number;
  enrollmentId: number;
  progressPercent: number;
  totalLessons: number;
  completedLessons: number;
  completedLessonIds: number[];
}

export interface CreateCoursePayload {
  title: string;
  description?: string;
  thumbnailUrl?: string;
  categoryId: number;
  status?: CourseStatus;
}

export interface UpdateCoursePayload {
  title: string;
  description?: string;
  thumbnailUrl?: string;
  categoryId: number;
  status?: CourseStatus;
}

export interface CreateChapterPayload {
  title: string;
  orderIndex?: number;
}

export interface CreateLessonPayload {
  title: string;
  contentType: LessonType;
  contentUrl?: string;
  durationSeconds?: number;
  orderIndex?: number;
}
