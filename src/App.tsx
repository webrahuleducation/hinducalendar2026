import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { TimeFormatProvider } from "@/contexts/TimeFormatContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { OfflineIndicator } from "@/components/pwa";
import { FCMInitializer } from "@/components/pwa/FCMInitializer";
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
const PrivacyPolicyPage = lazy(() => import("./pages/PrivacyPolicyPage"));
const TermsOfServicePage = lazy(() => import("./pages/TermsOfServicePage"));

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
      staleTime: 5 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <LanguageProvider>
        <TimeFormatProvider>
          <AuthProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <OfflineIndicator />
              <FCMInitializer />
              <BrowserRouter>
                <Suspense fallback={<PageLoader />}>
                  <Routes>
                    <Route path="/" element={<SplashScreen />} />
                    <Route path="/auth" element={<AuthScreen />} />
                    <Route path="/calendar" element={<CalendarPage />} />
                    <Route path="/day/:date" element={<DayDetailPage />} />
                    <Route path="/library" element={<LibraryPage />} />
                    <Route path="/profile" element={<ProfilePage />} />
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
                    <Route path="/privacy" element={<PrivacyPolicyPage />} />
                    <Route path="/terms" element={<TermsOfServicePage />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Suspense>
              </BrowserRouter>
            </TooltipProvider>
          </AuthProvider>
        </TimeFormatProvider>
      </LanguageProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
