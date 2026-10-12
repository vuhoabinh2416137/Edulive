export interface StudentDashboardData {
  enrolledCoursesCount: number;
  completedCoursesCount: number;
  inProgressCoursesCount: number;
  quizzesAttemptedCount: number;
  passedQuizzesCount: number;
  averageQuizScore: number;
  totalLessonsCompleted: number;
  recentCourses: {
    id: number;
    title: string;
    slug: string;
    thumbnailUrl?: string;
    progressPercent: number;
    lastAccessedAt: string;
  }[];
  recentQuizAttempts: {
    id: number;
    quizId: number;
    quizTitle: string;
    score: number;
    passed: boolean;
    submittedAt: string;
  }[];
}

export interface LecturerDashboardData {
  totalCoursesCount: number;
  totalStudentsEnrolled: number;
  totalQuizzesCount: number;
  totalQuizAttemptsCount: number;
  overallAverageQuizScore: number;
  topCourses: {
    id: number;
    title: string;
    slug: string;
    thumbnailUrl?: string;
    studentCount: number;
    lessonCount: number;
  }[];
  recentDiscussions: {
    id: number;
    courseId: number;
    courseTitle: string;
    title: string;
    authorName: string;
    createdAt: string;
    commentCount: number;
  }[];
}
