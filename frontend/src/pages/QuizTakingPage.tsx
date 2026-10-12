import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { quizService } from '../services/quizService';
import { StartQuizData, TakingQuestion } from '../types/quiz';
import { 
  Clock, 
  AlertCircle, 
  CheckCircle, 
  ChevronLeft, 
  ChevronRight, 
  Send, 
  HelpCircle,
  AlertTriangle
} from 'lucide-react';

export const QuizTakingPage: React.FC = () => {
  const { quizId } = useParams<{ quizId: string }>();
  const navigate = useNavigate();

  const [quizData, setQuizData] = useState<StartQuizData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Câu hỏi hiện tại đang xem (index 0..N-1)
  const [currentIndex, setCurrentIndex] = useState(0);

  // userAnswers: Map questionId -> array of selectedOptionIds
  const [userAnswers, setUserAnswers] = useState<Record<number, number[]>>({});

  // Countdown timer in seconds
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [submitting, setSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const submittingRef = useRef(false);

  // Bắt đầu quiz khi load trang
  useEffect(() => {
    const initQuiz = async () => {
      if (!quizId) return;
      try {
        setLoading(true);
        setError(null);
        const data = await quizService.startQuiz(Number(quizId));
        setQuizData(data);

        // Tính thời gian còn lại dựa trên expiresAt
        const expiresTime = new Date(data.expiresAt).getTime();
        const now = new Date().getTime();
        const diffSeconds = Math.max(0, Math.floor((expiresTime - now) / 1000));
        setTimeLeft(diffSeconds > 0 ? diffSeconds : data.timeLimitMinutes * 60);
      } catch (err: any) {
        console.error('Failed to start quiz:', err);
        setError(err.response?.data?.message || 'Không thể bắt đầu bài thi. Vui lòng thử lại sau.');
      } finally {
        setLoading(false);
      }
    };

    initQuiz();
  }, [quizId]);

  // Bộ đếm ngược thời gian
  useEffect(() => {
    if (!quizData || timeLeft <= 0 || submitting) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          // Hết giờ -> Tự động nộp bài!
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [quizData, timeLeft, submitting]);

  const handleAutoSubmit = async () => {
    if (submittingRef.current || !quizData) return;
    submittingRef.current = true;
    setSubmitting(true);
    try {
      const payload = {
        answers: Object.entries(userAnswers).map(([qId, optIds]) => ({
          questionId: Number(qId),
          selectedOptionIds: optIds
        }))
      };
      const result = await quizService.submitQuiz(quizData.attemptId, payload);
      navigate(`/quizzes/attempts/${result.attemptId}/result`, { replace: true });
    } catch (err: any) {
      console.error('Auto submit failed:', err);
      alert('Thời gian làm bài đã kết thúc! Hệ thống đang lưu kết quả...');
    }
  };

  const handleSubmit = async () => {
    if (!quizData || submitting) return;
    try {
      setSubmitting(true);
      submittingRef.current = true;
      const payload = {
        answers: Object.entries(userAnswers).map(([qId, optIds]) => ({
          questionId: Number(qId),
          selectedOptionIds: optIds
        }))
      };
      const result = await quizService.submitQuiz(quizData.attemptId, payload);
      navigate(`/quizzes/attempts/${result.attemptId}/result`, { replace: true });
    } catch (err: any) {
      console.error('Submit quiz failed:', err);
      alert(err.response?.data?.message || 'Nộp bài thất bại. Vui lòng kiểm tra lại kết nối mạng!');
      setSubmitting(false);
      submittingRef.current = false;
    }
  };

  const handleSelectOption = (question: TakingQuestion, optionId: number) => {
    setUserAnswers(prev => {
      const currentSelected = prev[question.id] || [];

      if (question.questionType === 'SINGLE_CHOICE' || question.questionType === 'TRUE_FALSE') {
        return {
          ...prev,
          [question.id]: [optionId]
        };
      } else {
        // MULTIPLE_CHOICE: toggle
        if (currentSelected.includes(optionId)) {
          return {
            ...prev,
            [question.id]: currentSelected.filter(id => id !== optionId)
          };
        } else {
          return {
            ...prev,
            [question.id]: [...currentSelected, optionId]
          };
        }
      }
    });
  };

  // Định dạng thời gian MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400 font-medium">Đang khởi tạo đề thi trắc nghiệm...</p>
        </div>
      </div>
    );
  }

  if (error || !quizData) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 p-8 text-center">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-950/50 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Không thể làm bài thi</h2>
          <p className="text-slate-600 dark:text-slate-400 mb-6">{error}</p>
          <button
            onClick={() => navigate(-1)}
            className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition duration-150 shadow-lg shadow-indigo-600/25"
          >
            Quay lại trang trước
          </button>
        </div>
      </div>
    );
  }

  const currentQuestion = quizData.questions[currentIndex];
  const totalQuestions = quizData.questions.length;
  const answeredCount = Object.keys(userAnswers).filter(k => (userAnswers[Number(k)] || []).length > 0).length;
  const isTimeCritical = timeLeft < 120; // Dưới 2 phút

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col">
      {/* Top Fixed Header */}
      <header className="sticky top-0 z-30 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 lg:px-8 py-3.5 flex items-center justify-between shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold">
            <HelpCircle className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-slate-900 dark:text-white text-base lg:text-lg line-clamp-1">
              {quizData.title}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Đã làm: <span className="font-semibold text-indigo-600 dark:text-indigo-400">{answeredCount}</span> / {totalQuestions} câu
            </p>
          </div>
        </div>

        {/* Center: Countdown Timer */}
        <div className={`flex items-center space-x-2 px-4 py-2 rounded-xl font-mono text-base lg:text-lg font-bold border transition-colors ${
          isTimeCritical
            ? 'bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400 border-red-300 dark:border-red-800 animate-pulse'
            : 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800'
        }`}>
          <Clock className={`w-5 h-5 ${isTimeCritical ? 'text-red-600 dark:text-red-400' : 'text-indigo-600 dark:text-indigo-400'}`} />
          <span>{formatTime(timeLeft)}</span>
        </div>

        {/* Right: Submit Button */}
        <button
          onClick={() => setShowConfirmModal(true)}
          disabled={submitting}
          className="flex items-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-medium rounded-xl shadow-md shadow-emerald-600/20 transition duration-150 disabled:opacity-50"
        >
          <Send className="w-4 h-4" />
          <span className="hidden sm:inline">Nộp bài</span>
        </button>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Column: Current Question */}
        <main className="lg:col-span-3 flex flex-col space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 lg:p-8 shadow-sm border border-slate-200 dark:border-slate-800 flex-1 flex flex-col justify-between">
            <div>
              {/* Question Meta Badge */}
              <div className="flex items-center justify-between mb-4">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                  Câu hỏi {currentIndex + 1} / {totalQuestions}
                </span>
                <div className="flex items-center space-x-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                  <span>{currentQuestion.points} điểm</span>
                  <span>•</span>
                  <span>
                    {currentQuestion.questionType === 'SINGLE_CHOICE' && 'Chọn 1 đáp án'}
                    {currentQuestion.questionType === 'MULTIPLE_CHOICE' && 'Chọn nhiều đáp án'}
                    {currentQuestion.questionType === 'TRUE_FALSE' && 'Đúng hoặc Sai'}
                  </span>
                </div>
              </div>

              {/* Question Text */}
              <h2 className="text-lg lg:text-xl font-medium text-slate-900 dark:text-white leading-relaxed mb-6">
                {currentQuestion.questionText}
              </h2>

              {/* Options List */}
              <div className="space-y-3">
                {currentQuestion.options.map((option, idx) => {
                  const isSelected = (userAnswers[currentQuestion.id] || []).includes(option.id);
                  const isMulti = currentQuestion.questionType === 'MULTIPLE_CHOICE';

                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => handleSelectOption(currentQuestion, option.id)}
                      className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-start space-x-3 ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 text-slate-900 dark:text-white shadow-sm'
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div className={`w-6 h-6 mt-0.5 rounded-${isMulti ? 'md' : 'full'} flex items-center justify-center border-2 transition-colors flex-shrink-0 ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-600 text-white'
                          : 'border-slate-300 dark:border-slate-600 bg-transparent'
                      }`}>
                        {isSelected && (
                          isMulti ? (
                            <CheckCircle className="w-4 h-4 text-white" />
                          ) : (
                            <div className="w-2 h-2 rounded-full bg-white" />
                          )
                        )}
                        {!isSelected && (
                          <span className="text-xs text-slate-400 font-semibold">
                            {String.fromCharCode(65 + idx)}
                          </span>
                        )}
                      </div>
                      <span className="text-base font-normal leading-relaxed flex-1">
                        {option.optionText}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center justify-between pt-8 border-t border-slate-100 dark:border-slate-800/80 mt-8">
              <button
                onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
                disabled={currentIndex === 0}
                className="flex items-center space-x-2 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-medium transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Câu trước</span>
              </button>

              <span className="text-sm text-slate-500 dark:text-slate-400">
                {currentIndex + 1} / {totalQuestions}
              </span>

              <button
                onClick={() => setCurrentIndex(prev => Math.min(totalQuestions - 1, prev + 1))}
                disabled={currentIndex === totalQuestions - 1}
                className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-indigo-600/20"
              >
                <span>Câu tiếp theo</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </main>

        {/* Right Column: Question Palette (Navigation Grid) */}
        <aside className="lg:col-span-1 space-y-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-slate-200 dark:border-slate-800">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm uppercase tracking-wider mb-4">
              Mục lục câu hỏi
            </h3>

            <div className="grid grid-cols-5 gap-2.5">
              {quizData.questions.map((q, idx) => {
                const isCurrent = idx === currentIndex;
                const isAnswered = (userAnswers[q.id] || []).length > 0;

                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentIndex(idx)}
                    className={`h-10 rounded-xl font-semibold text-sm transition-all flex items-center justify-center ${
                      isCurrent
                        ? 'ring-2 ring-indigo-600 ring-offset-2 dark:ring-offset-slate-900 bg-indigo-600 text-white shadow-md'
                        : isAnswered
                        ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800'
                        : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2 text-xs text-slate-500 dark:text-slate-400">
              <div className="flex items-center space-x-2">
                <div className="w-3.5 h-3.5 rounded bg-emerald-500" />
                <span>Đã trả lời ({answeredCount})</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3.5 h-3.5 rounded bg-slate-200 dark:bg-slate-700" />
                <span>Chưa trả lời ({totalQuestions - answeredCount})</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3.5 h-3.5 rounded bg-indigo-600" />
                <span>Đang chọn</span>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-5">
            <div className="flex items-center space-x-3 text-amber-600 dark:text-amber-400">
              <AlertTriangle className="w-7 h-7 flex-shrink-0" />
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Xác nhận nộp bài thi
              </h3>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 space-y-2 text-sm text-slate-600 dark:text-slate-400">
              <p>
                Số câu đã làm: <strong className="text-emerald-600 dark:text-emerald-400">{answeredCount}</strong> / {totalQuestions} câu
              </p>
              {totalQuestions - answeredCount > 0 && (
                <p className="text-amber-600 dark:text-amber-400 font-medium">
                  Cảnh báo: Bạn còn {totalQuestions - answeredCount} câu chưa trả lời!
                </p>
              )}
              <p>
                Thời gian còn lại: <strong>{formatTime(timeLeft)}</strong>
              </p>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              Sau khi bấm nộp bài, hệ thống sẽ tự động chấm điểm và bạn không thể sửa đổi câu trả lời.
            </p>

            <div className="flex items-center space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-2.5 px-4 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium transition"
              >
                Tiếp tục làm bài
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium transition shadow-lg shadow-emerald-600/25 flex items-center justify-center space-x-2"
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Đang chấm điểm...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Nộp bài ngay</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
