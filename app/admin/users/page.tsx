import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/session";
import { ROLE_LABELS } from "@/lib/constants";
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
import { UserRowActions } from "@/components/admin/user-row-actions";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const me = await getSessionUser();
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      disabled: true,
    },
  });

  return (
    <main className="container py-8">
      <h1 className="text-xl font-bold">用户管理</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        共 {users.length} 名用户 · 可调整角色或禁用账号
      </p>

      <Card className="mt-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>姓名</TableHead>
              <TableHead>邮箱</TableHead>
              <TableHead>角色</TableHead>
              <TableHead>状态</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((u) => (
              <TableRow key={u.id}>
                <TableCell className="font-medium">{u.name}</TableCell>
                <TableCell className="text-muted-foreground">{u.email ?? "—"}</TableCell>
                <TableCell>
                  <Badge
                    variant={
                      u.role === "admin"
                        ? "default"
                        : u.role === "judge"
                          ? "secondary"
                          : "outline"
                    }
                  >
                    {ROLE_LABELS[u.role]}
                  </Badge>
                </TableCell>
                <TableCell>
                  {u.disabled ? (
                    <Badge variant="muted">已禁用</Badge>
                  ) : (
                    <Badge variant="success">正常</Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <UserRowActions
                    userId={u.id}
                    role={u.role}
                    disabled={u.disabled}
                    isSelf={u.id === me?.id}
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
