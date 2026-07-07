import Link from "next/link";
import { listEvents, getAdminEvent } from "@/lib/event";
import { PHASE_LABELS } from "@/lib/constants";
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
import { Button } from "@/components/ui/button";
import { DeleteButton } from "@/components/admin/delete-button";
import {
  EventCreateDialog,
  SetActiveButton,
} from "@/components/admin/event-create-dialog";

export const dynamic = "force-dynamic";

export default async function AdminEventsPage() {
  const [events, current] = await Promise.all([listEvents(), getAdminEvent()]);

  return (
    <main className="container py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">赛事管理</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            共 {events.length} 场赛事。公众端展示「活跃」赛事，后台各页展示「当前管理」赛事。
          </p>
        </div>
        <EventCreateDialog />
      </div>

      <Card className="mt-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>赛事</TableHead>
              <TableHead>阶段</TableHead>
              <TableHead>状态</TableHead>
              <TableHead>项目数</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {events.map((e) => (
              <TableRow key={e.id}>
                <TableCell className="font-medium">
                  {e.name}
                  {current?.id === e.id && (
                    <Badge variant="muted" className="ml-2">
                      管理中
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {PHASE_LABELS[e.phase]}
                </TableCell>
                <TableCell>
                  {e.isActive ? (
                    <Badge variant="success">活跃</Badge>
                  ) : (
                    <Badge variant="muted">未上线</Badge>
                  )}
                </TableCell>
                <TableCell>{e._count.projects}</TableCell>
                <TableCell className="flex items-center justify-end gap-2">
                  <Button size="sm" variant="outline" asChild>
                    <Link href="/admin/event">管理</Link>
                  </Button>
                  <SetActiveButton eventId={e.id} isActive={e.isActive} />
                  <DeleteButton
                    endpoint={`/api/admin/event/${e.id}`}
                    label="删除赛事"
                    description={`确认删除「${e.name}」？仅当赛事下没有项目时可删除。`}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </main>
  );
}
