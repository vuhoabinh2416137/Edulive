import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  GraduationCap, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  Sparkles,
  ArrowRight,
  Shield,
  BookOpen,
  UserCheck
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login({ email, password });
      navigate(from, { replace: true });
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Đăng nhập không thành công. Vui lòng kiểm tra lại thông tin.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const fillDemoAccount = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('Password@123');
    setError(null);
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25 mb-4">
            <GraduationCap className="w-7 h-7" />
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Đăng nhập EduLive
          </h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Chào mừng bạn quay lại hệ thống học trực tuyến
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white dark:bg-slate-900 py-8 px-6 sm:px-8 shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-200 dark:border-slate-800 rounded-3xl space-y-6">
          {error && (
            <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/50 flex items-start gap-3 text-rose-600 dark:text-rose-400 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-5 h-5" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@edulive.vn"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Mật khẩu
                </label>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-11 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold text-sm shadow-md shadow-indigo-600/25 transition-all flex items-center justify-center gap-2 group"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  Đăng nhập
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Accounts */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
              <Sparkles className="w-4 h-4 text-amber-500" />
              Tài khoản mẫu dùng thử (Mật khẩu: Password@123)
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => fillDemoAccount('admin@edulive.vn')}
                className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-left transition-colors flex items-center gap-2"
              >
                <Shield className="w-4 h-4 text-rose-500 shrink-0" />
                <div>
                  <div className="font-semibold text-slate-900 dark:text-white">Admin</div>
                  <div className="text-[10px] text-slate-500 truncate">admin@edulive.vn</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => fillDemoAccount('giangvien1@edulive.vn')}
                className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-left transition-colors flex items-center gap-2"
              >
                <BookOpen className="w-4 h-4 text-blue-500 shrink-0" />
                <div>
                  <div className="font-semibold text-slate-900 dark:text-white">Giảng viên 1</div>
                  <div className="text-[10px] text-slate-500 truncate">ThS. Nguyễn Văn A</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => fillDemoAccount('giangvien2@edulive.vn')}
                className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-left transition-colors flex items-center gap-2"
              >
                <BookOpen className="w-4 h-4 text-blue-500 shrink-0" />
                <div>
                  <div className="font-semibold text-slate-900 dark:text-white">Giảng viên 2</div>
                  <div className="text-[10px] text-slate-500 truncate">TS. Trần Thị B</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => fillDemoAccount('hocvien1@edulive.vn')}
                className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-left transition-colors flex items-center gap-2"
              >
                <UserCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                <div>
                  <div className="font-semibold text-slate-900 dark:text-white">Học viên 1</div>
                  <div className="text-[10px] text-slate-500 truncate">Lê Hoàng C</div>
                </div>
              </button>
            </div>
          </div>

          {/* Register Link */}
          <div className="text-center text-xs text-slate-500">
            Chưa có tài khoản?{' '}
            <Link to="/register" className="font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">
              Đăng ký ngay
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
