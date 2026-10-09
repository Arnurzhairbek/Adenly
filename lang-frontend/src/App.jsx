import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { AuthProvider } from "./contexts/AuthContext";
import ToastContainer from "./components/Toast";
import ErrorBoundary from "./components/ErrorBoundary";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";
import LoadingSpinner from "./components/LoadingSpinner";
import PageTransition from "./components/PageTransition";

// Lazy loading для всех страниц (code splitting)
const Home = lazy(() => import("./pages/Home"));
const Course = lazy(() => import("./pages/Course"));
const Exercise = lazy(() => import("./pages/Exercise"));
const Progress = lazy(() => import("./pages/Progress"));
const Achievements = lazy(() => import("./pages/Achievements"));
const Leaderboard = lazy(() => import("./pages/LeaderBoard"));
const Notifications = lazy(() => import("./pages/Notifications"));
const Profile = lazy(() => import("./pages/Profile"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const VerifyEmail = lazy(() => import("./pages/VerifyEmail"));
const Feedback = lazy(() => import("./pages/Feedback"));
const CourseReview = lazy(() => import("./pages/CourseReview"));
const Settings = lazy(() => import("./pages/Settings"));
const Notes = lazy(() => import("./pages/Notes"));
const Test = lazy(() => import("./pages/Test"));
const Certificates = lazy(() => import("./pages/Certificates"));
const CertificateDetail = lazy(() => import("./pages/CertificateDetail"));
const AIConversation = lazy(() => import("./pages/AIConversation"));
const AIFriend = lazy(() => import("./pages/AIFriend"));

// Компонент обёртки для Suspense с анимацией
const PageWrapper = ({ children }) => (
  <Suspense
    fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900">
        <LoadingSpinner size="xl" />
      </div>
    }
  >
    <PageTransition>
      {children}
    </PageTransition>
  </Suspense>
);

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <ToastContainer />
          <Routes>
            {/* Публичные маршруты (без аутентификации) */}
            <Route
              path="/login"
              element={
                <PageWrapper>
                  <Login />
                </PageWrapper>
              }
            />
            <Route
              path="/register"
              element={
                <PageWrapper>
                  <Register />
                </PageWrapper>
              }
            />
            <Route
              path="/forgot-password"
              element={
                <PageWrapper>
                  <ForgotPassword />
                </PageWrapper>
              }
            />
            <Route
              path="/reset-password/:token"
              element={
                <PageWrapper>
                  <ResetPassword />
                </PageWrapper>
              }
            />
            <Route
              path="/verify-email/:token"
              element={
                <Suspense
                  fallback={
                    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900">
                      <LoadingSpinner size="xl" />
                    </div>
                  }
                >
                  <VerifyEmail />
                </Suspense>
              }
            />

            {/* Защищенные маршруты (требуют аутентификации) */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Layout>
                    <PageWrapper>
                      <Home />
                    </PageWrapper>
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/home"
              element={
                <ProtectedRoute>
                  <Layout>
                    <PageWrapper>
                      <Home />
                    </PageWrapper>
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/courses"
              element={
                <ProtectedRoute>
                  <Layout>
                    <PageWrapper>
                      <Course />
                    </PageWrapper>
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/exercise"
              element={
                <ProtectedRoute>
                  <PageWrapper>
                    <Exercise />
                  </PageWrapper>
                </ProtectedRoute>
              }
            />
            <Route
              path="/progress"
              element={
                <ProtectedRoute>
                  <Layout>
                    <PageWrapper>
                      <Progress />
                    </PageWrapper>
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/achievements"
              element={
                <ProtectedRoute>
                  <Layout>
                    <PageWrapper>
                      <Achievements />
                    </PageWrapper>
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/leaderboard"
              element={
                <ProtectedRoute>
                  <Layout>
                    <PageWrapper>
                      <Leaderboard />
                    </PageWrapper>
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/notifications"
              element={
                <ProtectedRoute>
                  <Layout>
                    <PageWrapper>
                      <Notifications />
                    </PageWrapper>
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Layout>
                    <PageWrapper>
                      <Profile />
                    </PageWrapper>
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/feedback"
              element={
                <ProtectedRoute>
                  <Layout>
                    <PageWrapper>
                      <Feedback />
                    </PageWrapper>
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/course-review"
              element={
                <ProtectedRoute>
                  <Layout>
                    <PageWrapper>
                      <CourseReview />
                    </PageWrapper>
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <Layout>
                    <PageWrapper>
                      <Settings />
                    </PageWrapper>
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/notes"
              element={
                <ProtectedRoute>
                  <Layout>
                    <PageWrapper>
                      <Notes />
                    </PageWrapper>
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/tests/:testId"
              element={
                <ProtectedRoute>
                  <PageWrapper>
                    <Test />
                  </PageWrapper>
                </ProtectedRoute>
              }
            />
            <Route
              path="/certificates"
              element={
                <ProtectedRoute>
                  <Layout>
                    <PageWrapper>
                      <Certificates />
                    </PageWrapper>
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/certificates/:certificateId"
              element={
                <ProtectedRoute>
                  <Layout>
                    <PageWrapper>
                      <CertificateDetail />
                    </PageWrapper>
                  </Layout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/ai-conversation"
              element={
                <ProtectedRoute>
                  <PageWrapper>
                    <AIConversation />
                  </PageWrapper>
                </ProtectedRoute>
              }
            />
            <Route
              path="/ai-friend"
              element={
                <ProtectedRoute>
                  <Layout>
                    <PageWrapper>
                      <AIFriend />
                    </PageWrapper>
                  </Layout>
                </ProtectedRoute>
              }
            />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
