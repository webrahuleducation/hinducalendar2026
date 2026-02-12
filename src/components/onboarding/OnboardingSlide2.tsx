import { cn } from "@/lib/utils";
import { User } from "lucide-react";

interface OnboardingSlide2Props {
  isVisible: boolean;
}

export default function OnboardingSlide2({ isVisible }: OnboardingSlide2Props) {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center gap-3 px-4 text-center min-h-[70vh] transition-all duration-700",
      isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
    )}>
      {/* Profile Image Placeholder */}
      <div className="relative flex-shrink-0">
        <div className="h-32 w-32 sm:h-36 sm:w-36 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 border-4 border-primary/30 flex items-center justify-center overflow-hidden shadow-spiritual">
          <img src="/images/krishnatiwari.png" alt="SMT. Krishna Tiwari" className="h-full w-full object-cover" />
          <User className="h-20 w-20 text-primary/50" />
        </div>
      </div>

      {/* Name */}
      <h2 className="font-serif text-2xl sm:text-3xl font-bold text-foreground mt-2">
        SMT. KRISHNA TIWARI
      </h2>

      {/* Qualification */}
      <p className="text-xs sm:text-sm text-muted-foreground font-medium tracking-wide max-w-xs">
        M.Sc, M.Ed, P.G.D.Ed.M, D.D.H.M, & D.FS.M
      </p>

      {/* Designation */}
      <p className="text-base sm:text-lg font-semibold text-primary">
        Jt. Secretary - Rahul Education
      </p>

      {/* Quote */}
      <div className="mt-3 w-full max-w-sm bg-card/80 backdrop-blur-sm rounded-xl p-5 shadow-spiritual border border-border/50">
        <p className="text-sm sm:text-base italic text-foreground leading-relaxed">
          "Do everything you have to do, but not with greed, not with ego, not with lust, not with envy, but with love, compassion, humility, and devotion."
        </p>
        <p className="mt-3 text-sm sm:text-base font-bold text-gradient-saffron">
          — Lord Krishna
        </p>
      </div>
    </div>
  );
}
