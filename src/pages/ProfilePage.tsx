import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User, Bell, Moon, Globe, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { profileService, Profile } from "@/services/profileService";
import { useToast } from "@/hooks/use-toast";

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;
    try {
      const data = await profileService.getProfile(user.id);
      if (data) {
        setProfile(data);
        setDarkMode(data.theme === "dark");
        setNotifications(data.notifications_enabled);
      }
    } catch (error) {
      console.error("Error loading profile:", error);
    }
  };

  const handleDarkModeToggle = async (enabled: boolean) => {
    setDarkMode(enabled);
    document.documentElement.classList.toggle("dark", enabled);
    if (user) {
      try {
        await profileService.updateProfile(user.id, { theme: enabled ? "dark" : "light" });
      } catch (error) {
        console.error("Error updating theme:", error);
      }
    }
  };

  const handleNotificationsToggle = async (enabled: boolean) => {
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
    toast({ title: "Signed out", description: "You have been signed out successfully" });
    navigate("/auth");
  };

  const displayName = profile?.display_name || user?.user_metadata?.full_name || user?.email || "Guest User";
  const avatarUrl = profile?.avatar_url || user?.user_metadata?.avatar_url;

  return (
    <AppLayout title="Profile & Settings">
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
                {user ? user.email : "Sign in to sync your data"}
              </p>
            </div>
          </CardHeader>
        </Card>

        {/* Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Preferences</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bell className="h-5 w-5 text-muted-foreground" />
                <Label htmlFor="notifications">Notifications</Label>
              </div>
              <Switch 
                id="notifications" 
                checked={notifications}
                onCheckedChange={handleNotificationsToggle}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Moon className="h-5 w-5 text-muted-foreground" />
                <Label htmlFor="dark-mode">Dark Mode</Label>
              </div>
              <Switch 
                id="dark-mode" 
                checked={darkMode}
                onCheckedChange={handleDarkModeToggle}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Globe className="h-5 w-5 text-muted-foreground" />
                <Label>Language</Label>
              </div>
              <Select defaultValue="en">
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="hi">हिंदी</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Sign In/Out */}
        {user ? (
          <Button variant="outline" className="w-full gap-2" onClick={handleSignOut}>
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        ) : (
          <Button className="w-full gap-2" onClick={() => navigate("/auth")}>
            Sign In with Google
          </Button>
        )}

        <p className="text-center text-xs text-muted-foreground">
          Hindu Vrat & Utsav Calendar 2026 • Version 1.0.0
        </p>
      </div>
    </AppLayout>
  );
}
