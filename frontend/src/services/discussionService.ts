import { api } from './api';
import {
  DiscussionSummary,
  DiscussionDetail,
  CommentItem,
  CreateDiscussionPayload,
  CreateCommentPayload
} from '../types/discussion';

export const discussionService = {
  // Lấy danh sách thảo luận (có thể lọc theo lessonId)
  async getDiscussions(courseId: number, lessonId?: number | null): Promise<DiscussionSummary[]> {
    const params = lessonId ? { lessonId } : {};
    const response = await api.get<DiscussionSummary[]>(`/courses/${courseId}/discussions`, { params });
    return response.data;
  },

  // Xem chi tiết thảo luận cùng cây bình luận
  async getDiscussionById(id: number): Promise<DiscussionDetail> {
    const response = await api.get<DiscussionDetail>(`/discussions/${id}`);
    return response.data;
  },

  // Tạo chủ đề thảo luận mới
  async createDiscussion(courseId: number, data: CreateDiscussionPayload): Promise<DiscussionDetail> {
    const response = await api.post<DiscussionDetail>(`/courses/${courseId}/discussions`, data);
    return response.data;
  },

  // Gửi bình luận hoặc trả lời bình luận (parentId)
  async addComment(discussionId: number, data: CreateCommentPayload): Promise<CommentItem> {
    const response = await api.post<CommentItem>(`/discussions/${discussionId}/comments`, data);
    return response.data;
  },

  // Ghim hoặc bỏ ghim chủ đề
  async togglePin(discussionId: number): Promise<void> {
    await api.put(`/discussions/${discussionId}/pin`);
  },

  // Đánh dấu câu trả lời đúng được chấp nhận
  async acceptAnswer(commentId: number): Promise<void> {
    await api.put(`/discussions/comments/${commentId}/accept`);
  },

  // Xóa thảo luận
  async deleteDiscussion(discussionId: number): Promise<void> {
    await api.delete(`/discussions/${discussionId}`);
  },

  // Xóa bình luận
  async deleteComment(commentId: number): Promise<void> {
    await api.delete(`/discussions/comments/${commentId}`);
  }
};
