import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { JoinClassModal } from '../course/JoinClassModal';
import { CreateCourseModal } from '../course/CreateCourseModal';
import { NotificationDropdown } from './NotificationDropdown';
import { 
  GraduationCap, 
  LogOut, 
  Sun, 
  Moon, 
  LogIn, 
  UserPlus,
  Compass,
  BookOpen,
  KeyRound,
  PlusCircle,
  LayoutDashboard
} from 'lucide-react';

interface NavbarProps {
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ darkMode, setDarkMode }) => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300">Admin</span>;
      case 'LECTURER':
        return <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">Giảng viên</span>;
      default:
        return <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">Học viên</span>;
    }
  };

  const isLecturerOrAdmin = user && (user.role === 'LECTURER' || user.role === 'ADMIN');

  return (
    <>
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Left: Brand + Nav Links */}
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                  EduLive
                </span>
                <span className="text-[10px] font-medium text-slate-500 -mt-1">
                  Học trực tuyến thông minh
                </span>
              </div>
            </Link>

            <nav className="hidden md:flex items-center gap-1">
              <Link
                to="/courses"
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                  location.pathname === '/courses'
                    ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Compass className="w-3.5 h-3.5" />
                Khám phá Khóa học
              </Link>

              {isAuthenticated && (
                <>
                  <Link
                    to="/dashboard"
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                      location.pathname === '/dashboard'
                        ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <LayoutDashboard className="w-3.5 h-3.5" />
                    Tổng quan
                  </Link>

                  <Link
                    to="/my-courses"
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                      location.pathname === '/my-courses'
                        ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    Khóa học của tôi
                  </Link>
                </>
              )}
            </nav>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-3">
            {/* Notification Dropdown */}
            {isAuthenticated && <NotificationDropdown />}

            {/* Join by Class Code button */}
            <button
              onClick={() => setIsJoinModalOpen(true)}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-colors"
              title="Nhập mã lớp để tham gia nhanh"
            >
              <KeyRound className="w-3.5 h-3.5 text-indigo-500" />
              Nhập mã lớp
            </button>

            {/* Create course button if lecturer */}
            {isLecturerOrAdmin && (
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm transition-colors"
                title="Tạo khóa học mới"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                Tạo khóa học
              </button>
            )}

            {/* Dark mode button */}
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
              title="Đổi giao diện Sáng / Tối"
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>

            {isAuthenticated && user ? (
              <div className="flex items-center gap-2">
                <Link
                  to="/profile"
                  className="flex items-center gap-2.5 p-1.5 pr-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <img
                    src={user.avatarUrl || 'https://api.dicebear.com/7.x/avataaars/svg?seed=user'}
                    alt={user.fullName}
                    className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700 object-cover"
                  />
                  <div className="hidden sm:flex flex-col items-start">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-slate-900 dark:text-white max-w-[120px] truncate">
                        {user.fullName}
                      </span>
                      {getRoleBadge(user.role)}
                    </div>
                    <span className="text-[11px] text-slate-500 max-w-[120px] truncate">{user.email}</span>
                  </div>
                </Link>

                <button
                  onClick={handleLogout}
                  className="p-2 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-colors"
                  title="Đăng xuất"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1.5"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  Đăng nhập
                </Link>
                <Link
                  to="/register"
                  className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-all flex items-center gap-1.5"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  Đăng ký
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Modals */}
      <JoinClassModal
        isOpen={isJoinModalOpen}
        onClose={() => setIsJoinModalOpen(false)}
      />

      <CreateCourseModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={(id) => navigate(`/courses/${id}`)}
      />
    </>
  );
};
