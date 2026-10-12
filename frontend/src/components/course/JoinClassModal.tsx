import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { enrollmentService } from '../../services/enrollmentService';
import { useAuth } from '../../context/AuthContext';
import { KeyRound, X, AlertCircle, ArrowRight, Loader2, Sparkles } from 'lucide-react';

interface JoinClassModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const JoinClassModal: React.FC<JoinClassModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [classCode, setClassCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!classCode.trim()) {
      setError('Vui lòng nhập mã lớp học');
      return;
    }

    if (!isAuthenticated) {
      navigate('/login', { state: { message: 'Vui lòng đăng nhập để tham gia lớp học' } });
      onClose();
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const res = await enrollmentService.joinCourse({ classCode: classCode.trim().toUpperCase() });
      onClose();
      if (onSuccess) onSuccess();
      navigate(`/courses/${res.courseSlug}`);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Mã lớp không tồn tại hoặc không thể tham gia. Vui lòng kiểm tra lại.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-200 dark:border-indigo-800">
            <KeyRound className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Tham gia bằng Mã lớp</h3>
            <p className="text-xs text-slate-500">Giống mô hình mã tham gia của Google Classroom</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-center gap-2.5 text-xs text-rose-700 dark:text-rose-300">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Mã lớp học (Class Code)
            </label>
            <input
              type="text"
              placeholder="VD: FSW101, DSA202..."
              value={classCode}
              onChange={(e) => setClassCode(e.target.value.toUpperCase())}
              maxLength={10}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-bold tracking-widest text-center text-lg placeholder:font-normal placeholder:tracking-normal placeholder:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              autoFocus
            />
            <p className="text-[11px] text-slate-500 mt-1.5 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-indigo-500" />
              Mẹo thử nghiệm: Thử các mã seed data <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">FSW101</span>, <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">DSA202</span>, <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">NET303</span>
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-semibold shadow-md shadow-indigo-500/20 transition-all flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Đang kiểm tra...
                </>
              ) : (
                <>
                  Tham gia lớp học
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
