import React, { useEffect, useState } from 'react';
import { courseService } from '../services/courseService';
import { Category, CourseSummary } from '../types/course';
import { CourseCard } from '../components/course/CourseCard';
import { JoinClassModal } from '../components/course/JoinClassModal';
import { CreateCourseModal } from '../components/course/CreateCourseModal';
import { useAuth } from '../context/AuthContext';
import { 
  Search, 
  Sparkles, 
  KeyRound, 
  PlusCircle, 
  BookOpen, 
  Loader2
} from 'lucide-react';

export const CourseListPage: React.FC = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState<CourseSummary[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(true);

  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const isLecturerOrAdmin = user && (user.role === 'LECTURER' || user.role === 'ADMIN');

  useEffect(() => {
    courseService.getCategories()
      .then(setCategories)
      .catch(() => {});
  }, []);

  const fetchCourses = () => {
    setLoading(true);
    courseService.getCourses({
      keyword: keyword.trim() || undefined,
      categoryId: selectedCategory || undefined,
      size: 20,
    })
      .then((res) => {
        setCourses(res.content);
      })
      .catch((err) => {
        console.error('Error fetching courses:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchCourses();
  }, [selectedCategory]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCourses();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Hero Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-200 dark:border-slate-800 pb-8">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Thư viện Khóa học & Lớp học Số</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Khám phá Khóa học Trực tuyến
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
            Các khóa học được thiết kế theo cấu trúc bài giảng video, học liệu tương tác và bài tập trắc nghiệm.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsJoinModalOpen(true)}
            className="px-4 py-2.5 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 text-xs font-semibold shadow-sm transition-all flex items-center gap-2"
          >
            <KeyRound className="w-4 h-4 text-indigo-500" />
            Nhập mã lớp
          </button>

          {isLecturerOrAdmin && (
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-md shadow-indigo-500/20 transition-all flex items-center gap-2"
            >
              <PlusCircle className="w-4 h-4" />
              Tạo khóa học mới
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm kiếm khóa học theo tên hoặc nội dung..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5"
          >
            Tìm kiếm
          </button>
        </form>

        {/* Categories Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              selectedCategory === null
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
            }`}
          >
            Tất cả danh mục
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(c.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === c.id
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {/* Courses Grid */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
          <p className="text-xs text-slate-500 font-medium">Đang tải danh sách khóa học...</p>
        </div>
      ) : courses.length === 0 ? (
        <div className="py-16 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-4">
            <BookOpen className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Không tìm thấy khóa học nào</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Hãy thử tìm kiếm với từ khóa khác hoặc xóa bộ lọc danh mục.
          </p>
          <button
            onClick={() => {
              setKeyword('');
              setSelectedCategory(null);
            }}
            className="mt-4 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors"
          >
            Xóa bộ lọc
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      )}

      {/* Modals */}
      <JoinClassModal
        isOpen={isJoinModalOpen}
        onClose={() => setIsJoinModalOpen(false)}
        onSuccess={fetchCourses}
      />

      <CreateCourseModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={fetchCourses}
      />
    </div>
  );
};
