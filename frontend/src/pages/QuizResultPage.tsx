import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { quizService } from '../services/quizService';
import { QuizResult } from '../types/quiz';
import { 
  XCircle, 
  CheckCircle2, 
  ArrowLeft, 
  RotateCcw, 
  BookOpen, 
  Lightbulb, 
  HelpCircle,
  Award,
  AlertCircle
} from 'lucide-react';

export const QuizResultPage: React.FC = () => {
  const { attemptId } = useParams<{ attemptId: string }>();
  const navigate = useNavigate();

  const [result, setResult] = useState<QuizResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchResult = async () => {
      if (!attemptId) return;
      try {
        setLoading(true);
        setError(null);
        const data = await quizService.getAttemptResult(Number(attemptId));
        setResult(data);
      } catch (err: any) {
        console.error('Failed to load quiz result:', err);
        setError(err.response?.data?.message || 'Không thể tải kết quả bài thi.');
      } finally {
        setLoading(false);
      }
    };

    fetchResult();
  }, [attemptId]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins === 0) return `${secs} giây`;
    return `${mins} phút ${secs} giây`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400 font-medium">Đang tải kết quả và phân tích bài thi...</p>
        </div>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-8 text-center">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-950/50 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Lỗi tải kết quả</h2>
          <p className="text-slate-600 dark:text-slate-400 mb-6">{error}</p>
          <button
            onClick={() => navigate('/my-courses')}
            className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition duration-150"
          >
            Quay về khóa học của tôi
          </button>
        </div>
      </div>
    );
  }

  const isPassed = result.isPassed;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 py-8 px-4 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
            Kết quả bài thi trắc nghiệm
          </span>
        </div>

        {/* Hero Score Card */}
        <div className={`rounded-3xl p-8 lg:p-10 shadow-lg border relative overflow-hidden ${
          isPassed 
            ? 'bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-slate-900 border-emerald-500/30 dark:border-emerald-500/20'
            : 'bg-gradient-to-br from-rose-500/10 via-orange-500/5 to-slate-900 border-rose-500/30 dark:border-rose-500/20'
        }`}>
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="space-y-3 text-center md:text-left">
              <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-white/80 dark:bg-slate-800/80 shadow-sm">
                {isPassed ? (
                  <>
                    <Award className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-emerald-700 dark:text-emerald-300">ĐÃ ĐẠT YÊU CẦU</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                    <span className="text-rose-700 dark:text-rose-300">CHƯA ĐẠT</span>
                  </>
                )}
              </div>

              <h1 className="text-2xl lg:text-3xl font-extrabold text-slate-900 dark:text-white">
                {result.quizTitle}
              </h1>

              <p className="text-sm text-slate-600 dark:text-slate-300 max-w-xl">
                {isPassed
                  ? 'Chúc mừng bạn đã hoàn thành xuất sắc bài kiểm tra trắc nghiệm!'
                  : `Điểm số của bạn chưa đạt mức yêu cầu (${result.passingScore} điểm). Hãy xem lại các câu sai bên dưới và ôn tập thêm nhé!`}
              </p>
            </div>

            {/* Score Ring / Box */}
            <div className="flex flex-col items-center justify-center p-6 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 min-w-[180px]">
              <span className="text-xs uppercase font-semibold text-slate-400 tracking-wider mb-1">
                Điểm số đạt được
              </span>
              <div className="text-4xl lg:text-5xl font-black font-mono">
                <span className={isPassed ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>
                  {result.score}
                </span>
                <span className="text-xl text-slate-400 font-normal"> / 100</span>
              </div>
              <span className="text-xs text-slate-500 mt-2">
                Điểm đạt: {result.passingScore} điểm
              </span>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-8 border-t border-slate-200/60 dark:border-slate-800/60">
            <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur rounded-xl p-3.5 border border-slate-200/50 dark:border-slate-800/50">
              <span className="text-xs text-slate-500 block mb-1">Số câu đúng</span>
              <span className="text-lg font-bold text-slate-900 dark:text-white">
                {result.correctQuestionsCount} / {result.totalQuestions}
              </span>
            </div>

            <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur rounded-xl p-3.5 border border-slate-200/50 dark:border-slate-800/50">
              <span className="text-xs text-slate-500 block mb-1">Tổng điểm câu hỏi</span>
              <span className="text-lg font-bold text-slate-900 dark:text-white">
                {result.earnedPoints} / {result.totalPoints}
              </span>
            </div>

            <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur rounded-xl p-3.5 border border-slate-200/50 dark:border-slate-800/50">
              <span className="text-xs text-slate-500 block mb-1">Thời gian làm bài</span>
              <span className="text-lg font-bold text-slate-900 dark:text-white">
                {formatDuration(result.durationSeconds)}
              </span>
            </div>

            <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur rounded-xl p-3.5 border border-slate-200/50 dark:border-slate-800/50">
              <span className="text-xs text-slate-500 block mb-1">Trạng thái nộp</span>
              <span className="text-lg font-bold text-slate-900 dark:text-white">
                {result.status === 'TIMED_OUT' ? 'Hết giờ (Auto)' : 'Đã nộp bài'}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 mt-6">
            <Link
              to={`/quizzes/${result.quizId}/take`}
              className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-md shadow-indigo-600/20 transition"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Làm lại bài thi</span>
            </Link>

            <button
              onClick={() => navigate(-2)}
              className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium transition"
            >
              <BookOpen className="w-4 h-4" />
              <span>Quay lại khóa học</span>
            </button>
          </div>
        </div>

        {/* Detailed Question Review Section */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center space-x-2">
              <HelpCircle className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <span>Chi tiết đáp án & Lời giải thích</span>
            </h2>
            <span className="text-xs text-slate-500">
              Đúng {result.correctQuestionsCount} trên tổng số {result.totalQuestions} câu
            </span>
          </div>

          <div className="space-y-6">
            {result.reviewQuestions.map((q, idx) => {
              const isCorrect = q.isCorrect;

              return (
                <div
                  key={q.questionId}
                  className={`bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border transition-all ${
                    isCorrect
                      ? 'border-emerald-200 dark:border-emerald-900/50'
                      : 'border-rose-200 dark:border-rose-900/50'
                  }`}
                >
                  {/* Question Header */}
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex items-center space-x-3">
                      <span className={`w-8 h-8 rounded-xl font-bold flex items-center justify-center text-sm ${
                        isCorrect
                          ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400'
                          : 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-400'
                      }`}>
                        {idx + 1}
                      </span>
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-md uppercase tracking-wider ${
                        isCorrect
                          ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400'
                          : 'bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400'
                      }`}>
                        {isCorrect ? 'Chính xác' : 'Chưa đúng'}
                      </span>
                    </div>

                    <span className="text-xs font-medium text-slate-500">
                      {q.earnedPoints} / {q.points} điểm
                    </span>
                  </div>

                  {/* Question Text */}
                  <h3 className="text-base lg:text-lg font-medium text-slate-900 dark:text-white mb-4 leading-relaxed">
                    {q.questionText}
                  </h3>

                  {/* Options List */}
                  <div className="space-y-2.5 mb-5">
                    {q.options.map((opt, oIdx) => {
                      const isOptionCorrect = opt.isCorrect;
                      const isOptionSelected = opt.isSelectedByUser;

                      let itemStyle = 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-slate-700 dark:text-slate-300';
                      let badge = null;

                      if (isOptionCorrect && isOptionSelected) {
                        itemStyle = 'border-emerald-500 bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 font-medium';
                        badge = (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-200 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 font-semibold flex items-center space-x-1">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Bạn chọn đúng</span>
                          </span>
                        );
                      } else if (isOptionCorrect && !isOptionSelected) {
                        itemStyle = 'border-emerald-400/80 bg-emerald-50/40 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300 font-medium';
                        badge = (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/80 text-emerald-700 dark:text-emerald-300 font-semibold flex items-center space-x-1">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Đáp án đúng</span>
                          </span>
                        );
                      } else if (!isOptionCorrect && isOptionSelected) {
                        itemStyle = 'border-rose-400 bg-rose-50/70 dark:bg-rose-950/40 text-rose-900 dark:text-rose-200';
                        badge = (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-rose-200 dark:bg-rose-900 text-rose-800 dark:text-rose-200 font-semibold flex items-center space-x-1">
                            <XCircle className="w-3 h-3" />
                            <span>Bạn chọn sai</span>
                          </span>
                        );
                      }

                      return (
                        <div
                          key={opt.id}
                          className={`p-3.5 rounded-xl border flex items-center justify-between space-x-3 transition-colors ${itemStyle}`}
                        >
                          <div className="flex items-center space-x-3 flex-1">
                            <span className="text-xs font-bold text-slate-400 w-5">
                              {String.fromCharCode(65 + oIdx)}.
                            </span>
                            <span className="text-sm leading-relaxed">{opt.optionText}</span>
                          </div>
                          {badge}
                        </div>
                      );
                    })}
                  </div>

                  {/* Explanation Section */}
                  {q.explanation && (
                    <div className="bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/50 rounded-xl p-4 flex items-start space-x-3 text-sm">
                      <Lightbulb className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-amber-800 dark:text-amber-300 block mb-1">
                          Giải thích đáp án:
                        </strong>
                        <p className="text-amber-900/80 dark:text-amber-200/90 leading-relaxed">
                          {q.explanation}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
};
