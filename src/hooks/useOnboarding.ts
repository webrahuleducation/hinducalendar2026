import { useState, useCallback } from "react";

export function useOnboarding() {
  const [completed, setCompleted] = useState<boolean>(() => {
    return localStorage.getItem("onboardingCompleted") === "true";
  });

  const finishOnboarding = useCallback(() => {
    localStorage.setItem("onboardingCompleted", "true");
    setCompleted(true);
  }, []);

  return { completed, finishOnboarding };
}
