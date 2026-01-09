import { useState, useEffect, useCallback } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function useInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if already installed (standalone mode)
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;
    
    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    const handleBeforeInstall = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Save the event for triggering later
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
      console.log("PWA was installed");
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const promptInstall = useCallback(async () => {
    if (!deferredPrompt) {
      console.log("No install prompt available");
      return false;
    }

    try {
      // Show the install prompt
      await deferredPrompt.prompt();
      // Wait for the user's response
      const { outcome } = await deferredPrompt.userChoice;
      console.log("User response to install prompt:", outcome);
      
      if (outcome === "accepted") {
        setIsInstalled(true);
        setIsInstallable(false);
      }
      
      // Clear the prompt - it can only be used once
      setDeferredPrompt(null);
      return outcome === "accepted";
    } catch (error) {
      console.error("Install prompt failed:", error);
      return false;
    }
  }, [deferredPrompt]);

  // iOS detection for manual install instructions
  const isIOS = typeof navigator !== "undefined" && /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isInStandaloneMode = typeof window !== "undefined" && (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as any).standalone === true
  );

  return {
    isInstallable,
    isInstalled,
    promptInstall,
    isIOS,
    isInStandaloneMode,
    showIOSInstructions: isIOS && !isInStandaloneMode && !isInstalled,
  };
}
