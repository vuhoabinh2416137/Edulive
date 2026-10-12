import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { enrollmentService } from '../services/enrollmentService';
import { Enrollment } from '../types/course';
import { JoinClassModal } from '../components/course/JoinClassModal';
import { 
  BookOpen, 
  KeyRound, 
  CheckCircle2, 
  ArrowRight, 
  Loader2, 
  Sparkles,
  Play
} from 'lucide-react';

export const MyCoursesPage: React.FC = () => {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);

  const fetchMyCourses = () => {
    setLoading(true);
    enrollmentService.getMyCourses()
      .then(setEnrollments)
      .catch((err: any) => console.error('Error fetching my courses:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchMyCourses();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Khu vực Học tập của Tôi</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Khóa học của tôi
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Theo dõi tiến độ hoàn thành bài giảng và tiếp tục hành trình học tập.
          </p>
        </div>

        <button
          onClick={() => setIsJoinModalOpen(true)}
          className="px-4 py-2.5 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 text-xs font-semibold shadow-sm transition-all flex items-center gap-2 self-start sm:self-auto"
        >
          <KeyRound className="w-4 h-4 text-indigo-500" />
          Tham gia bằng mã lớp
        </button>
      </div>

      {/* Courses List */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
          <p className="text-xs text-slate-500 font-medium">Đang tải danh sách khóa học của bạn...</p>
        </div>
      ) : enrollments.length === 0 ? (
        <div className="py-16 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-4">
            <BookOpen className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Bạn chưa tham gia khóa học nào</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Hãy khám phá thư viện khóa học công khai hoặc nhập mã lớp để bắt đầu học ngay.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <button
              onClick={() => setIsJoinModalOpen(true)}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-50 transition-colors"
            >
              Nhập mã lớp
            </button>
            <Link
              to="/courses"
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition-colors"
            >
              Khám phá khóa học
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {enrollments.map((en) => {
            const isCompleted = en.progressPercent >= 100;
            return (
              <div
                key={en.id}
                className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col justify-between hover:shadow-lg transition-all"
              >
                <div>
                  <div className="relative aspect-video w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                    <img
                      src={en.courseThumbnail || 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&q=80'}
                      alt={en.courseTitle}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-3 right-3">
                      <span className="px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold bg-black/60 text-amber-300 backdrop-blur">
                        {en.classCode}
                      </span>
                    </div>
                  </div>

                  <div className="p-5 space-y-4">
                    <div>
                      <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">
                        {en.categoryName || 'Khóa học chuyên đề'}
                      </span>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white line-clamp-2 mt-1">
                        {en.courseTitle}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1">
                        Giảng viên: <span className="font-medium text-slate-700 dark:text-slate-300">{en.lecturerName}</span>
                      </p>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1.5 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span className="text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                          {isCompleted ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          ) : (
                            <BookOpen className="w-4 h-4 text-indigo-500" />
                          )}
                          Tiến độ học tập
                        </span>
                        <span className={isCompleted ? 'text-emerald-600 font-bold' : 'text-indigo-600 font-bold'}>
                          {en.progressPercent}%
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-500 ${
                            isCompleted ? 'bg-emerald-500' : 'bg-gradient-to-r from-indigo-500 to-violet-500'
                          }`}
                          style={{ width: `${en.progressPercent}%` }}
                        />
                      </div>
                      <p className="text-[11px] text-slate-500 text-right">
                        Đã hoàn thành {en.completedLessons}/{en.totalLessons} bài học
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-5 pt-0">
                  <Link
                    to={`/courses/${en.courseId}/learn`}
                    className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-md shadow-indigo-500/20 flex items-center justify-center gap-2 transition-all"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    {isCompleted ? 'Ôn tập lại khóa học' : 'Tiếp tục bài học'}
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Join Modal */}
      <JoinClassModal
        isOpen={isJoinModalOpen}
        onClose={() => setIsJoinModalOpen(false)}
        onSuccess={fetchMyCourses}
      />
    </div>
  );
};
