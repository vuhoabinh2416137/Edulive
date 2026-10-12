export type QuestionType = 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'TRUE_FALSE';
export type QuizAttemptStatus = 'IN_PROGRESS' | 'SUBMITTED' | 'TIMED_OUT';

export interface QuizSummary {
  id: number;
  courseId: number;
  chapterId?: number | null;
  title: string;
  description?: string;
  timeLimitMinutes: number;
  maxAttempts: number;
  passingScore: number;
  questionCount: number;
  totalPoints: number;
  myAttemptsCount: number;
  myHighestScore?: number | null;
  myPassed: boolean;
  createdAt: string;
}

export interface OptionResponse {
  id: number;
  optionText: string;
  isCorrect?: boolean | null;
  orderIndex: number;
}

export interface QuestionResponse {
  id: number;
  questionText: string;
  questionType: QuestionType;
  explanation?: string | null;
  points: number;
  orderIndex: number;
  options: OptionResponse[];
}

export interface QuizDetail {
  id: number;
  courseId: number;
  courseTitle?: string;
  chapterId?: number | null;
  chapterTitle?: string | null;
  title: string;
  description?: string;
  timeLimitMinutes: number;
  maxAttempts: number;
  passingScore: number;
  questionCount: number;
  totalPoints: number;
  myAttemptsCount: number;
  myHighestScore?: number | null;
  myPassed: boolean;
  createdAt: string;
  questions?: QuestionResponse[];
}

export interface TakingOption {
  id: number;
  optionText: string;
  orderIndex: number;
}

export interface TakingQuestion {
  id: number;
  questionText: string;
  questionType: QuestionType;
  points: number;
  orderIndex: number;
  options: TakingOption[];
}

export interface StartQuizData {
  attemptId: number;
  quizId: number;
  title: string;
  description?: string;
  timeLimitMinutes: number;
  startedAt: string;
  expiresAt: string;
  questions: TakingQuestion[];
}

export interface SubmitAnswer {
  questionId: number;
  selectedOptionIds: number[];
}

export interface SubmitQuizPayload {
  answers: SubmitAnswer[];
}

export interface ReviewOption {
  id: number;
  optionText: string;
  isCorrect: boolean;
  isSelectedByUser: boolean;
  orderIndex: number;
}

export interface ReviewQuestion {
  questionId: number;
  questionText: string;
  questionType: QuestionType;
  points: number;
  earnedPoints: number;
  isCorrect: boolean;
  selectedOptionIds: number[];
  options: ReviewOption[];
  explanation?: string;
}

export interface QuizResult {
  attemptId: number;
  quizId: number;
  quizTitle: string;
  score: number;
  passingScore: number;
  isPassed: boolean;
  status: QuizAttemptStatus;
  totalPoints: number;
  earnedPoints: number;
  totalQuestions: number;
  correctQuestionsCount: number;
  startedAt: string;
  submittedAt: string;
  durationSeconds: number;
  reviewQuestions: ReviewQuestion[];
}

export interface QuizAttemptItem {
  attemptId: number;
  userId: number;
  userFullName: string;
  userEmail: string;
  score: number;
  isPassed: boolean;
  status: QuizAttemptStatus;
  startedAt: string;
  submittedAt: string;
  durationSeconds: number;
}

export interface QuizStatistics {
  quizId: number;
  quizTitle: string;
  totalAttempts: number;
  uniqueParticipants: number;
  averageScore: number;
  highestScore: number;
  lowestScore: number;
  passCount: number;
  passRatePercent: number;
  attempts: QuizAttemptItem[];
}
