import { useParams } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>();

  return (
    <AppLayout title="Event Details" showBack>
      <div className="p-4">
        <div className="rounded-lg border bg-card p-6 text-center">
          <p className="text-muted-foreground">
            Event ID: {id}
          </p>
          <p className="text-muted-foreground">
            Event details will be implemented in Phase 3
          </p>
        </div>
      </div>
    </AppLayout>
  );
}
