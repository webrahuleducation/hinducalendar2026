import { AppLayout } from "@/components/layout/AppLayout";

export default function EventsPage() {
  return (
    <AppLayout title="My Events">
      <div className="p-4">
        <div className="rounded-lg border bg-card p-6 text-center">
          <p className="text-muted-foreground">
            Events management will be implemented in Phase 4
          </p>
        </div>
      </div>
    </AppLayout>
  );
}
