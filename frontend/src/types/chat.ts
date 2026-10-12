export interface ChatMessage {
  id: number;
  courseId: number;
  userId: number;
  userFullName: string;
  userAvatarUrl?: string | null;
  userRole: 'ADMIN' | 'LECTURER' | 'STUDENT';
  content: string;
  createdAt: string;
}

export interface SendChatMessagePayload {
  content: string;
}
