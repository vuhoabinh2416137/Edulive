import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  BookOpen, CheckCircle2, Award, ArrowRight,
  TrendingUp, Users, MessageSquare,
  Sparkles, ChevronRight, BarChart3, AlertCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { dashboardService } from '../services/dashboardService';
import { StudentDashboardData, LecturerDashboardData } from '../types/dashboard';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [studentData, setStudentData] = useState<StudentDashboardData | null>(null);
  const [lecturerData, setLecturerData] = useState<LecturerDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isLecturer = user?.role === 'LECTURER' || user?.role === 'ADMIN';

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        if (isLecturer) {
          const data = await dashboardService.getLecturerDashboard();
          setLecturerData(data);
        } else {
          const data = await dashboardService.getStudentDashboard();
          setStudentData(data);
        }
      } catch (err: any) {
        console.error('Lỗi tải dữ liệu dashboard:', err);
        setError('Không thể tải dữ liệu thống kê');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isLecturer]);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs text-slate-500 font-medium">Đang tải bảng thống kê phân tích...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="p-6 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 flex items-center space-x-3">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-900 via-indigo-800 to-violet-900 p-8 text-white shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/10 backdrop-blur-md border border-white/20 text-indigo-200">
                {isLecturer ? 'Bảng Điều Khiển Giảng Viên' : 'Bảng Tiến Độ Học Tập'}
              </span>
              <span className="flex items-center text-xs text-amber-300">
                <Sparkles size={14} className="mr-1" />
                EduLive Analytics
              </span>
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight">
              Xin chào, {user?.fullName}! 👋
            </h1>
            <p className="text-sm text-indigo-200 max-w-xl">
              {isLecturer
                ? 'Theo dõi số lượng học viên, hiệu suất làm bài và các câu hỏi thảo luận mới trong khóa học của bạn.'
                : 'Theo dõi tiến trình bài giảng, kết quả kiểm tra tự động và duy trì mục tiêu học tập mỗi ngày.'}
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <Link
              to="/courses"
              className="px-5 py-2.5 rounded-xl bg-white text-indigo-900 text-xs font-bold hover:bg-indigo-50 transition shadow-md"
            >
              {isLecturer ? 'Quản lý khóa học' : 'Khám phá khóa học mới'}
            </Link>
          </div>
        </div>

        {/* Background decorative circles */}
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none"></div>
      </div>

      {/* STUDENT DASHBOARD */}
      {!isLecturer && studentData && (
        <>
          {/* Key Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center space-x-4">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                <BookOpen size={28} />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Khóa học đăng ký</p>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                  {studentData.enrolledCoursesCount}
                </h3>
                <span className="text-[11px] text-emerald-600 font-medium">
                  {studentData.inProgressCoursesCount} đang học
                </span>
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center space-x-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <CheckCircle2 size={28} />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Khóa học hoàn thành</p>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                  {studentData.completedCoursesCount}
                </h3>
                <span className="text-[11px] text-slate-500">
                  {studentData.totalLessonsCompleted} bài học đã học
                </span>
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center space-x-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <Award size={28} />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Bài kiểm tra đã nộp</p>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                  {studentData.quizzesAttemptedCount}
                </h3>
                <span className="text-[11px] text-emerald-600 font-medium">
                  {studentData.passedQuizzesCount} bài đạt chuẩn
                </span>
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center space-x-4">
              <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <TrendingUp size={28} />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Điểm trung bình</p>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1 font-mono">
                  {studentData.averageQuizScore} <span className="text-xs text-slate-400">/ 10</span>
                </h3>
                <span className="text-[11px] text-indigo-600 font-medium">Tự động chấm điểm</span>
              </div>
            </div>
          </div>

          {/* Recent Courses Progress */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                  <BookOpen size={18} className="text-indigo-600" />
                  <span>Tiếp tục học các khóa học</span>
                </h2>
                <Link to="/my-courses" className="text-xs text-indigo-600 font-semibold hover:underline flex items-center">
                  <span>Tất cả</span>
                  <ChevronRight size={14} />
                </Link>
              </div>

              {studentData.recentCourses.length === 0 ? (
                <div className="p-8 text-center rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-400 text-xs">
                  Bạn chưa đăng ký khóa học nào. Hãy khám phá danh mục khóa học nhé!
                </div>
              ) : (
                <div className="space-y-3">
                  {studentData.recentCourses.map(course => (
                    <div
                      key={course.id}
                      className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-400 transition shadow-sm flex items-center justify-between gap-4"
                    >
                      <div className="flex items-center space-x-3 min-w-0">
                        {course.thumbnailUrl ? (
                          <img
                            src={course.thumbnailUrl}
                            alt={course.title}
                            className="w-16 h-12 rounded-xl object-cover shrink-0"
                          />
                        ) : (
                          <div className="w-16 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                            <BookOpen size={20} className="text-slate-400" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            {course.title}
                          </h4>
                          <div className="flex items-center space-x-2 mt-1.5">
                            <div className="w-32 bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                              <div
                                className="bg-indigo-600 h-2 rounded-full transition-all"
                                style={{ width: `${course.progressPercent}%` }}
                              ></div>
                            </div>
                            <span className="text-[11px] font-mono font-bold text-indigo-600">
                              {course.progressPercent}%
                            </span>
                          </div>
                        </div>
                      </div>

                      <Link
                        to={`/courses/${course.id}/learn`}
                        className="px-3.5 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 text-xs font-bold hover:bg-indigo-100 transition shrink-0 flex items-center space-x-1"
                      >
                        <span>Học tiếp</span>
                        <ArrowRight size={12} />
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Quiz Attempts */}
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                <Award size={18} className="text-amber-500" />
                <span>Kết quả bài thi gần đây</span>
              </h2>

              {studentData.recentQuizAttempts.length === 0 ? (
                <div className="p-8 text-center rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-400 text-xs">
                  Chưa có lượt nộp bài trắc nghiệm nào.
                </div>
              ) : (
                <div className="space-y-3">
                  {studentData.recentQuizAttempts.map(attempt => (
                    <div
                      key={attempt.id}
                      className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between"
                    >
                      <div className="min-w-0 pr-2">
                        <h4 className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                          {attempt.quizTitle}
                        </h4>
                        <span className="text-[10px] text-slate-400">
                          {new Date(attempt.submittedAt).toLocaleDateString('vi-VN')}
                        </span>
                      </div>

                      <div className="flex items-center space-x-2 shrink-0">
                        <span className="text-sm font-bold font-mono text-slate-900 dark:text-white">
                          {attempt.score}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          attempt.passed
                            ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400'
                            : 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-400'
                        }`}>
                          {attempt.passed ? 'ĐẠT' : 'CHƯA ĐẠT'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* LECTURER DASHBOARD */}
      {isLecturer && lecturerData && (
        <>
          {/* Key Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <p className="text-xs font-medium text-slate-500">Khóa học quản lý</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                {lecturerData.totalCoursesCount}
              </h3>
            </div>

            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <p className="text-xs font-medium text-slate-500">Học viên tham gia</p>
              <h3 className="text-2xl font-bold text-indigo-600 mt-1">
                {lecturerData.totalStudentsEnrolled}
              </h3>
            </div>

            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <p className="text-xs font-medium text-slate-500">Bộ đề trắc nghiệm</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                {lecturerData.totalQuizzesCount}
              </h3>
            </div>

            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <p className="text-xs font-medium text-slate-500">Lượt nộp bài thi</p>
              <h3 className="text-2xl font-bold text-emerald-600 mt-1">
                {lecturerData.totalQuizAttemptsCount}
              </h3>
            </div>

            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
              <p className="text-xs font-medium text-slate-500">Điểm TB học viên</p>
              <h3 className="text-2xl font-bold text-amber-500 mt-1 font-mono">
                {lecturerData.overallAverageQuizScore} <span className="text-xs text-slate-400">/ 10</span>
              </h3>
            </div>
          </div>

          {/* Top Courses & Recent Discussions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Top Courses */}
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                <BarChart3 size={18} className="text-indigo-600" />
                <span>Khóa học đông học viên nhất</span>
              </h2>

              <div className="space-y-3">
                {lecturerData.topCourses.map((c, idx) => (
                  <div
                    key={c.id}
                    className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between"
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      <span className="w-6 h-6 rounded-lg bg-indigo-50 dark:bg-indigo-950 font-bold text-xs text-indigo-600 flex items-center justify-center shrink-0">
                        #{idx + 1}
                      </span>
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {c.title}
                        </h4>
                        <span className="text-[11px] text-slate-500">
                          {c.lessonCount} bài học
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-1.5 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300">
                      <Users size={14} className="text-indigo-500" />
                      <span>{c.studentCount} học viên</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Discussions needing reply */}
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center space-x-2">
                <MessageSquare size={18} className="text-emerald-500" />
                <span>Thảo luận & Hỏi đáp mới từ học viên</span>
              </h2>

              {lecturerData.recentDiscussions.length === 0 ? (
                <div className="p-8 text-center rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-400 text-xs">
                  Hiện chưa có thắc mắc thảo luận nào.
                </div>
              ) : (
                <div className="space-y-3">
                  {lecturerData.recentDiscussions.map(d => (
                    <div
                      key={d.id}
                      className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between"
                    >
                      <div className="min-w-0 pr-3">
                        <span className="text-[10px] text-indigo-600 font-semibold block truncate">
                          {d.courseTitle}
                        </span>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate mt-0.5">
                          {d.title}
                        </h4>
                        <span className="text-[10px] text-slate-400">
                          Bởi {d.authorName} • {new Date(d.createdAt).toLocaleDateString('vi-VN')}
                        </span>
                      </div>

                      <div className="flex items-center space-x-1 text-slate-500 text-xs shrink-0">
                        <MessageSquare size={14} />
                        <span>{d.commentCount}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
