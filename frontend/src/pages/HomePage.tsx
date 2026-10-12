import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import {
  Sparkles,
  BookOpen,
  CheckCircle2,
  Video,
  FileQuestion,
  Users,
  ShieldCheck,
  ArrowRight,
  Server,
  Database,
  Lock
} from 'lucide-react';

interface HelloResponse {
  status: string;
  message: string;
  version: string;
  timestamp: number;
}

export const HomePage: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const [apiStatus, setApiStatus] = useState<HelloResponse | null>(null);
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null);

  useEffect(() => {
    axios
      .get<HelloResponse>('/api/v1/hello')
      .then((res) => {
        setApiStatus(res.data);
        setBackendOnline(true);
      })
      .catch(() => {
        setBackendOnline(false);
      });
  }, []);

  const demoAccounts = [
    {
      role: 'ADMIN',
      roleName: 'Quản trị viên',
      email: 'admin@edulive.vn',
      name: 'Nguyễn Văn Admin',
      badgeColor: 'bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border-rose-200 dark:border-rose-800'
    },
    {
      role: 'LECTURER',
      roleName: 'Giảng viên 1',
      email: 'giangvien1@edulive.vn',
      name: 'ThS. Trần Quang Vinh',
      badgeColor: 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border-blue-200 dark:border-blue-800'
    },
    {
      role: 'STUDENT',
      roleName: 'Học viên 1',
      email: 'hocvien1@edulive.vn',
      name: 'Phạm Minh Anh',
      badgeColor: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
    }
  ];

  const features = [
    {
      icon: BookOpen,
      color: 'from-blue-600 to-indigo-600',
      title: 'Khóa học & Lớp học kiểu Coursera',
      desc: 'Quản lý chương, bài giảng video, tài liệu đính kèm, mã lớp 6 ký tự tham gia nhanh.'
    },
    {
      icon: FileQuestion,
      color: 'from-amber-500 to-orange-600',
      title: 'Trắc nghiệm tính giờ & Chấm điểm tự động',
      desc: 'Bài kiểm tra trắc nghiệm nhiều lựa chọn, tự động tính điểm, lưu lịch sử làm bài.'
    },
    {
      icon: Video,
      color: 'from-rose-500 to-pink-600',
      title: 'Lớp học trực tuyến WebRTC P2P Mesh',
      desc: 'Phòng học ảo thời gian thực tích hợp camera, microphone, chia sẻ màn hình.'
    },
    {
      icon: Users,
      color: 'from-purple-500 to-violet-600',
      title: 'Thảo luận & Tương tác STOMP WebSocket',
      desc: 'Hỏi đáp bình luận phân cấp theo bài học và trao đổi tin nhắn trực tiếp.'
    }
  ];

  const phases = [
    { id: 1, name: 'Giai đoạn 1: Khởi tạo Monorepo & Cơ sở dữ liệu Flyway', status: 'Hoàn thành 100%' },
    { id: 2, name: 'Giai đoạn 2: Xác thực JWT, Phân quyền RBAC & Hồ sơ cá nhân', status: 'Hoàn thành 100%' },
    { id: 3, name: 'Giai đoạn 3: Khóa học, Bài giảng & Tiến độ học tập', status: 'Hoàn thành 100%' },
    { id: 4, name: 'Giai đoạn 4: Hệ thống Trắc nghiệm & Chấm điểm tự động', status: 'Hoàn thành 100%' },
    { id: 5, name: 'Giai đoạn 5: Diễn đàn Thảo luận lồng nhau & Chat nhóm STOMP', status: 'Hoàn thành 100%' },
    { id: 6, name: 'Giai đoạn 6: Phòng học trực tuyến Video Call WebRTC Mesh', status: 'Hoàn thành 100%' },
    { id: 7, name: 'Giai đoạn 7: Thông báo thời gian thực & Dashboard Phân tích', status: 'Hoàn thành 100%' },
    { id: 8, name: 'Giai đoạn 8: Hoàn thiện UI/UX, Dark mode & Animation', status: 'Hoàn thành 100%' },
    { id: 9, name: 'Giai đoạn 9: Đóng gói Docker Compose & Hướng dẫn triển khai', status: 'Đang triển khai' }
  ];

  return (
    <div className="space-y-16 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-10 sm:pt-16">
        <div className="max-w-5xl mx-auto text-center px-4 sm:px-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 mb-6 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-indigo-500 animate-pulse" />
            <span>Nền tảng Học trực tuyến Toàn diện: Spring Boot 3 + React + WebRTC P2P</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.15]">
            Nền tảng Học trực tuyến Hiện đại{' '}
            <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-pink-600 bg-clip-text text-transparent">
              EduLive
            </span>
          </h1>

          <p className="mt-5 text-lg sm:text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto font-normal">
            Trải nghiệm học tập toàn diện kết hợp mô hình lớp học số, bài giảng video, bài tập trắc nghiệm tự động, video call P2P không giới hạn và phòng học tương tác thời gian thực.
          </p>

          {/* User Status / Action buttons */}
          <div className="mt-8 flex flex-wrap justify-center items-center gap-4">
            {isAuthenticated ? (
              <Link
                to="/dashboard"
                className="px-6 py-3.5 rounded-xl bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 shadow-lg shadow-indigo-600/25 flex items-center gap-2 transition"
              >
                <span>Vào Bảng điều khiển (Dashboard)</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            ) : null}
            <Link
              to="/courses"
              className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-lg shadow-indigo-500/25 transition-all flex items-center gap-2"
            >
              <BookOpen className="w-4 h-4" />
              Khám phá Khóa học ngay
              <ArrowRight className="w-4 h-4" />
            </Link>

            {isAuthenticated && user ? (
              <div className="flex flex-wrap items-center gap-3">
                <Link
                  to="/my-courses"
                  className="px-5 py-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-semibold text-sm transition-all flex items-center gap-2"
                >
                  <ShieldCheck className="w-4 h-4" />
                  Khóa học của tôi
                </Link>
                <Link
                  to="/profile"
                  className="px-5 py-3 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-semibold text-sm shadow-sm transition-all"
                >
                  Hồ sơ cá nhân
                </Link>
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-3">
                <Link
                  to="/login"
                  className="px-5 py-3 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-semibold text-sm shadow-sm transition-all flex items-center gap-2"
                >
                  Đăng nhập
                </Link>
                <Link
                  to="/register"
                  className="px-5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-sm transition-all"
                >
                  Tạo tài khoản
                </Link>
              </div>
            )}

            <a
              href="http://localhost:8088/swagger-ui.html"
              target="_blank"
              rel="noreferrer"
              className="px-5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-sm transition-all flex items-center gap-2"
            >
              <Server className="w-4 h-4 text-indigo-500" />
              Swagger Docs
            </a>
          </div>

          {/* System Health Badge */}
          <div className="mt-8 flex items-center justify-center gap-6 text-xs text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-1.5">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  backendOnline === true
                    ? 'bg-emerald-500 ring-4 ring-emerald-500/20'
                    : backendOnline === false
                    ? 'bg-rose-500 ring-4 ring-rose-500/20'
                    : 'bg-amber-500 animate-pulse'
                }`}
              />
              <span>
                Backend API (Port 8088):{' '}
                <strong className="text-slate-700 dark:text-slate-300">
                  {backendOnline === true ? (apiStatus ? `${apiStatus.status} (v${apiStatus.version})` : 'Hoạt động') : backendOnline === false ? 'Chưa kết nối' : 'Đang kiểm tra...'}
                </strong>
              </span>
            </div>
            <div className="hidden sm:flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-indigo-500" />
              <span>PostgreSQL 16: <strong className="text-slate-700 dark:text-slate-300">18 Bảng Schema & Seed Data Sẵn sàng</strong></span>
            </div>
          </div>
        </div>
      </section>

      {/* Demo Accounts Card */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="bg-gradient-to-br from-indigo-50/50 via-white to-violet-50/50 dark:from-slate-900 dark:via-slate-900/90 dark:to-indigo-950/20 rounded-2xl border border-indigo-100 dark:border-slate-800 p-6 sm:p-8 shadow-sm">
          <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Lock className="w-5 h-5 text-indigo-600" />
                Tài khoản kiểm thử có sẵn (Seed Data)
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                Tất cả tài khoản đều sử dụng chung mật khẩu mặc định:{' '}
                <code className="px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-mono font-bold">
                  Password@123
                </code>
              </p>
            </div>
            <Link
              to="/login"
              className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
            >
              Tới trang đăng nhập nhanh
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {demoAccounts.map((acc) => (
              <div
                key={acc.email}
                className="p-4 rounded-xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${acc.badgeColor}`}>
                      {acc.roleName}
                    </span>
                    <span className="text-xs font-mono text-slate-400">ROLE: {acc.role}</span>
                  </div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{acc.name}</h3>
                  <p className="text-xs font-mono text-slate-500 mt-0.5">{acc.email}</p>
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">Pass: Password@123</span>
                  <Link
                    to="/login"
                    className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 flex items-center gap-1"
                  >
                    Đăng nhập <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Core Features */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
            Các Module Chức Năng Cốt Lõi
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
            Được kiến trúc theo chuẩn RESTful API, bảo mật JWT stateless và giao tiếp WebSocket thời gian thực.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feat, i) => {
            const Icon = feat.icon;
            return (
              <div
                key={i}
                className="p-6 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all"
              >
                <div
                  className={`w-12 h-12 rounded-xl bg-gradient-to-tr ${feat.color} text-white flex items-center justify-center shadow-md mb-4`}
                >
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">{feat.title}</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{feat.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Project Phases Checklist */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Tiến độ Triển khai theo Kế hoạch (9 Giai đoạn)
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Kế hoạch chi tiết được quản lý nghiêm ngặt tại <code className="font-mono">docs/IMPLEMENTATION_PLAN.md</code>
              </p>
            </div>
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
              Giai đoạn 2/9 Hoàn tất
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {phases.map((p) => {
              const isDone = p.status.includes('100%');
              const isNext = p.status.includes('Sẵn sàng');
              return (
                <div
                  key={p.id}
                  className={`p-3.5 rounded-xl border flex items-center justify-between ${
                    isDone
                      ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800'
                      : isNext
                      ? 'bg-indigo-50/40 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-800'
                      : 'bg-slate-50/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <CheckCircle2
                      className={`w-5 h-5 flex-shrink-0 ${
                        isDone
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : isNext
                          ? 'text-indigo-600 dark:text-indigo-400'
                          : 'text-slate-300 dark:text-slate-600'
                      }`}
                    />
                    <span className="text-xs font-medium text-slate-800 dark:text-slate-200">
                      {p.name}
                    </span>
                  </div>
                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                      isDone
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300'
                        : isNext
                        ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300'
                        : 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                    }`}
                  >
                    {p.status}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
};
