import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { CourseSummary } from '../../types/course';
import { 
  BookOpen, 
  Users, 
  Copy, 
  Check, 
  ArrowRight, 
  CheckCircle2 
} from 'lucide-react';

interface CourseCardProps {
  course: CourseSummary;
}

export const CourseCard: React.FC<CourseCardProps> = ({ course }) => {
  const [copied, setCopied] = useState(false);

  const handleCopyCode = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(course.classCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const defaultThumbnail = 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&q=80';

  return (
    <div className="group rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col overflow-hidden">
      {/* Thumbnail */}
      <Link to={`/courses/${course.slug}`} className="relative aspect-video w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
        <img
          src={course.thumbnailUrl || defaultThumbnail}
          alt={course.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={(e) => {
            (e.target as HTMLImageElement).src = defaultThumbnail;
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-60" />

        {/* Category Badge */}
        {course.categoryName && (
          <span className="absolute top-3 left-3 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-white/90 dark:bg-slate-900/90 text-indigo-600 dark:text-indigo-400 backdrop-blur shadow-sm border border-white/20">
            {course.categoryName}
          </span>
        )}

        {/* Enrolled Badge */}
        {course.isEnrolled && (
          <span className="absolute top-3 right-3 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-emerald-500 text-white shadow-sm flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            Đã đăng ký
          </span>
        )}

        {/* Class Code pill on thumbnail bottom */}
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/60 text-white backdrop-blur text-[11px]">
            <span className="opacity-75">Mã lớp:</span>
            <code className="font-mono font-bold text-amber-300">{course.classCode}</code>
            <button
              onClick={handleCopyCode}
              title="Sao chép mã lớp"
              className="p-1 rounded hover:bg-white/20 text-slate-300 hover:text-white transition-colors"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            </button>
          </div>
        </div>
      </Link>

      {/* Body */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <Link to={`/courses/${course.slug}`}>
            <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-2 mb-2 leading-snug">
              {course.title}
            </h3>
          </Link>
          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed mb-4">
            {course.description || 'Khóa học cung cấp kiến thức nền tảng và thực hành chuyên sâu theo mô hình chuẩn đại học.'}
          </p>
        </div>

        {/* Footer Meta */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between mb-3">
            {/* Lecturer info */}
            <div className="flex items-center gap-2">
              <img
                src={course.lecturerAvatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=lecturer'}
                alt={course.lecturerName}
                className="w-6 h-6 rounded-full border border-slate-200 dark:border-slate-700 object-cover"
              />
              <span className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate max-w-[140px]">
                {course.lecturerName}
              </span>
            </div>

            {/* Counts */}
            <div className="flex items-center gap-3 text-xs text-slate-400">
              <span className="flex items-center gap-1" title="Số bài học">
                <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
                {course.totalLessons} bài
              </span>
              <span className="flex items-center gap-1" title="Số học viên">
                <Users className="w-3.5 h-3.5 text-slate-400" />
                {course.enrolledCount}
              </span>
            </div>
          </div>

          {/* Action button */}
          <Link
            to={`/courses/${course.slug}`}
            className={`w-full py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              course.isEnrolled
                ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100'
                : 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-600'
            }`}
          >
            {course.isEnrolled ? 'Vào học ngay' : 'Xem chi tiết & Đăng ký'}
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
};
