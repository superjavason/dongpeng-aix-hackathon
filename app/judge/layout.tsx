import { requireRole } from "@/lib/session";
import { ConsoleHeader } from "@/components/layout/console-header";

export const dynamic = "force-dynamic";

export default async function JudgeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireRole("judge");
  return (
    <div className="min-h-screen bg-neutral-50">
      <ConsoleHeader title="东鹏 AI+X 黑客松" accent="评委后台" />
      {children}
    </div>
  );
}
