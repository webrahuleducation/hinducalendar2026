import { cn } from "@/lib/utils";
import CalendarOverview from "./CalendarOverview";
import { useLanguage } from "@/contexts/LanguageContext";

interface OnboardingSlide1Props {
  isVisible: boolean;
}

export default function OnboardingSlide1({ isVisible }: OnboardingSlide1Props) {
  const { t } = useLanguage();

  return (
    <div className={cn(
      "flex flex-col items-center gap-4 px-6 text-center transition-all duration-700",
      isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
    )}>
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary">
        <span className="font-devanagari text-4xl">ॐ</span>
      </div>
      <div className="space-y-1">
        <h1 className="font-serif text-2xl font-bold text-foreground sm:text-3xl">{t("splash.appTitle")}</h1>
        <h2 className="font-serif text-xl font-semibold text-gradient-saffron sm:text-2xl">{t("splash.appSubtitle")}</h2>
      </div>
      <CalendarOverview />
      <p className="max-w-xs text-sm text-muted-foreground">{t("splash.tagline")}</p>
    </div>
  );
}
