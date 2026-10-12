import React, { useState, useEffect } from 'react';
import { quizService } from '../../services/quizService';
import { QuizStatistics } from '../../types/quiz';
import { 
  X, 
  Users, 
  Trophy, 
  Percent, 
  CheckCircle, 
  XCircle,
  FileSpreadsheet
} from 'lucide-react';

interface Props {
  quizId: number;
  isOpen: boolean;
  onClose: () => void;
}

export const QuizStatisticsModal: React.FC<Props> = ({ quizId, isOpen, onClose }) => {
  const [stats, setStats] = useState<QuizStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await quizService.getQuizStatistics(quizId);
        setStats(data);
      } catch (err: any) {
        console.error('Failed to load quiz statistics:', err);
        setError(err.response?.data?.message || 'Không thể tải thống kê bài trắc nghiệm.');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [quizId, isOpen]);

  const handleExportCsv = async () => {
    if (!stats || exporting) return;
    try {
      setExporting(true);
      const blob = await quizService.exportQuizCsv(quizId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `quiz_${quizId}_statistics.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Export CSV failed:', err);
      alert('Tải file CSV thất bại. Vui lòng thử lại sau.');
    } finally {
      setExporting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="max-w-4xl w-full bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh] overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white line-clamp-1">
              Thống kê kết quả thi: {stats?.quizTitle || '...'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Phổ điểm và danh sách thí sinh nộp bài
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleExportCsv}
              disabled={exporting || loading || !stats || stats.totalAttempts === 0}
              className="inline-flex items-center space-x-2 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition disabled:opacity-50"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>{exporting ? 'Đang xuất file...' : 'Xuất file Excel CSV'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading && (
            <div className="py-12 text-center">
              <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
              <p className="text-sm text-slate-500">Đang tổng hợp dữ liệu phổ điểm...</p>
            </div>
          )}

          {error && (
            <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 text-sm">
              {error}
            </div>
          )}

          {stats && !loading && (
            <>
              {/* Stat Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-800">
                  <div className="flex items-center space-x-2 text-xs text-slate-500 mb-1">
                    <Users className="w-4 h-4 text-indigo-500" />
                    <span>Thí sinh tham gia</span>
                  </div>
                  <div className="text-2xl font-black text-slate-900 dark:text-white">
                    {stats.uniqueParticipants} <span className="text-xs font-normal text-slate-400">({stats.totalAttempts} lượt)</span>
                  </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-800">
                  <div className="flex items-center space-x-2 text-xs text-slate-500 mb-1">
                    <Trophy className="w-4 h-4 text-amber-500" />
                    <span>Điểm trung bình</span>
                  </div>
                  <div className="text-2xl font-black text-slate-900 dark:text-white">
                    {stats.averageScore} <span className="text-xs font-normal text-slate-400">/ 100</span>
                  </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-800">
                  <div className="flex items-center space-x-2 text-xs text-slate-500 mb-1">
                    <Trophy className="w-4 h-4 text-emerald-500" />
                    <span>Điểm cao nhất</span>
                  </div>
                  <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                    {stats.highestScore}
                  </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-800">
                  <div className="flex items-center space-x-2 text-xs text-slate-500 mb-1">
                    <Percent className="w-4 h-4 text-teal-500" />
                    <span>Tỷ lệ đạt</span>
                  </div>
                  <div className="text-2xl font-black text-teal-600 dark:text-teal-400">
                    {stats.passRatePercent}%
                  </div>
                </div>
              </div>

              {/* Submissions Table */}
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-3">
                  Danh sách bài nộp ({stats.attempts.length})
                </h3>

                {stats.attempts.length === 0 ? (
                  <p className="text-center py-8 text-sm text-slate-500 bg-slate-50 dark:bg-slate-800/30 rounded-xl">
                    Chưa có học viên nào nộp bài thi này.
                  </p>
                ) : (
                  <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
                    <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
                      <thead className="bg-slate-100 dark:bg-slate-800 text-xs uppercase font-bold text-slate-500 dark:text-slate-400">
                        <tr>
                          <th className="py-3 px-4">#</th>
                          <th className="py-3 px-4">Thí sinh</th>
                          <th className="py-3 px-4">Email</th>
                          <th className="py-3 px-4 text-center">Điểm số</th>
                          <th className="py-3 px-4 text-center">Kết quả</th>
                          <th className="py-3 px-4">Thời gian nộp</th>
                          <th className="py-3 px-4 text-right">Hành động</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {stats.attempts.map((a, idx) => (
                          <tr key={a.attemptId} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                            <td className="py-3 px-4 font-mono text-xs">{idx + 1}</td>
                            <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                              {a.userFullName}
                            </td>
                            <td className="py-3 px-4 text-xs font-mono">{a.userEmail}</td>
                            <td className="py-3 px-4 text-center font-bold font-mono">
                              <span className={a.isPassed ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>
                                {a.score}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-center">
                              {a.isPassed ? (
                                <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                                  <CheckCircle className="w-3 h-3" />
                                  <span>ĐẠT</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300">
                                  <XCircle className="w-3 h-3" />
                                  <span>CHƯA ĐẠT</span>
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-xs">
                              {a.submittedAt ? new Date(a.submittedAt).toLocaleString('vi-VN') : '—'}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <a
                                href={`/quizzes/attempts/${a.attemptId}/result`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-semibold"
                              >
                                Xem bài thi
                              </a>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
