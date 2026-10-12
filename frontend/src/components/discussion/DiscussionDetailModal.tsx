import React, { useState, useEffect } from 'react';
import { discussionService } from '../../services/discussionService';
import { DiscussionDetail, CommentItem } from '../../types/discussion';
import { useAuth } from '../../context/AuthContext';
import { 
  X, 
  MessageSquare, 
  CornerDownRight, 
  Pin, 
  CheckCircle, 
  Send, 
  Trash2, 
  Loader2
} from 'lucide-react';

interface Props {
  discussionId: number;
  isOpen: boolean;
  onClose: () => void;
  onDiscussionUpdated?: () => void;
}

export const DiscussionDetailModal: React.FC<Props> = ({ 
  discussionId, 
  isOpen, 
  onClose,
  onDiscussionUpdated 
}) => {
  const { user } = useAuth();
  const [detail, setDetail] = useState<DiscussionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Trạng thái nhập bình luận
  const [replyToCommentId, setReplyToCommentId] = useState<number | null>(null);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchDetail = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await discussionService.getDiscussionById(discussionId);
      setDetail(data);
    } catch (err: any) {
      console.error('Failed to load discussion:', err);
      setError(err.response?.data?.message || 'Không thể tải chi tiết cuộc thảo luận.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchDetail();
      setReplyToCommentId(null);
      setCommentText('');
    }
  }, [discussionId, isOpen]);

  const handleSendComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || submitting) return;

    try {
      setSubmitting(true);
      await discussionService.addComment(discussionId, {
        content: commentText.trim(),
        parentId: replyToCommentId
      });
      setCommentText('');
      setReplyToCommentId(null);
      await fetchDetail();
      if (onDiscussionUpdated) onDiscussionUpdated();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Không thể gửi bình luận.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleTogglePin = async () => {
    if (!detail) return;
    try {
      await discussionService.togglePin(detail.id);
      await fetchDetail();
      if (onDiscussionUpdated) onDiscussionUpdated();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Không thể ghim thảo luận.');
    }
  };

  const handleAcceptAnswer = async (commentId: number) => {
    try {
      await discussionService.acceptAnswer(commentId);
      await fetchDetail();
      if (onDiscussionUpdated) onDiscussionUpdated();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Không thể đánh dấu câu trả lời.');
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    if (!window.confirm('Bạn có chắc muốn xóa bình luận này?')) return;
    try {
      await discussionService.deleteComment(commentId);
      await fetchDetail();
      if (onDiscussionUpdated) onDiscussionUpdated();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Không thể xóa bình luận.');
    }
  };

  if (!isOpen) return null;

  const isTeacherOrAdmin = user && (user.role === 'LECTURER' || user.role === 'ADMIN');
  const isAuthor = user && detail && user.id === detail.author.id;

  // Render đệ quy cho cây bình luận lồng nhau
  const renderComment = (comment: CommentItem, level = 0) => {
    const isCommentAuthor = user && user.id === comment.author.id;
    const canAccept = (isAuthor || isTeacherOrAdmin);

    return (
      <div key={comment.id} className={`space-y-3 ${level > 0 ? 'ml-6 pl-4 border-l-2 border-indigo-100 dark:border-indigo-950/80 mt-3' : 'mt-4'}`}>
        <div className={`p-4 rounded-2xl border transition-colors ${
          comment.isAcceptedAnswer
            ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800'
            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
        }`}>
          {/* Header comment */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2.5">
              <img
                src={comment.author.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.author.id}`}
                alt={comment.author.fullName}
                className="w-7 h-7 rounded-full bg-slate-100 object-cover"
              />
              <div>
                <span className="text-xs font-bold text-slate-900 dark:text-white mr-1.5">
                  {comment.author.fullName}
                </span>
                {comment.author.role === 'LECTURER' && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                    Giảng viên
                  </span>
                )}
                <span className="text-[11px] text-slate-400 ml-2">
                  {new Date(comment.createdAt).toLocaleString('vi-VN')}
                </span>
              </div>
            </div>

            {/* Badges / Actions */}
            <div className="flex items-center space-x-2">
              {comment.isAcceptedAnswer && (
                <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                  <CheckCircle className="w-3.5 h-3.5" />
                  <span>Câu trả lời chuẩn</span>
                </span>
              )}

              {canAccept && (
                <button
                  onClick={() => handleAcceptAnswer(comment.id)}
                  title={comment.isAcceptedAnswer ? 'Bỏ chọn câu trả lời đúng' : 'Đánh dấu câu trả lời đúng'}
                  className={`text-xs p-1.5 rounded-lg border transition ${
                    comment.isAcceptedAnswer
                      ? 'border-emerald-500 text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60'
                      : 'border-slate-200 dark:border-slate-700 text-slate-400 hover:text-emerald-600 hover:border-emerald-400'
                  }`}
                >
                  <CheckCircle className="w-4 h-4" />
                </button>
              )}

              {(isCommentAuthor || isTeacherOrAdmin) && (
                <button
                  onClick={() => handleDeleteComment(comment.id)}
                  title="Xóa bình luận"
                  className="p-1.5 text-slate-400 hover:text-rose-500 transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Comment Content */}
          <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
            {comment.content}
          </p>

          {/* Reply Action */}
          <div className="mt-3 flex items-center space-x-3 text-xs">
            <button
              onClick={() => {
                setReplyToCommentId(comment.id);
              }}
              className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center space-x-1"
            >
              <CornerDownRight className="w-3 h-3" />
              <span>Trả lời</span>
            </button>
          </div>
        </div>

        {/* Nested replies */}
        {comment.replies && comment.replies.map(r => renderComment(r, level + 1))}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="max-w-3xl w-full bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <MessageSquare className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white line-clamp-1">
              Thảo luận chi tiết
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading && (
            <div className="py-16 text-center">
              <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-2" />
              <p className="text-xs text-slate-400">Đang tải cuộc thảo luận...</p>
            </div>
          )}

          {error && (
            <div className="p-4 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 rounded-xl text-sm">
              {error}
            </div>
          )}

          {detail && !loading && (
            <>
              {/* Question Card */}
              <div className="bg-slate-50 dark:bg-slate-800/60 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <img
                      src={detail.author.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${detail.author.id}`}
                      alt={detail.author.fullName}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                        {detail.author.fullName}
                      </h4>
                      <p className="text-xs text-slate-400">
                        {new Date(detail.createdAt).toLocaleString('vi-VN')}
                        {detail.lessonTitle && (
                          <span className="ml-2 px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-medium">
                            {detail.lessonTitle}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  {isTeacherOrAdmin && (
                    <button
                      onClick={handleTogglePin}
                      className={`p-2 rounded-xl border text-xs font-semibold flex items-center space-x-1 transition ${
                        detail.isPinned
                          ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border-amber-300'
                          : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:text-amber-600'
                      }`}
                    >
                      <Pin className="w-3.5 h-3.5" />
                      <span>{detail.isPinned ? 'Đã ghim' : 'Ghim'}</span>
                    </button>
                  )}
                </div>

                <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-snug">
                  {detail.title}
                </h3>

                <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {detail.content}
                </p>
              </div>

              {/* Replies Section */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Phản hồi & Bình luận ({detail.comments.length})
                </h4>

                {detail.comments.length === 0 ? (
                  <p className="text-xs text-slate-400 py-6 text-center bg-white dark:bg-slate-900 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
                    Chưa có phản hồi nào. Hãy là người đầu tiên trả lời câu hỏi này!
                  </p>
                ) : (
                  <div className="space-y-4">
                    {detail.comments.map(c => renderComment(c, 0))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Input Bar */}
        {detail && (
          <form
            onSubmit={handleSendComment}
            className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 space-y-2"
          >
            {replyToCommentId && (
              <div className="flex items-center justify-between text-xs px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300">
                <span>Đang trả lời bình luận #{replyToCommentId}</span>
                <button
                  type="button"
                  onClick={() => setReplyToCommentId(null)}
                  className="font-bold hover:underline"
                >
                  Hủy
                </button>
              </div>
            )}

            <div className="flex items-center space-x-2">
              <input
                type="text"
                placeholder={replyToCommentId ? 'Nhập câu trả lời của bạn...' : 'Viết câu trả lời hoặc thảo luận...'}
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                className="flex-1 px-4 py-2.5 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
              <button
                type="submit"
                disabled={submitting || !commentText.trim()}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-medium text-sm transition shadow-sm flex items-center space-x-1.5"
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Gửi</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
