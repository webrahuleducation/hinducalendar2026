import { Calendar, Star, BookOpen, User } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLanguage } from "@/contexts/LanguageContext";

interface NavItemProps {
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}

const NavItem = ({ to, icon: Icon, label }: NavItemProps) => (
  <NavLink
    to={to}
    className="flex flex-col items-center gap-1 px-3 py-2 text-muted-foreground transition-colors"
    activeClassName="text-primary"
    aria-label={label}
  >
    <Icon className="h-5 w-5" aria-hidden="true" />
    <span className="text-xs font-medium">{label}</span>
  </NavLink>
);

export function BottomNav() {
  const { t } = useLanguage();

  const navItems: NavItemProps[] = [
    { to: "/calendar", icon: Calendar, label: t("nav.calendar") },
    { to: "/events", icon: Star, label: t("nav.myEvents") },
    { to: "/library", icon: BookOpen, label: t("nav.library") },
    { to: "/profile", icon: User, label: t("nav.profile") },
  ];

  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 z-50 border-t bg-card/95 backdrop-blur-sm safe-area-pb"
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="flex items-center justify-around">
        {navItems.map((item) => (
          <NavItem key={item.to} {...item} />
        ))}
      </div>
    </nav>
  );
}
