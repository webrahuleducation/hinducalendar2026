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
import onboardingSlide1 from "@/assets/onboarding-slide-1.png";
import onboardingSlide2 from "@/assets/onboarding-slide-2.png";

const slides = [
  {
    id: 1,
    title: "ॐ Hindu Vrat & Utsav Calendar 2026",
    subtitle: "Your complete spiritual planner for festivals, fasting days, and sacred celebrations",
    image: onboardingSlide1,
  },
  {
    id: 2,
    title: "Plan Your Spiritual Journey",
    subtitle: "Never miss important vrat, tithi, or utsav throughout the year",
    image: onboardingSlide2,
    showButton: true,
  },
];

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
    onSelect();

    return () => {
      api.off("select", onSelect);
    };
  }, [api]);

  // Auto-scroll every 10 seconds with loop
  useEffect(() => {
    if (!api) return;

    const interval = setInterval(() => {
      const nextIndex = (api.selectedScrollSnap() + 1) % slides.length;
      api.scrollTo(nextIndex);
    }, 10000);

    return () => clearInterval(interval);
  }, [api]);

  const handleGetStarted = useCallback(() => {
    if (user) {
      navigate("/calendar");
    } else {
      navigate("/auth");
    }
  }, [user, navigate]);

  const scrollToSlide = useCallback((index: number) => {
    api?.scrollTo(index);
  }, [api]);

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-gradient-sunset">
      {/* Decorative background elements */}
      <div className="absolute inset-0 bg-gradient-sunrise opacity-50" />
      <div className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
      <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-secondary/10 blur-3xl" />

      <div
        className={cn(
          "relative z-10 flex flex-1 flex-col transition-all duration-700",
          isVisible ? "opacity-100" : "opacity-0"
        )}
      >
        <Carousel
          setApi={setApi}
          opts={{
            loop: true,
            align: "center",
          }}
          className="flex-1"
        >
          <CarouselContent className="h-full">
            {slides.map((slide, index) => (
              <CarouselItem key={slide.id} className="flex h-full items-center justify-center">
                <div className="flex h-full w-full flex-col items-center justify-center gap-6 px-6 py-12 text-center">
                  {/* Image */}
                  <div className="relative h-56 w-56 overflow-hidden rounded-3xl shadow-spiritual sm:h-64 sm:w-64">
                    <img
                      src={slide.image}
                      alt={slide.title}
                      className="h-full w-full object-cover"
                    />
                  </div>

                  {/* Text Content */}
                  <div className="max-w-sm space-y-3">
                    <h1 className="font-serif text-2xl font-bold text-foreground sm:text-3xl">
                      {slide.title}
                    </h1>
                    <p className="text-sm text-muted-foreground sm:text-base">
                      {slide.subtitle}
                    </p>
                  </div>

                  {/* Get Started Button - only on last slide */}
                  {slide.showButton && (
                    <Button
                      onClick={handleGetStarted}
                      size="lg"
                      className={cn(
                        "mt-4 gap-2 rounded-full px-8 transition-all duration-500",
                        currentSlide === index ? "opacity-100 scale-100" : "opacity-0 scale-95"
                      )}
                    >
                      Get Started
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>

        {/* Pagination Dots */}
        <div className="relative z-10 flex justify-center gap-2 pb-12">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => scrollToSlide(index)}
              className={cn(
                "h-2.5 rounded-full transition-all duration-300",
                currentSlide === index
                  ? "w-8 bg-primary"
                  : "w-2.5 bg-primary/30 hover:bg-primary/50"
              )}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
