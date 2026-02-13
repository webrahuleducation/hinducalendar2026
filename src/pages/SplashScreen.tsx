import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import {
  Carousel, CarouselContent, CarouselItem, type CarouselApi,
} from "@/components/ui/carousel";
import { OnboardingSlide1, OnboardingSlide2 } from "@/components/onboarding";
import { useLanguage } from "@/contexts/LanguageContext";

const SLIDE_COUNT = 2;
const AUTO_SCROLL_INTERVAL = 10000;

export default function SplashScreen() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useLanguage();
  const [isVisible, setIsVisible] = useState(false);
  const [api, setApi] = useState<CarouselApi>();
  const [currentSlide, setCurrentSlide] = useState(0);

  // Redirect logged-in users directly to calendar
  useEffect(() => {
    if (user) {
      navigate("/calendar", { replace: true });
    }
  }, [user, navigate]);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!api) return;
    const onSelect = () => setCurrentSlide(api.selectedScrollSnap());
    api.on("select", onSelect);
    return () => { api.off("select", onSelect); };
  }, [api]);

  useEffect(() => {
    if (!api) return;
    const interval = setInterval(() => {
      api.scrollTo((api.selectedScrollSnap() + 1) % SLIDE_COUNT);
    }, AUTO_SCROLL_INTERVAL);
    return () => clearInterval(interval);
  }, [api]);

  const handleGetStarted = useCallback(() => {
    navigate(user ? "/calendar" : "/auth");
  }, [user, navigate]);

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-between overflow-hidden bg-gradient-sunset py-8">
      <div className="absolute inset-0 bg-gradient-sunrise opacity-50" />
      <div className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
      <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-secondary/10 blur-3xl" />
      <div className="flex-shrink-0" />
      <div className="relative z-10 w-full max-w-md flex-1 flex flex-col justify-center">
        <Carousel setApi={setApi} opts={{ align: "center", loop: true }} className="w-full">
          <CarouselContent className="-ml-0">
            <CarouselItem className="pl-0"><OnboardingSlide1 isVisible={isVisible} /></CarouselItem>
            <CarouselItem className="pl-0"><OnboardingSlide2 isVisible={isVisible} /></CarouselItem>
          </CarouselContent>
        </Carousel>
        <div className="flex justify-center gap-2 mt-6">
          {Array.from({ length: SLIDE_COUNT }).map((_, index) => (
            <button key={index} onClick={() => api?.scrollTo(index)}
              className={cn("h-2 rounded-full transition-all duration-300",
                currentSlide === index ? "w-6 bg-primary" : "w-2 bg-primary/30 hover:bg-primary/50"
              )} aria-label={`Go to slide ${index + 1}`} />
          ))}
        </div>
      </div>
      <div className={cn("relative z-10 flex flex-col items-center gap-4 px-6 pt-6 pb-4 transition-all duration-500",
        isVisible ? "opacity-100 scale-100" : "opacity-0 scale-95")}>
        <Button onClick={handleGetStarted} size="lg" className="gap-2 rounded-full px-8 shadow-spiritual">
          {t("splash.getStarted")} <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
