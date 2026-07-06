import Link from "next/link";
import { prisma } from "@/lib/db";
import { getActiveEvent } from "@/lib/event";
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

export default async function AdminProjectsPage() {
  const event = await getActiveEvent();
  const projects = event
    ? await prisma.project.findMany({
        where: { eventId: event.id },
        include: {
          owner: { select: { name: true } },
          memberships: { select: { status: true } },
          submission: { select: { id: true } },
        },
        orderBy: { createdAt: "desc" },
      })
    : [];

  return (
    <main className="container py-8">
      <h1 className="text-xl font-bold">项目管理</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        共 {projects.length} 个项目
      </p>

      <Card className="mt-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>项目</TableHead>
              <TableHead>赛道</TableHead>
              <TableHead>发起人</TableHead>
              <TableHead>成员/待审</TableHead>
              <TableHead>作品</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {projects.map((p) => {
              const approved = p.memberships.filter(
                (m) => m.status === "approved"
              ).length;
              const pending = p.memberships.filter(
                (m) => m.status === "pending"
              ).length;
              return (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">
                    <Link href={`/admin/projects/${p.id}`} className="hover:underline">
                      {p.title}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{p.track}</TableCell>
                  <TableCell>{p.owner.name}</TableCell>
                  <TableCell>
                    {approved}/{p.maxMembers}
                    {pending > 0 && (
                      <Badge variant="warning" className="ml-2">
                        +{pending} 待审
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {p.submission ? (
                      <Badge variant="success">已提交</Badge>
                    ) : (
                      <Badge variant="muted">未提交</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <DeleteButton
                      endpoint={`/api/admin/projects/${p.id}`}
                      label="删除项目"
                      description={`确认删除「${p.title}」？该项目的报名、作品与评分将一并删除，且不可恢复。`}
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
