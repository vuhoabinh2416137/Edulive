import React, { useState } from 'react';
import { discussionService } from '../../services/discussionService';
import { Lesson } from '../../types/course';
import { X, Send, Loader2, HelpCircle } from 'lucide-react';

interface Props {
  courseId: number;
  lessons?: Lesson[];
  currentLessonId?: number | null;
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export const CreateDiscussionModal: React.FC<Props> = ({
  courseId,
  lessons = [],
  currentLessonId,
  isOpen,
  onClose,
  onCreated
}) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [lessonId, setLessonId] = useState<number | ''>(currentLessonId || '');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim() || submitting) return;

    try {
      setSubmitting(true);
      await discussionService.createDiscussion(courseId, {
        title: title.trim(),
        content: content.trim(),
        lessonId: lessonId ? Number(lessonId) : null
      });
      setTitle('');
      setContent('');
      onCreated();
      onClose();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Không thể tạo chủ đề thảo luận.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="max-w-lg w-full bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-5">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center space-x-2">
            <HelpCircle className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Đặt câu hỏi thảo luận mới
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Tiêu đề câu hỏi / Vấn đề cần trao đổi <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder="VD: Làm thế nào để cấu hình STOMP WebSocket trong Spring Boot?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          {lessons.length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Bài giảng liên quan (Tùy chọn)
              </label>
              <select
                value={lessonId}
                onChange={(e) => setLessonId(e.target.value ? Number(e.target.value) : '')}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">-- Toàn bộ khóa học --</option>
                {lessons.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Nội dung chi tiết câu hỏi <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={4}
              placeholder="Mô tả chi tiết câu hỏi, lỗi gặp phải hoặc ý tưởng muốn thảo luận cùng thầy và các bạn..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          <div className="flex items-center justify-end space-x-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium transition"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 text-sm rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-md shadow-indigo-600/20 transition flex items-center space-x-2"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Đăng thảo luận</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
