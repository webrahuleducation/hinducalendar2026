import { AppLayout } from "@/components/layout/AppLayout";
import { FloatingActionButton } from "@/components/layout/FloatingActionButton";
import { useNavigate } from "react-router-dom";

export default function CalendarPage() {
  const navigate = useNavigate();

  const handleAddEvent = () => {
    navigate("/event/new");
  };

  return (
    <AppLayout title="Hindu Calendar 2026">
      <div className="p-4">
        <div className="rounded-lg border bg-card p-6 text-center">
          <p className="text-muted-foreground">
            Calendar view will be implemented in Phase 2
          </p>
        </div>
      </div>
      
      <FloatingActionButton onClick={handleAddEvent} />
    </AppLayout>
  );
}
