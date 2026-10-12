import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Navbar } from './components/layout/Navbar';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { ProfilePage } from './pages/ProfilePage';
import { CourseListPage } from './pages/CourseListPage';
import { CourseDetailPage } from './pages/CourseDetailPage';
import { MyCoursesPage } from './pages/MyCoursesPage';
import { LearningPage } from './pages/LearningPage';
import { QuizTakingPage } from './pages/QuizTakingPage';
import { QuizResultPage } from './pages/QuizResultPage';
import { VideoRoomPage } from './pages/VideoRoomPage';
import { DashboardPage } from './pages/DashboardPage';
import { GraduationCap } from 'lucide-react';

function AppContent() {
  const location = useLocation();
  const isVideoRoom = location.pathname.startsWith('/rooms/');

  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('theme') === 'dark';
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      {!isVideoRoom && <Navbar darkMode={darkMode} setDarkMode={setDarkMode} />}

      <main className="flex-1">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/courses" element={<CourseListPage />} />
          <Route path="/courses/:slug" element={<CourseDetailPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-courses"
            element={
              <ProtectedRoute>
                <MyCoursesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/courses/:courseId/learn"
            element={
              <ProtectedRoute>
                <LearningPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/courses/:courseId/learn/:lessonId"
            element={
              <ProtectedRoute>
                <LearningPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/quizzes/:quizId/take"
            element={
              <ProtectedRoute>
                <QuizTakingPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/quizzes/attempts/:attemptId/result"
            element={
              <ProtectedRoute>
                <QuizResultPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/rooms/:roomCode"
            element={
              <ProtectedRoute>
                <VideoRoomPage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* Footer */}
      {!isVideoRoom && (
        <footer className="border-t border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 backdrop-blur py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
                <GraduationCap className="w-3.5 h-3.5" />
              </div>
              <span className="font-semibold text-slate-700 dark:text-slate-300">EduLive</span>
              <span>- Đồ án Nền tảng Học trực tuyến Thông minh</span>
            </div>

            <div className="flex items-center gap-4">
              <span>Spring Boot 3 • React Vite • WebRTC • PostgreSQL</span>
              <span>•</span>
              <span>2026 EduLive Team</span>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}
