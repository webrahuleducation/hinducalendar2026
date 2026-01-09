import { cn } from "@/lib/utils";
import { User } from "lucide-react";

interface OnboardingSlide2Props {
  isVisible: boolean;
}

export default function OnboardingSlide2({ isVisible }: OnboardingSlide2Props) {
  return (
    <div className={cn(
      "flex flex-col items-center gap-4 px-6 text-center transition-all duration-700",
      isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
    )}>
      {/* Profile Image Placeholder */}
      <div className="relative">
        <div className="h-28 w-28 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 border-4 border-primary/30 flex items-center justify-center overflow-hidden shadow-spiritual">
          {/* Replace this with actual image: <img src="/path-to-image.jpg" alt="Krishna Tiwari" className="h-full w-full object-cover" /> */}
          <User className="h-16 w-16 text-primary/50" />
        </div>
        <div className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full bg-accent flex items-center justify-center shadow-lg">
          <span className="font-devanagari text-sm">🙏</span>
        </div>
      </div>
      
      {/* Name */}
      <h2 className="font-serif text-xl font-bold text-foreground sm:text-2xl">
        SMT. KRISHNA TIWARI
      </h2>
      
      {/* Qualification */}
      <p className="text-xs text-muted-foreground font-medium tracking-wide">
        M.Sc, M.Ed, P.G.D.Ed.M, D.D.H.M, & D.FS.M
      </p>
      
      {/* Designation */}
      <p className="text-sm font-semibold text-primary">
        Jt. Secretary - Rahul Education
      </p>
      
      {/* Quote */}
      <div className="mt-2 max-w-xs bg-card/80 backdrop-blur-sm rounded-lg p-4 shadow-spiritual border border-border/50">
        <p className="text-xs italic text-foreground leading-relaxed">
          "Do everything you have to do, but not with greed, not with ego, not with lust, not with envy, but with love, compassion, humility, and devotion."
        </p>
        <p className="mt-2 text-xs font-semibold text-gradient-saffron">
          — Lord Krishna
        </p>
      </div>
    </div>
  );
}
