import { prisma } from "@/lib/db";
import { getAdminEvent } from "@/lib/event";
import { Card, CardContent } from "@/components/ui/card";
import { AssignmentMatrix } from "@/components/admin/assignment-matrix";

export const dynamic = "force-dynamic";

export default async function AdminJudgesPage() {
  const event = await getAdminEvent();

  const [judges, submissions, assignments] = await Promise.all([
    prisma.user.findMany({
      where: { role: "judge" },
      select: { id: true, name: true },
      orderBy: { createdAt: "asc" },
    }),
    event
      ? prisma.submission.findMany({
          where: { project: { eventId: event.id } },
          select: { id: true, title: true },
          orderBy: { createdAt: "asc" },
        })
      : Promise.resolve([]),
    prisma.judgeAssignment.findMany({
      select: { judgeId: true, submissionId: true },
    }),
  ]);

  const initial = assignments.map((a) => `${a.judgeId}:${a.submissionId}`);

  return (
    <main className="container py-8">
      <h1 className="text-xl font-bold">评委管理</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        勾选「评委 × 作品」进行定向分配。
        <span className="font-medium text-foreground">
          某评委若没有任何分配，则默认可评审全部作品。
        </span>
        将用户设为评委请前往「用户管理」。
      </p>

      <Card className="mt-6">
        <CardContent className="p-4">
          {judges.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              当前没有评委，请先在「用户管理」中将用户角色设为评委。
            </p>
          ) : (
            <AssignmentMatrix
              judges={judges}
              submissions={submissions}
              initial={initial}
            />
          )}
        </CardContent>
      </Card>
    </main>
  );
}
