"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

type Judge = { id: string; name: string };
type Submission = { id: string; title: string };

export function AssignmentMatrix({
  judges,
  submissions,
  initial,
}: {
  judges: Judge[];
  submissions: Submission[];
  initial: string[]; // "judgeId:submissionId"
}) {
  const [assigned, setAssigned] = useState<Set<string>>(new Set(initial));
  const [pending, setPending] = useState<Set<string>>(new Set());

  async function toggle(judgeId: string, submissionId: string) {
    const key = `${judgeId}:${submissionId}`;
    const isOn = assigned.has(key);
    setPending((p) => new Set(p).add(key));
    const res = await fetch("/api/admin/assignments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        judgeId,
        submissionId,
        action: isOn ? "remove" : "add",
      }),
    });
    const data = await res.json();
    setPending((p) => {
      const n = new Set(p);
      n.delete(key);
      return n;
    });
    if (!data.ok) {
      toast.error(data.error ?? "操作失败");
      return;
    }
    setAssigned((s) => {
      const n = new Set(s);
      if (isOn) n.delete(key);
      else n.add(key);
      return n;
    });
  }

  if (submissions.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">暂无作品可分配。</p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr>
            <th className="sticky left-0 z-10 bg-white p-3 text-left">作品</th>
            {judges.map((j) => (
              <th key={j.id} className="p-3 text-center font-medium">
                {j.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {submissions.map((s) => (
            <tr key={s.id} className="border-t">
              <td className="sticky left-0 z-10 bg-white p-3 font-medium">
                {s.title}
              </td>
              {judges.map((j) => {
                const key = `${j.id}:${s.id}`;
                const on = assigned.has(key);
                const busy = pending.has(key);
                return (
                  <td key={j.id} className="p-3 text-center">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => toggle(j.id, s.id)}
                      className="inline-flex h-6 w-6 items-center justify-center"
                    >
                      {busy ? (
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      ) : (
                        <span
                          className={
                            on
                              ? "flex h-5 w-5 items-center justify-center rounded border-2 border-brand bg-brand text-white"
                              : "h-5 w-5 rounded border-2 border-muted-foreground/30"
                          }
                        >
                          {on ? "✓" : ""}
                        </span>
                      )}
                    </button>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
