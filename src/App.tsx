import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

// Pages
import SplashScreen from "./pages/SplashScreen";
import AuthScreen from "./pages/AuthScreen";
import CalendarPage from "./pages/CalendarPage";
import DayDetailPage from "./pages/DayDetailPage";
import EventsPage from "./pages/EventsPage";
import LibraryPage from "./pages/LibraryPage";
import ProfilePage from "./pages/ProfilePage";
import CreateEventPage from "./pages/CreateEventPage";
import EventDetailPage from "./pages/EventDetailPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Splash & Auth */}
          <Route path="/" element={<SplashScreen />} />
          <Route path="/auth" element={<AuthScreen />} />
          
          {/* Main App Routes */}
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/day/:date" element={<DayDetailPage />} />
          <Route path="/events" element={<EventsPage />} />
          <Route path="/library" element={<LibraryPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          
          {/* Event Management */}
          <Route path="/event/new" element={<CreateEventPage />} />
          <Route path="/event/:id" element={<EventDetailPage />} />
          
          {/* Catch-all */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
