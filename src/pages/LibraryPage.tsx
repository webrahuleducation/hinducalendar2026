import { AppLayout } from "@/components/layout/AppLayout";

export default function LibraryPage() {
  return (
    <AppLayout title="Festival Library">
      <div className="p-4">
        <div className="rounded-lg border bg-card p-6 text-center">
          <p className="text-muted-foreground">
            Predefined events library will be implemented in Phase 3
          </p>
        </div>
      </div>
    </AppLayout>
  );
}
