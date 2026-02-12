import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { User, Bell, Moon, Globe, LogOut, Calendar, AlertCircle, CheckCircle, Clock } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { profileService, Profile } from "@/services/profileService";
import { useNotifications } from "@/hooks/useNotifications";
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
  const { permissionStatus, isSupported, requestPermission, scheduledNotifications } = useNotifications();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [notifications, setNotifications] = useState(true);

  useEffect(() => {
    if (user) loadProfile();
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;
    try {
      const data = await profileService.getProfile(user.id);
      if (data) {
        setProfile(data);
        setNotifications(data.notifications_enabled);
      }
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

  const handleNotificationsToggle = async (enabled: boolean) => {
    if (enabled && permissionStatus !== "granted") {
      const granted = await requestPermission();
      if (!granted) {
        toast({ title: t("profile.notifBlocked"), variant: "destructive" });
        return;
      }
    }
    setNotifications(enabled);
    if (user) {
      try {
        await profileService.updateProfile(user.id, { notifications_enabled: enabled });
      } catch (error) {
        console.error("Error updating notifications:", error);
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

        {/* Notification Settings */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              {t("profile.notifications")}
            </CardTitle>
            <CardDescription className="text-sm">
              {scheduledNotifications.length > 0
                ? `${scheduledNotifications.length} ${t("profile.remindersScheduled")}`
                : t("profile.noReminders")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="notifications">{t("profile.enableNotifications")}</Label>
                <p className="text-xs text-muted-foreground">{t("profile.notifDesc")}</p>
              </div>
              <Switch id="notifications" checked={notifications} onCheckedChange={handleNotificationsToggle} disabled={!isSupported} />
            </div>
            <div className="flex items-center gap-2 text-sm">
              {permissionStatus === "granted" ? (
                <><CheckCircle className="h-4 w-4 text-green-600" /><span className="text-muted-foreground">{t("profile.notifAllowed")}</span></>
              ) : permissionStatus === "denied" ? (
                <><AlertCircle className="h-4 w-4 text-destructive" /><span className="text-muted-foreground">{t("profile.notifBlocked")}</span></>
              ) : permissionStatus === "unsupported" ? (
                <><AlertCircle className="h-4 w-4 text-muted-foreground" /><span className="text-muted-foreground">{t("profile.notifUnsupported")}</span></>
              ) : (
                <Button variant="outline" size="sm" onClick={requestPermission} className="gap-2">
                  <Bell className="h-4 w-4" />{t("profile.enableNotifications")}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Preferences */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{t("profile.preferences")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Dark Mode with animation */}
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

            {/* Language */}
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

            {/* Time Format */}
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

        {/* Calendar Integration */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              {t("profile.calendarIntegration")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">{t("profile.calendarDesc")}</p>
            <Badge variant="secondary" className="gap-1">
              <CheckCircle className="h-3 w-3" />
              {t("profile.icalSupported")}
            </Badge>
          </CardContent>
        </Card>

        {/* Sign In/Out */}
        {user ? (
          <Button variant="outline" className="w-full gap-2" onClick={handleSignOut}>
            <LogOut className="h-4 w-4" />{t("profile.signOut")}
          </Button>
        ) : (
          <Button className="w-full gap-2" onClick={() => navigate("/auth")}>
            {t("profile.signIn")}
          </Button>
        )}

        <p className="text-center text-xs text-muted-foreground">{t("app.version")}</p>
      </div>
    </AppLayout>
  );
}
