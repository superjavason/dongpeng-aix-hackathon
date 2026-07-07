import { getAdminEvent, getCriteria } from "@/lib/event";
import { EventSettings } from "@/components/admin/event-settings";

export const dynamic = "force-dynamic";

export default async function AdminEventPage() {
  const event = await getAdminEvent();

  if (!event) {
    return (
      <main className="container py-8">
        <p className="text-muted-foreground">当前没有活跃赛事。</p>
      </main>
    );
  }

  return (
    <main className="container max-w-3xl py-8">
      <h1 className="text-xl font-bold">赛事设置</h1>
      <p className="mt-1 text-sm text-muted-foreground">{event.name}</p>

      <div className="mt-6">
        <EventSettings
          key={event.id}
          eventId={event.id}
          phase={event.phase}
          criteria={getCriteria(event)}
          resultsPublished={event.resultsPublished}
        />
      </div>
    </main>
  );
}
