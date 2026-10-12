import React, { useState, useEffect } from 'react';
import { discussionService } from '../../services/discussionService';
import { DiscussionSummary } from '../../types/discussion';
import { Lesson } from '../../types/course';
import { DiscussionDetailModal } from './DiscussionDetailModal';
import { CreateDiscussionModal } from './CreateDiscussionModal';
import { 
  MessageSquare, 
  PlusCircle, 
  Pin, 
  CheckCircle, 
  MessageCircle, 
  Loader2,
  Filter
} from 'lucide-react';

interface Props {
  courseId: number;
  lessons?: Lesson[];
  currentLessonId?: number | null;
  canParticipate?: boolean;
}

export const DiscussionTab: React.FC<Props> = ({
  courseId,
  lessons = [],
  currentLessonId = null,
  canParticipate = true
}) => {
  const [discussions, setDiscussions] = useState<DiscussionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterByCurrentLesson, setFilterByCurrentLesson] = useState(false);

  // Modals state
  const [selectedDiscussionId, setSelectedDiscussionId] = useState<number | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const fetchDiscussions = async () => {
    try {
      setLoading(true);
      const lessonFilter = (filterByCurrentLesson && currentLessonId) ? currentLessonId : null;
      const data = await discussionService.getDiscussions(courseId, lessonFilter);
      setDiscussions(data);
    } catch (err) {
      console.error('Failed to load discussions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDiscussions();
  }, [courseId, currentLessonId, filterByCurrentLesson]);

  return (
    <div className="space-y-6">
      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Hỏi đáp & Thảo luận ({discussions.length})
            </h3>
            <p className="text-xs text-slate-400">
              Trao đổi kiến thức cùng giảng viên và học viên trong khóa
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {currentLessonId && (
            <button
              onClick={() => setFilterByCurrentLesson(prev => !prev)}
              className={`px-3 py-2 rounded-xl text-xs font-semibold border flex items-center space-x-1.5 transition ${
                filterByCurrentLesson
                  ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border-indigo-300 dark:border-indigo-800'
                  : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              <span>Chỉ bài học này</span>
            </button>
          )}

          {canParticipate && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition flex items-center space-x-1.5"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Đặt câu hỏi</span>
            </button>
          )}
        </div>
      </div>

      {/* Discussion List */}
      {loading ? (
        <div className="py-16 text-center">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-2" />
          <p className="text-xs text-slate-400">Đang tải danh sách câu hỏi...</p>
        </div>
      ) : discussions.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 space-y-3">
          <div className="w-12 h-12 rounded-full bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto">
            <MessageSquare className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-slate-900 dark:text-white">
            Chưa có chủ đề thảo luận nào
          </h4>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Bạn có thắc mắc về bài học? Hãy bấm "Đặt câu hỏi" để trao đổi cùng thầy cô và bạn bè nhé!
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {discussions.map((d) => (
            <div
              key={d.id}
              onClick={() => setSelectedDiscussionId(d.id)}
              className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-indigo-300 dark:hover:border-indigo-800/80 shadow-sm hover:shadow transition cursor-pointer flex flex-col justify-between space-y-3 group"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center space-x-3">
                  <img
                    src={d.author.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${d.author.id}`}
                    alt={d.author.fullName}
                    className="w-9 h-9 rounded-full object-cover flex-shrink-0 bg-slate-100"
                  />
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        {d.author.fullName}
                      </span>
                      {d.author.role === 'LECTURER' && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                          Giảng viên
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-400">
                      {new Date(d.createdAt).toLocaleString('vi-VN')}
                    </span>
                  </div>
                </div>

                {/* Badges */}
                <div className="flex items-center space-x-2">
                  {d.isPinned && (
                    <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                      <Pin className="w-3 h-3" />
                      <span>Đã ghim</span>
                    </span>
                  )}
                  {d.hasAcceptedAnswer && (
                    <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                      <CheckCircle className="w-3 h-3" />
                      <span>Đã giải quyết</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Title & Preview */}
              <div>
                <h4 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1">
                  {d.title}
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                  {d.content}
                </p>
              </div>

              {/* Footer Meta */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/80 text-xs text-slate-400">
                <span>
                  {d.lessonTitle ? `Bài học: ${d.lessonTitle}` : 'Toàn khóa học'}
                </span>

                <div className="flex items-center space-x-1.5 font-medium text-slate-500 dark:text-slate-400">
                  <MessageCircle className="w-4 h-4" />
                  <span>{d.commentCount} câu trả lời</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal */}
      {selectedDiscussionId && (
        <DiscussionDetailModal
          discussionId={selectedDiscussionId}
          isOpen={true}
          onClose={() => setSelectedDiscussionId(null)}
          onDiscussionUpdated={fetchDiscussions}
        />
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <CreateDiscussionModal
          courseId={courseId}
          lessons={lessons}
          currentLessonId={currentLessonId}
          isOpen={true}
          onClose={() => setShowCreateModal(false)}
          onCreated={fetchDiscussions}
        />
      )}
    </div>
  );
};
