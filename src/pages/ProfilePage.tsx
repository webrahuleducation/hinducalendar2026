import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User, Moon, Globe, LogOut, LogIn, Clock, Shield, FileText, Sparkles, CalendarDays, BellRing } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { profileService, Profile } from "@/services/profileService";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "@/contexts/ThemeContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTimeFormat } from "@/contexts/TimeFormatContext";


export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const { theme, toggleTheme, setTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const { timeFormat, setTimeFormat } = useTimeFormat();
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    if (user) loadProfile();
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;
    try {
      const data = await profileService.getProfile(user.id);
      if (data) setProfile(data);
    } catch (error) {
      console.error("Error loading profile:", error);
    }
  };

  const handleDarkModeToggle = async (enabled: boolean) => {
    setTheme(enabled ? "dark" : "light");
    if (user) {
      try {
        await profileService.updateProfile(user.id, { theme: enabled ? "dark" : "light" });
      } catch (error) {
        console.error("Error updating theme:", error);
      }
    }
  };

  const handleSignOut = async () => {
    await signOut();
    toast({ title: t("profile.signOut"), description: t("profile.signOutSuccess") });
    navigate("/");
  };

  const displayName = profile?.display_name || user?.user_metadata?.full_name || user?.email || t("profile.guest");
  const avatarUrl = profile?.avatar_url || user?.user_metadata?.avatar_url;

  return (
    <AppLayout title={t("profile.title")}>
      <div className="space-y-4 p-4 pb-20">
        {/* User Profile Section */}
        <Card>
          <CardHeader className="flex flex-row items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={avatarUrl} />
              <AvatarFallback className="bg-primary/10">
                <User className="h-8 w-8 text-primary" />
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <CardTitle className="text-lg">{displayName}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {user ? user.email : t("profile.signInSync")}
              </p>
            </div>
          </CardHeader>
        </Card>

        {/* Preferences */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{t("profile.preferences")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Moon className={`h-5 w-5 text-muted-foreground transition-all duration-300 ${theme === "dark" ? "rotate-0 scale-100" : "rotate-90 scale-75"}`} />
                </div>
                <Label htmlFor="dark-mode">{t("profile.darkMode")}</Label>
              </div>
              <Switch
                id="dark-mode"
                checked={theme === "dark"}
                onCheckedChange={handleDarkModeToggle}
                className="transition-all duration-300"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Globe className="h-5 w-5 text-muted-foreground" />
                <Label>{t("profile.language")}</Label>
              </div>
              <Select value={language} onValueChange={(v) => setLanguage(v as "en" | "hi")}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="hi">हिंदी</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <Label>{t("profile.timeFormat")}</Label>
              </div>
              <Select value={timeFormat} onValueChange={(v) => setTimeFormat(v as "12h" | "24h")}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="12h">{t("profile.12hour")}</SelectItem>
                  <SelectItem value="24h">{t("profile.24hour")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Quick tips / onboarding recap */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Getting the most out of the app
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-start gap-3">
              <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <p className="text-muted-foreground">
                Browse every Vrat and Utsav for 2026 on the Calendar. Tap any date to view its full significance.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <BellRing className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <p className="text-muted-foreground">
                Add your own events under My Events with a reminder time — we'll notify you 30, 10 and 1 minute before.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <Globe className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <p className="text-muted-foreground">
                Switch between English and हिंदी any time. Your preference stays saved on this device.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* About & legal */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">About</CardTitle>
          </CardHeader>
          <CardContent className="divide-y">
            <button
              onClick={() => navigate("/privacy")}
              className="flex w-full items-center justify-between py-3 text-left text-sm hover:text-primary"
            >
              <span className="flex items-center gap-3">
                <Shield className="h-4 w-4 text-muted-foreground" />
                {t("auth.privacyPolicy")}
              </span>
              <span className="text-muted-foreground">›</span>
            </button>
            <button
              onClick={() => navigate("/terms")}
              className="flex w-full items-center justify-between py-3 text-left text-sm hover:text-primary"
            >
              <span className="flex items-center gap-3">
                <FileText className="h-4 w-4 text-muted-foreground" />
                {t("auth.termsOfService")}
              </span>
              <span className="text-muted-foreground">›</span>
            </button>
          </CardContent>
        </Card>

        {/* Sign In/Out */}
        {user ? (
          <Button
            variant="destructive"
            size="lg"
            className="w-full gap-2 font-semibold"
            onClick={handleSignOut}
          >
            <LogOut className="h-5 w-5" />
            {t("profile.signOut")}
          </Button>
        ) : (
          <Button
            size="lg"
            className="w-full gap-2 font-semibold"
            onClick={() => navigate("/auth")}
          >
            <LogIn className="h-5 w-5" />
            {t("profile.signIn")}
          </Button>
        )}

        <p className="text-center text-xs text-muted-foreground">{t("app.version")}</p>
      </div>
    </AppLayout>
  );
}
