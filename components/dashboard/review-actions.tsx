"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function ReviewActions({ membershipId }: { membershipId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function review(status: "approved" | "rejected") {
    setLoading(true);
    const res = await fetch(`/api/memberships/${membershipId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const data = await res.json();
    setLoading(false);
    if (!data.ok) {
      toast.error(data.error ?? "操作失败");
      return;
    }
    toast.success(status === "approved" ? "已通过报名" : "已拒绝报名");
    router.refresh();
  }

  return (
    <div className="flex gap-2">
      <Button
        size="sm"
        onClick={() => review("approved")}
        disabled={loading}
      >
        <Check /> 通过
      </Button>
      <Button
        size="sm"
        variant="outline"
        onClick={() => review("rejected")}
        disabled={loading}
      >
        <X /> 拒绝
      </Button>
    </div>
  );
}
