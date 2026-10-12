import { api } from './api';
import { ChatMessage, SendChatMessagePayload } from '../types/chat';

export const chatService = {
  // Lấy 50 tin nhắn mới nhất trong nhóm chat
  async getRecentMessages(courseId: number): Promise<ChatMessage[]> {
    const response = await api.get<ChatMessage[]>(`/courses/${courseId}/chat-messages`);
    return response.data;
  },

  // Gửi tin nhắn qua REST API
  async sendMessage(courseId: number, data: SendChatMessagePayload): Promise<ChatMessage> {
    const response = await api.post<ChatMessage>(`/courses/${courseId}/chat-messages`, data);
    return response.data;
  }
};
