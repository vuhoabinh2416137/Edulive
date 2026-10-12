export interface DiscussionAuthor {
  id: number;
  fullName: string;
  email: string;
  avatarUrl?: string | null;
  role: 'ADMIN' | 'LECTURER' | 'STUDENT';
}

export interface CommentItem {
  id: number;
  discussionId: number;
  parentId?: number | null;
  content: string;
  isAcceptedAnswer: boolean;
  createdAt: string;
  author: DiscussionAuthor;
  replies?: CommentItem[];
}

export interface DiscussionSummary {
  id: number;
  courseId: number;
  lessonId?: number | null;
  lessonTitle?: string | null;
  title: string;
  content: string;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
  author: DiscussionAuthor;
  commentCount: number;
  hasAcceptedAnswer: boolean;
}

export interface DiscussionDetail {
  id: number;
  courseId: number;
  lessonId?: number | null;
  lessonTitle?: string | null;
  title: string;
  content: string;
  isPinned: boolean;
  createdAt: string;
  updatedAt: string;
  author: DiscussionAuthor;
  comments: CommentItem[];
}

export interface CreateDiscussionPayload {
  lessonId?: number | null;
  title: string;
  content: string;
}

export interface CreateCommentPayload {
  parentId?: number | null;
  content: string;
}
