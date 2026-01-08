import { useParams } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";

export default function DayDetailPage() {
  const { date } = useParams<{ date: string }>();

  return (
    <AppLayout title={date || "Day Details"} showBack>
      <div className="p-4">
        <div className="rounded-lg border bg-card p-6 text-center">
          <p className="text-muted-foreground">
            Day detail view will be implemented in Phase 3
          </p>
        </div>
      </div>
    </AppLayout>
  );
}
