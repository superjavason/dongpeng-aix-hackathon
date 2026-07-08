"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type LikeButtonProps = {
  projectId: string;
  /** 是否已登录 */
  loggedIn: boolean;
  /** 当前用户是否为本人参与的项目（发起人或已通过成员），不可点赞 */
  isOwnProject: boolean;
  initialLiked: boolean;
  initialCount: number;
  initialRemaining: number;
  max: number;
};

export function LikeButton({
  projectId,
  loggedIn,
  isOwnProject,
  initialLiked,
  initialCount,
  initialRemaining,
  max,
}: LikeButtonProps) {
  const router = useRouter();
  const [liked, setLiked] = useState(initialLiked);
  const [count, setCount] = useState(initialCount);
  const [remaining, setRemaining] = useState(initialRemaining);
  const [loading, setLoading] = useState(false);

  // 未登录：引导登录
  if (!loggedIn) {
    return (
      <div className="space-y-2">
        <Button asChild variant="outline" size="lg" className="w-full">
          <Link href={`/login?callbackUrl=/projects/${projectId}`}>
            <Heart className="mr-1 h-4 w-4" /> 登录后为它点赞
          </Link>
        </Button>
        <p className="text-center text-xs text-muted-foreground">
          已获得 {count} 个赞
        </p>
      </div>
    );
  }

  // 本人参与的项目：只展示票数
  if (isOwnProject) {
    return (
      <div className="flex items-center justify-center gap-2 rounded-lg border bg-neutral-50 py-2.5 text-sm text-muted-foreground">
        <Heart className="h-4 w-4 fill-brand-red text-brand-red" />
        <span className="font-medium text-foreground">{count}</span> 人为它点赞
      </div>
    );
  }

  const exhausted = !liked && remaining <= 0;

  async function toggle() {
    setLoading(true);
    const res = await fetch(`/api/projects/${projectId}/like`, {
      method: liked ? "DELETE" : "POST",
      headers: { "Content-Type": "application/json" },
    });
    const data = await res.json();
    setLoading(false);
    if (!data.ok) {
      toast.error(data.error ?? "操作失败");
      return;
    }
    setLiked(data.data.liked);
    setCount(data.data.likeCount);
    setRemaining(data.data.remaining);
    toast.success(data.data.liked ? "已点赞" : "已取消点赞");
    router.refresh();
  }

  return (
    <div className="space-y-2">
      <Button
        size="lg"
        variant={liked ? "default" : "outline"}
        className="w-full"
        disabled={loading || exhausted}
        onClick={toggle}
      >
        <Heart
          className={cn("mr-1 h-4 w-4", liked && "fill-current")}
        />
        {liked ? "已点赞" : "点赞支持"} · {count}
      </Button>
      <p className="text-center text-xs text-muted-foreground">
        {exhausted ? (
          <span className="text-amber-600">
            本场赛事点赞额度已用尽（共 {max} 票）
          </span>
        ) : (
          <>本场赛事剩余 {remaining} / {max} 票</>
        )}
      </p>
    </div>
  );
}
