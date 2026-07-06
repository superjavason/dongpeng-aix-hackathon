import { requireRole } from "@/lib/session";
import { ConsoleHeader } from "@/components/layout/console-header";
import { AdminNav } from "@/components/layout/admin-nav";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole("admin");
  return (
    <div className="min-h-screen bg-neutral-50">
      <ConsoleHeader title="AI+X黑客松大赛" accent="管理员后台" />
      <AdminNav />
      {children}
    </div>
  );
}
