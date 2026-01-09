import { ReactNode } from "react";
import { BottomNav } from "./BottomNav";
import { Header } from "./Header";
import { cn } from "@/lib/utils";

interface AppLayoutProps {
  children: ReactNode;
  title?: string;
  showBack?: boolean;
  showNav?: boolean;
  showHeader?: boolean;
  headerRight?: ReactNode;
  className?: string;
}

export function AppLayout({
  children,
  title,
  showBack = false,
  showNav = true,
  showHeader = true,
  headerRight,
  className,
}: AppLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {showHeader && (
        <Header title={title} showBack={showBack} rightElement={headerRight} />
      )}
      
      <main 
        className={cn(
          "flex-1",
          showNav && "pb-16", // Space for bottom navigation
          className
        )}
        role="main"
        aria-label={title || "Main content"}
      >
        {children}
      </main>
      
      {showNav && <BottomNav />}
    </div>
  );
}
