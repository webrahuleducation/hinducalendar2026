import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { InstallPrompt, OfflineIndicator } from "@/components/pwa";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

// Lazy-loaded pages for better performance
const SplashScreen = lazy(() => import("./pages/SplashScreen"));
const AuthScreen = lazy(() => import("./pages/AuthScreen"));
const CalendarPage = lazy(() => import("./pages/CalendarPage"));
const DayDetailPage = lazy(() => import("./pages/DayDetailPage"));
const EventsPage = lazy(() => import("./pages/EventsPage"));
const LibraryPage = lazy(() => import("./pages/LibraryPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const CreateEventPage = lazy(() => import("./pages/CreateEventPage"));
const EventDetailPage = lazy(() => import("./pages/EventDetailPage"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Page loading fallback
function PageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <LoadingSpinner size="lg" />
    </div>
  );
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 30 * 60 * 1000, // 30 minutes (previously cacheTime)
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <OfflineIndicator />
        <BrowserRouter>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* Splash & Auth */}
              <Route path="/" element={<SplashScreen />} />
              <Route path="/auth" element={<AuthScreen />} />
              
              {/* Main App Routes (accessible without auth) */}
              <Route path="/calendar" element={<CalendarPage />} />
              <Route path="/day/:date" element={<DayDetailPage />} />
              <Route path="/library" element={<LibraryPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              
              {/* Protected Routes (require authentication) */}
              <Route path="/events" element={
                <ProtectedRoute>
                  <EventsPage />
                </ProtectedRoute>
              } />
              <Route path="/event/new" element={
                <ProtectedRoute>
                  <CreateEventPage />
                </ProtectedRoute>
              } />
              <Route path="/event/:id" element={
                <ProtectedRoute>
                  <EventDetailPage />
                </ProtectedRoute>
              } />
              
              {/* Catch-all */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
          <InstallPrompt />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
