import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function SplashScreen() {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Fade in animation
    const timer = setTimeout(() => setIsVisible(true), 100);
    
    // Auto-redirect after 4 seconds
    const redirectTimer = setTimeout(() => {
      navigate("/auth");
    }, 4000);

    return () => {
      clearTimeout(timer);
      clearTimeout(redirectTimer);
    };
  }, [navigate]);

  const handleGetStarted = () => {
    navigate("/auth");
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-gradient-sunset">
      {/* Decorative background elements */}
      <div className="absolute inset-0 bg-gradient-sunrise opacity-50" />
      <div className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
      <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-secondary/10 blur-3xl" />
      
      <div className={cn(
        "relative z-10 flex flex-col items-center gap-8 px-6 text-center transition-all duration-700",
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      )}>
        {/* Om Symbol / Decorative Icon */}
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary/10 text-primary">
          <span className="font-devanagari text-5xl">ॐ</span>
        </div>
        
        {/* App Title */}
        <div className="space-y-2">
          <h1 className="font-serif text-3xl font-bold text-foreground sm:text-4xl">
            Hindu Vrat & Utsav
          </h1>
          <h2 className="font-serif text-2xl font-semibold text-gradient-saffron sm:text-3xl">
            Calendar 2026
          </h2>
        </div>
        
        {/* Tagline */}
        <p className="max-w-xs text-muted-foreground">
          Your complete spiritual planner for festivals, fasting days, and sacred celebrations
        </p>
        
        {/* CTA Button */}
        <Button
          onClick={handleGetStarted}
          size="lg"
          className={cn(
            "mt-4 gap-2 rounded-full px-8 transition-all duration-500",
            isVisible ? "opacity-100 scale-100" : "opacity-0 scale-95"
          )}
          style={{ transitionDelay: "300ms" }}
        >
          Get Started
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
      
      {/* Footer */}
      <p className={cn(
        "absolute bottom-8 text-xs text-muted-foreground transition-opacity duration-700",
        isVisible ? "opacity-100" : "opacity-0"
      )}>
        Tap anywhere or wait to continue
      </p>
    </div>
  );
}
