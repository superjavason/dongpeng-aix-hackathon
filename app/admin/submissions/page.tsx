import { prisma } from "@/lib/db";
import { getAdminEvent } from "@/lib/event";
import { averageScore } from "@/lib/scoring";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { DeleteButton } from "@/components/admin/delete-button";

export const dynamic = "force-dynamic";

export default async function AdminSubmissionsPage() {
  const event = await getAdminEvent();
  const submissions = event
    ? await prisma.submission.findMany({
        where: { project: { eventId: event.id } },
        include: {
          project: { select: { title: true, track: true } },
          scores: { select: { total: true } },
        },
        orderBy: { updatedAt: "desc" },
      })
    : [];

  return (
    <main className="container py-8">
      <h1 className="text-xl font-bold">作品管理</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        共 {submissions.length} 份作品
      </p>

      <Card className="mt-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>作品</TableHead>
              <TableHead>项目 / 赛道</TableHead>
              <TableHead>已评数</TableHead>
              <TableHead>当前均分</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {submissions.map((s) => {
              const avg = averageScore(s.scores.map((x) => x.total));
              return (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.title}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {s.project.title} · {s.project.track}
                  </TableCell>
                  <TableCell>{s.scores.length}</TableCell>
                  <TableCell>
                    {avg === null ? (
                      <span className="text-muted-foreground">—</span>
                    ) : (
                      <Badge variant="secondary">{avg}</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <DeleteButton
                      endpoint={`/api/admin/submissions/${s.id}`}
                      label="删除作品"
                      description={`确认删除作品「${s.title}」？相关评分将一并删除。`}
                    />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>
    </main>
  );
}
