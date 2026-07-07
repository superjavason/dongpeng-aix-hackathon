import Link from "next/link";
import { Users, FolderKanban, Trophy, Gavel, Settings } from "lucide-react";
import { prisma } from "@/lib/db";
import { getAdminEvent } from "@/lib/event";
import { PHASE_LABELS } from "@/lib/constants";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function AdminHome() {
  const event = await getAdminEvent();

  const [
    userCount,
    judgeCount,
    projectCount,
    submissionCount,
    scoreCount,
    pendingCount,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: "judge" } }),
    prisma.project.count(event ? { where: { eventId: event.id } } : undefined),
    prisma.submission.count(
      event ? { where: { project: { eventId: event.id } } } : undefined
    ),
    prisma.score.count(),
    prisma.membership.count({ where: { status: "pending" } }),
  ]);

  const expectedScores = submissionCount * judgeCount;
  const scorePct =
    expectedScores > 0 ? Math.round((scoreCount / expectedScores) * 100) : 0;

  return (
    <main className="container py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold">数据看板</h1>
        {event && (
          <Badge variant="outline" className="text-sm">
            {event.name} · {PHASE_LABELS[event.phase]}
          </Badge>
        )}
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat icon={<Users />} label="注册用户" value={userCount} />
        <Stat icon={<Gavel />} label="评委" value={judgeCount} />
        <Stat icon={<FolderKanban />} label="提报项目" value={projectCount} />
        <Stat icon={<Trophy />} label="提交作品" value={submissionCount} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">评审进度</span>
              <span className="text-sm font-semibold">
                {scoreCount}/{expectedScores} 份评分
              </span>
            </div>
            <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-brand transition-all"
                style={{ width: `${scorePct}%` }}
              />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              完成度 {scorePct}%（按 作品数 × 评委数 估算）
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-between p-6">
            <div>
              <p className="text-sm text-muted-foreground">待审核报名</p>
              <p className="mt-1 text-3xl font-bold">{pendingCount}</p>
            </div>
            <Button asChild variant="outline">
              <Link href="/admin/projects">
                <Settings className="h-4 w-4" /> 赛事设置
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <Button asChild variant="outline">
          <Link href="/admin/users">管理用户</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/admin/judges">分配评委</Link>
        </Button>
        <Button asChild>
          <Link href="/admin/event">赛事阶段控制</Link>
        </Button>
      </div>
    </main>
  );
}

function Stat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-5">
        <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-brand-50 text-brand [&_svg]:h-5 [&_svg]:w-5">
          {icon}
        </div>
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}
