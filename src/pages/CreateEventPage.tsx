import { AppLayout } from "@/components/layout/AppLayout";

export default function CreateEventPage() {
  return (
    <AppLayout title="New Event" showBack showNav={false}>
      <div className="p-4">
        <div className="rounded-lg border bg-card p-6 text-center">
          <p className="text-muted-foreground">
            Event creation form will be implemented in Phase 4
          </p>
        </div>
      </div>
    </AppLayout>
  );
}
