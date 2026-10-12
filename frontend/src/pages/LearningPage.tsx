import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { courseService } from '../services/courseService';
import { enrollmentService } from '../services/enrollmentService';
import { quizService } from '../services/quizService';
import { QuizSummary } from '../types/quiz';
import { CourseDetail, Lesson } from '../types/course';
import { DiscussionTab } from '../components/discussion/DiscussionTab';
import { GroupChatWidget } from '../components/chat/GroupChatWidget';
import { 
  ArrowLeft, 
  ChevronRight, 
  ChevronLeft, 
  CheckCircle2, 
  Circle, 
  Video, 
  FileText, 
  FileCode, 
  FileQuestion, 
  Play, 
  Loader2, 
  Check, 
  Download,
  Award,
  HelpCircle
} from 'lucide-react';

export const LearningPage: React.FC = () => {
  const { courseId, lessonId } = useParams<{ courseId: string; lessonId?: string }>();
  const navigate = useNavigate();

  const [course, setCourse] = useState<CourseDetail | null>(null);
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [completedLessonIds, setCompletedLessonIds] = useState<Set<number>>(new Set());
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [quizzes, setQuizzes] = useState<QuizSummary[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [completing, setCompleting] = useState<boolean>(false);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);

  // Flatten all lessons in order
  const allLessons: Lesson[] = course
    ? course.chapters.flatMap((ch) => ch.lessons)
    : [];

  const currentIndex = currentLesson
    ? allLessons.findIndex((l) => l.id === currentLesson.id)
    : -1;

  const prevLesson = currentIndex > 0 ? allLessons[currentIndex - 1] : null;
  const nextLesson = currentIndex >= 0 && currentIndex < allLessons.length - 1 ? allLessons[currentIndex + 1] : null;

  useEffect(() => {
    if (!courseId) return;
    setLoading(true);

    Promise.all([
      courseService.getCourseDetail(Number(courseId)),
      enrollmentService.getProgress(Number(courseId)).catch(() => null),
      quizService.getQuizzesByCourse(Number(courseId)).catch(() => []),
    ])
      .then(([courseData, progData, quizData]) => {
        setCourse(courseData);
        if (quizData) setQuizzes(quizData);

        if (progData) {
          setCompletedLessonIds(new Set(progData.completedLessonIds.map(Number)));
          setProgressPercent(Number(progData.progressPercent));
        } else {
          setProgressPercent(Number(courseData.progressPercent || 0));
        }

        const flat = courseData.chapters.flatMap((c) => c.lessons);
        if (flat.length > 0) {
          if (lessonId) {
            const target = flat.find((l) => l.id === Number(lessonId));
            setCurrentLesson(target || flat[0]);
          } else {
            // Find first uncompleted or first lesson
            const firstUncompleted = flat.find((l) => !progData?.completedLessonIds.includes(l.id));
            setCurrentLesson(firstUncompleted || flat[0]);
          }
        }
      })
      .catch((err) => {
        console.error('Error loading learning page:', err);
      })
      .finally(() => setLoading(false));
  }, [courseId]);

  // Update current lesson if lessonId in URL changes
  useEffect(() => {
    if (course && lessonId) {
      const flat = course.chapters.flatMap((c) => c.lessons);
      const target = flat.find((l) => l.id === Number(lessonId));
      if (target) {
        setCurrentLesson(target);
      }
    }
  }, [lessonId, course]);

  const selectLesson = (lesson: Lesson) => {
    setCurrentLesson(lesson);
    navigate(`/courses/${courseId}/learn/${lesson.id}`, { replace: true });
  };

  const handleCompleteCurrentLesson = async () => {
    if (!course || !currentLesson) return;
    setCompleting(true);

    try {
      const prog = await enrollmentService.completeLesson(course.id, currentLesson.id);
      setCompletedLessonIds(new Set(prog.completedLessonIds.map(Number)));
      setProgressPercent(Number(prog.progressPercent));

      // Auto advance to next lesson if available
      if (nextLesson) {
        selectLesson(nextLesson);
      }
    } catch (err: any) {
      console.error('Error completing lesson:', err);
    } finally {
      setCompleting(false);
    }
  };

  const getYouTubeEmbedUrl = (url?: string) => {
    if (!url) return null;
    try {
      if (url.includes('youtube.com/watch')) {
        const urlParams = new URLSearchParams(new URL(url).search);
        const v = urlParams.get('v');
        return v ? `https://www.youtube.com/embed/${v}?autoplay=1&rel=0` : null;
      }
      if (url.includes('youtu.be/')) {
        const id = url.split('youtu.be/')[1]?.split('?')[0];
        return id ? `https://www.youtube.com/embed/${id}?autoplay=1&rel=0` : null;
      }
      if (url.includes('youtube.com/embed/')) {
        return url;
      }
    } catch {
      return null;
    }
    return null;
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
        return <Play className="w-4 h-4 text-indigo-500" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
        <p className="text-xs text-slate-500 font-medium">Đang mở phòng học trực tuyến...</p>
      </div>
    );
  }

  if (!course || allLessons.length === 0) {
    return (
      <div className="max-w-xl mx-auto py-20 text-center px-4">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Khóa học chưa có bài giảng</h2>
        <Link
          to={`/courses/${course?.slug || ''}`}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-semibold shadow-sm"
        >
          Quay lại trang thông tin khóa học
        </Link>
      </div>
    );
  }

  const isCurrentCompleted = currentLesson ? completedLessonIds.has(currentLesson.id) : false;
  const ytUrl = currentLesson?.contentType === 'VIDEO' ? getYouTubeEmbedUrl(currentLesson.contentUrl) : null;

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col bg-slate-950 text-slate-100">
      {/* Top Learning Navigation Bar */}
      <div className="h-14 border-b border-slate-800 bg-slate-900/90 backdrop-blur px-4 sm:px-6 flex items-center justify-between sticky top-16 z-30">
        <div className="flex items-center gap-4">
          <Link
            to={`/courses/${course.slug}`}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors flex items-center gap-1.5 text-xs font-semibold"
            title="Quay lại trang chi tiết khóa học"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Chi tiết khóa học</span>
          </Link>
          <span className="h-4 w-px bg-slate-800" />
          <h2 className="text-xs sm:text-sm font-bold text-white max-w-md truncate">
            {course.title}
          </h2>
        </div>

        {/* Progress Display */}
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-3">
            <span className="text-xs font-semibold text-slate-400">
              Tiến độ: <strong className="text-emerald-400">{progressPercent}%</strong>
            </span>
            <div className="w-28 bg-slate-800 h-2 rounded-full overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="text-[11px] text-slate-500">
              ({completedLessonIds.size}/{allLessons.length} bài)
            </span>
          </div>

          {progressPercent >= 100 && (
            <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold flex items-center gap-1">
              <Award className="w-3.5 h-3.5" />
              Đã hoàn thành
            </span>
          )}

          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300"
          >
            {sidebarOpen ? 'Ẩn mục lục' : 'Hiện mục lục'}
          </button>
        </div>
      </div>

      {/* Main Learning Workspace */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left: Player & Content Area */}
        <div className="flex-1 flex flex-col overflow-y-auto bg-slate-950 p-4 sm:p-6 lg:p-8 space-y-6">
          {/* Main Content Player Card */}
          <div className="max-w-4xl mx-auto w-full space-y-6">
            {currentLesson?.contentType === 'VIDEO' && (
              <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-black shadow-2xl border border-slate-800">
                {ytUrl ? (
                  <iframe
                    src={ytUrl}
                    title={currentLesson.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full border-0"
                  />
                ) : currentLesson.contentUrl ? (
                  <video
                    controls
                    src={currentLesson.contentUrl}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-slate-500">
                    <Video className="w-12 h-12 mb-2 opacity-50" />
                    <p className="text-xs">Đang cập nhật video bài giảng</p>
                  </div>
                )}
              </div>
            )}

            {currentLesson?.contentType === 'ARTICLE' && (
              <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-6">
                <div className="border-b border-slate-800 pb-4">
                  <span className="text-xs font-semibold text-indigo-400 uppercase tracking-wider">
                    Bài viết lý thuyết
                  </span>
                  <h1 className="text-2xl font-bold text-white mt-1">
                    {currentLesson.title}
                  </h1>
                </div>
                <div className="prose prose-invert max-w-none text-slate-300 leading-relaxed text-sm space-y-4">
                  {currentLesson.contentUrl ? (
                    currentLesson.contentUrl.split('\n').map((para, i) => (
                      <p key={i}>{para}</p>
                    ))
                  ) : (
                    <p>Nội dung bài viết đang được giảng viên hoàn thiện...</p>
                  )}
                </div>
              </div>
            )}

            {currentLesson?.contentType === 'PDF' && (
              <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-6 text-center">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-950/60 text-emerald-400 flex items-center justify-center border border-emerald-800">
                  <FileCode className="w-8 h-8" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white mb-2">{currentLesson.title}</h1>
                  <p className="text-xs text-slate-400">Tài liệu học tập định dạng PDF đính kèm</p>
                </div>
                {currentLesson.contentUrl && (
                  <a
                    href={currentLesson.contentUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors shadow-lg shadow-emerald-600/20"
                  >
                    <Download className="w-4 h-4" />
                    Tải về hoặc Mở tài liệu PDF
                  </a>
                )}
              </div>
            )}

            {/* Lesson Title & Completion Controls */}
            {currentLesson && (
              <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300 uppercase">
                      {currentLesson.contentType}
                    </span>
                    {isCurrentCompleted && (
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 flex items-center gap-1">
                        <Check className="w-3 h-3" /> Đã hoàn thành
                      </span>
                    )}
                  </div>
                  <h2 className="text-lg font-bold text-white">{currentLesson.title}</h2>
                </div>

                {/* Complete Button */}
                <button
                  onClick={handleCompleteCurrentLesson}
                  disabled={completing}
                  className={`px-5 py-3 rounded-xl font-semibold text-xs shadow-lg transition-all flex items-center justify-center gap-2 flex-shrink-0 ${
                    isCurrentCompleted
                      ? 'bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-slate-700'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/25'
                  }`}
                >
                  {completing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Đang cập nhật...
                    </>
                  ) : isCurrentCompleted ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      Đã hoàn thành (Chuyển tiếp)
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      Đánh dấu đã học xong
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Prev & Next Buttons */}
            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => prevLesson && selectLesson(prevLesson)}
                disabled={!prevLesson}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-slate-900 text-xs font-semibold text-slate-300 border border-slate-800 flex items-center gap-2 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                Bài trước
              </button>

              <button
                onClick={() => nextLesson && selectLesson(nextLesson)}
                disabled={!nextLesson}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-slate-900 text-xs font-semibold text-slate-300 border border-slate-800 flex items-center gap-2 transition-colors"
              >
                Bài tiếp theo
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Discussions Section */}
            <div className="pt-8 border-t border-slate-800">
              <DiscussionTab
                courseId={course.id}
                lessons={allLessons}
                currentLessonId={currentLesson?.id}
                canParticipate={true}
              />
            </div>
          </div>
        </div>

        {/* Floating Group Chat Widget */}
        <GroupChatWidget courseId={course.id} courseTitle={course.title} />

        {/* Right: Curriculum Sidebar */}
        {sidebarOpen && (
          <aside className="w-full lg:w-96 border-t lg:border-t-0 lg:border-l border-slate-800 bg-slate-900 flex flex-col h-auto lg:h-full overflow-y-auto">
            <div className="p-4 border-b border-slate-800 bg-slate-900 sticky top-0 z-10">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Mục lục khóa học
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {course.chapters.length} chương • {allLessons.length} bài học
              </p>
            </div>

            <div className="divide-y divide-slate-800/80">
              {course.chapters.map((chapter) => (
                <div key={chapter.id} className="p-3">
                  <div className="px-2 py-1.5 text-xs font-bold text-slate-300">
                    Chương {chapter.orderIndex}: {chapter.title}
                  </div>

                  <div className="space-y-1 mt-1">
                    {chapter.lessons.map((lesson) => {
                      const isActive = currentLesson?.id === lesson.id;
                      const isDone = completedLessonIds.has(lesson.id);

                      return (
                        <button
                          key={lesson.id}
                          onClick={() => selectLesson(lesson)}
                          className={`w-full text-left px-3 py-2.5 rounded-xl text-xs flex items-center justify-between gap-3 transition-all ${
                            isActive
                              ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/40 font-semibold'
                              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            {isDone ? (
                              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                            ) : (
                              <Circle className="w-4 h-4 text-slate-600 flex-shrink-0" />
                            )}
                            <div className="truncate">
                              <span className="block truncate">{lesson.title}</span>
                              <span className="text-[10px] text-slate-500 uppercase">
                                {lesson.contentType}
                              </span>
                            </div>
                          </div>

                          {getLessonIcon(lesson.contentType)}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}

              {/* Quizzes List in Sidebar */}
              {quizzes.length > 0 && (
                <div className="p-3 border-t border-slate-800">
                  <div className="px-2 py-1.5 text-xs font-bold text-amber-400 flex items-center gap-1.5">
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>Bài kiểm tra trắc nghiệm</span>
                  </div>

                  <div className="space-y-1.5 mt-1">
                    {quizzes.map((quiz) => (
                      <Link
                        key={quiz.id}
                        to={`/quizzes/${quiz.id}/take`}
                        className="w-full text-left px-3 py-2.5 rounded-xl text-xs flex items-center justify-between gap-2 text-slate-300 hover:text-white hover:bg-slate-800/80 border border-slate-800/80 hover:border-amber-500/30 transition-all group"
                      >
                        <div className="min-w-0">
                          <span className="block truncate font-medium group-hover:text-amber-300 transition-colors">
                            {quiz.title}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {quiz.timeLimitMinutes} phút • {quiz.questionCount} câu
                            {quiz.myHighestScore !== null && quiz.myHighestScore !== undefined && (
                              <span className="ml-1 text-emerald-400 font-semibold font-mono">
                                • {quiz.myHighestScore}đ
                              </span>
                            )}
                          </span>
                        </div>

                        {quiz.myPassed ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                        ) : (
                          <FileQuestion className="w-4 h-4 text-amber-400 flex-shrink-0" />
                        )}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </aside>
        )}
      </div>
    </div>
  );
};
