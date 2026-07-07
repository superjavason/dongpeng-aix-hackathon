import { requireRole } from "@/lib/session";
import { ConsoleHeader } from "@/components/layout/console-header";
import { AdminNav } from "@/components/layout/admin-nav";
import { EventSwitcher } from "@/components/admin/event-switcher";
import { listEvents, getAdminEvent } from "@/lib/event";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole("admin");
  const [events, current] = await Promise.all([listEvents(), getAdminEvent()]);

  return (
    <div className="min-h-screen bg-neutral-50">
      <ConsoleHeader title="AI+X黑客松大赛" accent="管理员后台" />
      <AdminNav />
      <div className="border-b bg-neutral-50">
        <div className="container flex items-center py-2">
          <EventSwitcher
            events={events.map((e) => ({
              id: e.id,
              name: e.name,
              isActive: e.isActive,
            }))}
            currentId={current?.id ?? null}
          />
        </div>
      </div>
      {children}
    </div>
  );
}
