import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@/components/ui/carousel";
import { OnboardingSlide1, OnboardingSlide2 } from "@/components/onboarding";

const SLIDE_COUNT = 2;
const AUTO_SCROLL_INTERVAL = 10000; // 10 seconds

export default function SplashScreen() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isVisible, setIsVisible] = useState(false);
  const [api, setApi] = useState<CarouselApi>();
  const [currentSlide, setCurrentSlide] = useState(0);

  // Fade in animation
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Track current slide
  useEffect(() => {
    if (!api) return;

    const onSelect = () => {
      setCurrentSlide(api.selectedScrollSnap());
    };

    api.on("select", onSelect);
    return () => {
      api.off("select", onSelect);
    };
  }, [api]);

  // Auto-scroll with loop
  useEffect(() => {
    if (!api) return;

    const interval = setInterval(() => {
      const nextSlide = (api.selectedScrollSnap() + 1) % SLIDE_COUNT;
      api.scrollTo(nextSlide);
    }, AUTO_SCROLL_INTERVAL);

    return () => clearInterval(interval);
  }, [api]);

  const handleGetStarted = useCallback(() => {
    if (user) {
      navigate("/calendar");
    } else {
      navigate("/auth");
    }
  }, [user, navigate]);

  const handleDotClick = (index: number) => {
    api?.scrollTo(index);
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-between overflow-hidden bg-gradient-sunset py-8">
      {/* Decorative background elements */}
      <div className="absolute inset-0 bg-gradient-sunrise opacity-50" />
      <div className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
      <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-secondary/10 blur-3xl" />

      {/* Spacer for top */}
      <div className="flex-shrink-0" />

      {/* Carousel */}
      <div className="relative z-10 w-full max-w-md flex-1 flex flex-col justify-center">
        <Carousel
          setApi={setApi}
          opts={{
            align: "center",
            loop: true,
          }}
          className="w-full"
        >
          <CarouselContent className="-ml-0">
            <CarouselItem className="pl-0">
              <OnboardingSlide1 isVisible={isVisible} />
            </CarouselItem>
            <CarouselItem className="pl-0">
              <OnboardingSlide2 isVisible={isVisible} />
            </CarouselItem>
          </CarouselContent>
        </Carousel>

        {/* Dot Indicators */}
        <div className="flex justify-center gap-2 mt-6">
          {Array.from({ length: SLIDE_COUNT }).map((_, index) => (
            <button
              key={index}
              onClick={() => handleDotClick(index)}
              className={cn(
                "h-2 rounded-full transition-all duration-300",
                currentSlide === index
                  ? "w-6 bg-primary"
                  : "w-2 bg-primary/30 hover:bg-primary/50"
              )}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Get Started Button - Outside of slides */}
      <div className={cn(
        "relative z-10 flex flex-col items-center gap-4 px-6 pt-6 pb-4 transition-all duration-500",
        isVisible ? "opacity-100 scale-100" : "opacity-0 scale-95"
      )}>
        <Button
          onClick={handleGetStarted}
          size="lg"
          className="gap-2 rounded-full px-8 shadow-spiritual"
        >
          Get Started
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
