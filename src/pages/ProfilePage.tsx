import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { User, Bell, Moon, Globe, LogOut } from "lucide-react";

export default function ProfilePage() {
  return (
    <AppLayout title="Profile & Settings">
      <div className="space-y-4 p-4">
        {/* User Profile Section */}
        <Card>
          <CardHeader className="flex flex-row items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <User className="h-8 w-8 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Guest User</CardTitle>
              <p className="text-sm text-muted-foreground">
                Sign in to sync your data
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
              <Switch id="notifications" />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Moon className="h-5 w-5 text-muted-foreground" />
                <Label htmlFor="dark-mode">Dark Mode</Label>
              </div>
              <Switch id="dark-mode" />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Globe className="h-5 w-5 text-muted-foreground" />
                <Label>Language</Label>
              </div>
              <span className="text-sm text-muted-foreground">English</span>
            </div>
          </CardContent>
        </Card>

        {/* Sign Out */}
        <Button variant="outline" className="w-full gap-2">
          <LogOut className="h-4 w-4" />
          Sign Out
        </Button>

        <p className="text-center text-xs text-muted-foreground">
          Hindu Vrat & Utsav Calendar 2026 • Version 1.0.0
        </p>
      </div>
    </AppLayout>
  );
}
