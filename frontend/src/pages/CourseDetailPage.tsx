import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { courseService } from '../services/courseService';
import { enrollmentService } from '../services/enrollmentService';
import { useAuth } from '../context/AuthContext';
import { CourseDetail } from '../types/course';
import { quizService } from '../services/quizService';
import { QuizSummary } from '../types/quiz';
import { QuizStatisticsModal } from '../components/quiz/QuizStatisticsModal';
import { DiscussionTab } from '../components/discussion/DiscussionTab';
import { GroupChatWidget } from '../components/chat/GroupChatWidget';
import { videoRoomService } from '../services/videoRoomService';
import { VideoRoom } from '../types/webrtc';
import { 
  BookOpen, 
  Users, 
  Copy, 
  Check, 
  CheckCircle2, 
  ChevronDown, 
  ChevronUp, 
  Play, 
  Video, 
  FileText, 
  FileCode, 
  FileQuestion, 
  ArrowRight, 
  Loader2, 
  Sparkles,
  PlusCircle,
  HelpCircle,
  BarChart3,
  Clock
} from 'lucide-react';

export const CourseDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [copied, setCopied] = useState(false);
  const [openChapters, setOpenChapters] = useState<Record<number, boolean>>({});

  // Quiz state
  const [quizzes, setQuizzes] = useState<QuizSummary[]>([]);
  const [selectedStatsQuizId, setSelectedStatsQuizId] = useState<number | null>(null);

  // Video Room state
  const [rooms, setRooms] = useState<VideoRoom[]>([]);
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [newRoomTitle, setNewRoomTitle] = useState('');
  const [creatingRoom, setCreatingRoom] = useState(false);

  // Add chapter/lesson modal state for lecturer
  const [showAddChapter, setShowAddChapter] = useState(false);
  const [chapterTitle, setChapterTitle] = useState('');
  const [addChapterLoading, setAddChapterLoading] = useState(false);

  const fetchCourse = () => {
    if (!slug) return;
    setLoading(true);
    // If slug is purely numbers, fetch by ID, otherwise by slug
    const promise = /^\d+$/.test(slug)
      ? courseService.getCourseDetail(Number(slug))
      : courseService.getCourseBySlug(slug);

    promise
      .then((data) => {
        setCourse(data);
        // Default expand first chapter
        if (data.chapters.length > 0) {
          setOpenChapters({ [data.chapters[0].id]: true });
        }
        // Fetch quizzes for this course
        quizService.getQuizzesByCourse(data.id)
          .then(setQuizzes)
          .catch((e) => console.error('Error fetching quizzes:', e));

        // Fetch video rooms for this course
        videoRoomService.getRoomsByCourse(data.id)
          .then(setRooms)
          .catch((e) => console.error('Error fetching video rooms:', e));
      })
      .catch((err) => {
        console.error('Error fetching course:', err);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchCourse();
  }, [slug]);

  const toggleChapter = (chapterId: number) => {
    setOpenChapters((prev) => ({
      ...prev,
      [chapterId]: !prev[chapterId],
    }));
  };

  const handleCopyCode = () => {
    if (!course) return;
    navigator.clipboard.writeText(course.classCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleEnroll = async () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { message: 'Vui lòng đăng nhập để tham gia khóa học' } });
      return;
    }
    if (!course) return;

    setEnrolling(true);
    try {
      await enrollmentService.joinCourse({ courseId: course.id });
      fetchCourse();
      navigate(`/courses/${course.id}/learn`);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Không thể đăng ký khóa học');
    } finally {
      setEnrolling(false);
    }
  };

  const handleCreateChapter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!course || !chapterTitle.trim()) return;
    setAddChapterLoading(true);
    try {
      await courseService.createChapter(course.id, { title: chapterTitle.trim() });
      setChapterTitle('');
      setShowAddChapter(false);
      fetchCourse();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Không thể tạo chương học');
    } finally {
      setAddChapterLoading(false);
    }
  };

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!course || !newRoomTitle.trim()) return;
    setCreatingRoom(true);
    try {
      const room = await videoRoomService.createRoom(course.id, newRoomTitle.trim());
      setNewRoomTitle('');
      setShowCreateRoom(false);
      navigate(`/rooms/${room.roomCode}`);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Không thể tạo phòng học');
    } finally {
      setCreatingRoom(false);
    }
  };

  const getLessonIcon = (type: string) => {
    switch (type) {
      case 'VIDEO':
        return <Video className="w-4 h-4 text-rose-500" />;
      case 'ARTICLE':
        return <FileText className="w-4 h-4 text-blue-500" />;
      case 'PDF':
        return <FileCode className="w-4 h-4 text-emerald-500" />;
      case 'QUIZ':
        return <FileQuestion className="w-4 h-4 text-amber-500" />;
      default:
        return <BookOpen className="w-4 h-4 text-indigo-500" />;
    }
  };

  const formatDuration = (seconds: number) => {
    if (!seconds) return '';
    const mins = Math.floor(seconds / 60);
    return `${mins} phút`;
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
        <p className="text-xs text-slate-500 font-medium">Đang tải thông tin khóa học...</p>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="max-w-xl mx-auto py-20 text-center px-4">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Không tìm thấy khóa học</h2>
        <p className="text-sm text-slate-500 mb-6">Khóa học có thể đã bị xóa hoặc đường dẫn không hợp lệ.</p>
        <Link
          to="/courses"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-semibold shadow-sm"
        >
          Quay lại thư viện khóa học
        </Link>
      </div>
    );
  }

  const isOwner = user && (user.id === course.lecturer.id || user.role === 'ADMIN');
  const canAccess = Boolean(isOwner || course?.isEnrolled);

  return (
    <div className="space-y-12 pb-16">
      {/* Course Banner */}
      <section className="bg-gradient-to-b from-indigo-50/50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-950 dark:to-slate-950 border-b border-slate-200 dark:border-slate-800 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
            {/* Left Content */}
            <div className="lg:col-span-2 space-y-5">
              <div className="flex flex-wrap items-center gap-2">
                {course.category && (
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                    {course.category.name}
                  </span>
                )}
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                  <span>Mã lớp: {course.classCode}</span>
                  <button
                    onClick={handleCopyCode}
                    className="p-0.5 hover:text-amber-600 dark:hover:text-amber-200 transition-colors"
                    title="Sao chép mã lớp"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
                {course.title}
              </h1>

              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed max-w-3xl">
                {course.description || 'Chương trình giảng dạy được biên soạn chuyên sâu kết hợp lý thuyết và đồ án thực chiến.'}
              </p>

              {/* Meta row */}
              <div className="flex flex-wrap items-center gap-6 text-xs text-slate-500 dark:text-slate-400 pt-2">
                <div className="flex items-center gap-2">
                  <img
                    src={course.lecturer.avatarUrl || 'https://api.dicebear.com/7.x/avataaars/svg?seed=lecturer'}
                    alt={course.lecturer.fullName}
                    className="w-7 h-7 rounded-full border border-slate-200 dark:border-slate-700 object-cover"
                  />
                  <div>
                    <span className="block text-[10px] text-slate-400">Giảng viên</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{course.lecturer.fullName}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-indigo-500" />
                  <span>{course.totalLessons} bài giảng</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-slate-400" />
                  <span>{course.enrolledCount} học viên đã tham gia</span>
                </div>
              </div>
            </div>

            {/* Right Card */}
            <div className="lg:col-span-1">
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xl space-y-6">
                <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800">
                  <img
                    src={course.thumbnailUrl || 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&q=80'}
                    alt={course.title}
                    className="w-full h-full object-cover"
                  />
                </div>

                {course.isEnrolled ? (
                  <div className="space-y-4">
                    <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60">
                      <div className="flex items-center justify-between text-xs font-semibold mb-2">
                        <span className="text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          Đã đăng ký khóa học
                        </span>
                        <span className="text-emerald-700 dark:text-emerald-300 font-bold">{course.progressPercent}%</span>
                      </div>
                      <div className="w-full bg-emerald-200 dark:bg-emerald-900 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                          style={{ width: `${course.progressPercent}%` }}
                        />
                      </div>
                    </div>

                    <Link
                      to={`/courses/${course.id}/learn`}
                      className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-lg shadow-indigo-500/25 transition-all flex items-center justify-center gap-2"
                    >
                      <Play className="w-4 h-4 fill-current" />
                      Tiếp tục học ngay
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <button
                      onClick={handleEnroll}
                      disabled={enrolling}
                      className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold text-xs shadow-lg shadow-indigo-500/25 transition-all flex items-center justify-center gap-2"
                    >
                      {enrolling ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Đang tham gia...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          Đăng ký học ngay (Miễn phí)
                        </>
                      )}
                    </button>
                    <p className="text-[11px] text-center text-slate-500">
                      Truy cập toàn bộ bài giảng video và trắc nghiệm kiểm tra
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Curriculum Content */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Nội dung khóa học</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {course.chapters.length} chương • {course.totalLessons} bài học
            </p>
          </div>

          {isOwner && (
            <button
              onClick={() => setShowAddChapter(true)}
              className="px-3.5 py-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-xs font-semibold hover:bg-indigo-100 transition-colors flex items-center gap-1.5"
            >
              <PlusCircle className="w-4 h-4" />
              Thêm chương mới
            </button>
          )}
        </div>

        {/* Modal Add Chapter for Lecturer */}
        {showAddChapter && (
          <form
            onSubmit={handleCreateChapter}
            className="mb-6 p-4 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-950/30 space-y-3"
          >
            <h4 className="text-xs font-bold text-indigo-900 dark:text-indigo-200">Tạo chương học mới</h4>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="VD: Chương 3: Tối ưu hiệu năng và Đóng gói"
                value={chapterTitle}
                onChange={(e) => setChapterTitle(e.target.value)}
                className="flex-1 px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                autoFocus
                required
              />
              <button
                type="submit"
                disabled={addChapterLoading}
                className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 disabled:opacity-50"
              >
                {addChapterLoading ? 'Đang lưu...' : 'Lưu chương'}
              </button>
              <button
                type="button"
                onClick={() => setShowAddChapter(false)}
                className="px-3 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-200 dark:text-slate-400"
              >
                Hủy
              </button>
            </div>
          </form>
        )}

        {/* Chapters Accordion */}
        <div className="space-y-4">
          {course.chapters.map((chapter) => {
            const isOpen = openChapters[chapter.id];
            return (
              <div
                key={chapter.id}
                className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm"
              >
                {/* Chapter Header */}
                <button
                  onClick={() => toggleChapter(chapter.id)}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold text-xs flex items-center justify-center">
                      {chapter.orderIndex}
                    </span>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                        {chapter.title}
                      </h3>
                      <span className="text-[11px] text-slate-500">
                        {chapter.lessons.length} bài học
                      </span>
                    </div>
                  </div>
                  {isOpen ? (
                    <ChevronUp className="w-5 h-5 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-slate-400" />
                  )}
                </button>

                {/* Lessons List */}
                {isOpen && (
                  <div className="border-t border-slate-100 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800/60">
                    {chapter.lessons.length === 0 ? (
                      <div className="p-4 text-center text-xs text-slate-400">
                        Chưa có bài học nào trong chương này.
                      </div>
                    ) : (
                      chapter.lessons.map((lesson) => {
                        const canAccess = course.isEnrolled || isOwner;
                        const lessonUrl = canAccess
                          ? `/courses/${course.id}/learn/${lesson.id}`
                          : '#';

                        return (
                          <div
                            key={lesson.id}
                            className="px-6 py-3.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              {getLessonIcon(lesson.contentType)}
                              <div>
                                <Link
                                  to={lessonUrl}
                                  onClick={(e) => {
                                    if (!canAccess) {
                                      e.preventDefault();
                                      handleEnroll();
                                    }
                                  }}
                                  className="text-xs font-semibold text-slate-800 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                                >
                                  {lesson.title}
                                </Link>
                                <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-400">
                                  <span className="uppercase font-semibold tracking-wider">
                                    {lesson.contentType}
                                  </span>
                                  {lesson.durationSeconds > 0 && (
                                    <>
                                      <span>•</span>
                                      <span>{formatDuration(lesson.durationSeconds)}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              {lesson.isCompleted && (
                                <span className="text-emerald-500" title="Đã hoàn thành">
                                  <CheckCircle2 className="w-4 h-4" />
                                </span>
                              )}

                              {canAccess ? (
                                <Link
                                  to={`/courses/${course.id}/learn/${lesson.id}`}
                                  className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                                >
                                  Học <ArrowRight className="w-3 h-3" />
                                </Link>
                              ) : (
                                <span className="text-[11px] text-slate-400">Đăng ký để học</span>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Live Video Classrooms (WebRTC) Section */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 pt-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Video className="w-6 h-6 text-rose-500" />
              <span>Lớp học trực tuyến Video Call</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900 animate-pulse">
                WebRTC P2P
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Phòng học trực tiếp không giới hạn thời gian, chia sẻ màn hình và tương tác giọng nói
            </p>
          </div>

          {isOwner && (
            <button
              onClick={() => setShowCreateRoom(true)}
              className="px-3.5 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800 text-xs font-semibold hover:bg-rose-100 dark:hover:bg-rose-900/60 transition-colors flex items-center gap-1.5"
            >
              <PlusCircle className="w-4 h-4" />
              Tạo phòng học mới
            </button>
          )}
        </div>

        {/* Modal Create Video Room for Lecturer */}
        {showCreateRoom && (
          <form
            onSubmit={handleCreateRoom}
            className="mb-6 p-4 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/40 dark:bg-rose-950/20 space-y-3"
          >
            <h4 className="text-xs font-bold text-rose-900 dark:text-rose-200">
              Mở phòng học trực tuyến mới
            </h4>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="VD: Buổi thảo luận trực tiếp & Hỏi đáp tuần 1"
                value={newRoomTitle}
                onChange={(e) => setNewRoomTitle(e.target.value)}
                className="flex-1 px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                autoFocus
                required
              />
              <button
                type="submit"
                disabled={creatingRoom}
                className="px-4 py-2 rounded-lg bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700 disabled:opacity-50"
              >
                {creatingRoom ? 'Đang tạo...' : 'Vào phòng ngay'}
              </button>
              <button
                type="button"
                onClick={() => setShowCreateRoom(false)}
                className="px-3 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-200 dark:text-slate-400"
              >
                Hủy
              </button>
            </div>
          </form>
        )}

        {/* Rooms Grid */}
        {rooms.length === 0 ? (
          <div className="p-6 text-center rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <p className="text-xs text-slate-500">
              Chưa có phòng học trực tuyến nào đang diễn ra trong khóa học này.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {rooms.map((room) => (
              <div
                key={room.id}
                className="p-5 rounded-2xl border border-rose-200/60 dark:border-rose-900/40 bg-gradient-to-br from-white via-white to-rose-50/30 dark:from-slate-900 dark:via-slate-900 dark:to-rose-950/10 shadow-sm flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-[11px] font-bold text-rose-600 dark:text-rose-400">
                      <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
                      ĐANG DIỄN RA
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">Mã: {room.roomCode}</span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white line-clamp-1">
                    {room.title}
                  </h3>
                  <p className="text-xs text-slate-500">Giảng viên: {room.hostName}</p>
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 mt-4 flex items-center justify-between">
                  <span className="text-xs text-slate-400">
                    Bắt đầu lúc {new Date(room.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  {canAccess ? (
                    <Link
                      to={`/rooms/${room.roomCode}`}
                      className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-sm shadow-rose-600/20 transition flex items-center gap-1.5"
                    >
                      <Video className="w-3.5 h-3.5" />
                      <span>Tham gia phòng</span>
                    </Link>
                  ) : (
                    <span className="text-xs text-slate-400 italic">Cần đăng ký khóa học</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Quizzes Section */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 pt-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <HelpCircle className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
              <span>Bài kiểm tra trắc nghiệm & Đánh giá</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Hệ thống tự động chấm điểm và đánh giá năng lực học viên
            </p>
          </div>
        </div>

        {quizzes.length === 0 ? (
          <div className="p-8 text-center rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <p className="text-sm text-slate-500">Khóa học hiện chưa có bài trắc nghiệm nào.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {quizzes.map((quiz) => (
              <div
                key={quiz.id}
                className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex flex-col justify-between space-y-4 hover:border-indigo-300 dark:hover:border-indigo-800 transition"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
                      {quiz.questionCount} câu hỏi
                    </span>
                    <span className="text-xs text-slate-400 flex items-center gap-1 font-medium">
                      <Clock className="w-3.5 h-3.5" />
                      {quiz.timeLimitMinutes} phút
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 dark:text-white line-clamp-2">
                    {quiz.title}
                  </h3>

                  {quiz.description && (
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {quiz.description}
                    </p>
                  )}
                </div>

                {/* Score & Badges */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">
                      Điểm đạt: <strong>{quiz.passingScore}</strong>
                    </span>
                    {quiz.myHighestScore !== null && quiz.myHighestScore !== undefined ? (
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-400">Điểm cao nhất:</span>
                        <span className={`font-bold font-mono ${quiz.myPassed ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                          {quiz.myHighestScore}
                        </span>
                        {quiz.myPassed ? (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400">
                            ĐẠT
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-400">
                            CHƯA ĐẠT
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-slate-400">Chưa làm bài</span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-1">
                    {canAccess ? (
                      <Link
                        to={`/quizzes/${quiz.id}/take`}
                        className="flex-1 py-2 px-3 text-center rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition"
                      >
                        {quiz.myAttemptsCount > 0 ? 'Làm lại bài thi' : 'Bắt đầu làm bài'}
                      </Link>
                    ) : (
                      <span className="flex-1 py-2 px-3 text-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 text-xs font-medium">
                        Cần tham gia khóa học
                      </span>
                    )}

                    {isOwner && (
                      <button
                        onClick={() => setSelectedStatsQuizId(quiz.id)}
                        className="py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition"
                      >
                        <BarChart3 className="w-3.5 h-3.5 text-indigo-500" />
                        <span>Thống kê</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Discussions & Q&A Section */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 pt-6">
        <DiscussionTab
          courseId={course.id}
          lessons={course.chapters.flatMap((c) => c.lessons)}
          canParticipate={canAccess}
        />
      </section>

      {/* Real-time Group Chat Widget */}
      {canAccess && (
        <GroupChatWidget courseId={course.id} courseTitle={course.title} />
      )}

      {/* Lecturer Statistics Modal */}
      {selectedStatsQuizId && (
        <QuizStatisticsModal
          quizId={selectedStatsQuizId}
          isOpen={true}
          onClose={() => setSelectedStatsQuizId(null)}
        />
      )}
    </div>
  );
};
