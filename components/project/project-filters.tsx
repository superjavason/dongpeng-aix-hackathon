"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { TRACKS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type ProjectFiltersProps = {
  q?: string;
  track?: string;
  status?: string;
};

const STATUS_OPTIONS = [
  { value: "all", label: "全部状态" },
  { value: "recruiting", label: "招募中" },
  { value: "full", label: "已满员" },
];

export function ProjectFilters({ q, track, status }: ProjectFiltersProps) {
  const router = useRouter();
  const [keyword, setKeyword] = useState(q ?? "");
  const currentTrack = track ?? "all";
  const currentStatus = status ?? "all";

  function buildHref(next: {
    q?: string;
    track?: string;
    status?: string;
  }) {
    const params = new URLSearchParams();
    const nextQ = next.q ?? keyword;
    const nextTrack = next.track ?? currentTrack;
    const nextStatus = next.status ?? currentStatus;

    if (nextQ.trim()) params.set("q", nextQ.trim());
    if (nextTrack !== "all") params.set("track", nextTrack);
    if (nextStatus !== "all") params.set("status", nextStatus);

    return `/projects${params.toString() ? `?${params}` : ""}`;
  }

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    router.push(buildHref({ q: keyword }));
  }

  return (
    <form
      className="mt-6 grid gap-3 rounded-xl border bg-white p-3 shadow-sm sm:grid-cols-[minmax(220px,1fr)_220px_160px_auto]"
      onSubmit={submitSearch}
    >
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
          placeholder="搜索项目名称..."
          className="pl-9"
        />
      </div>

      <select
        aria-label="筛选赛道"
        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        value={currentTrack}
        onChange={(event) => router.push(buildHref({ track: event.target.value }))}
      >
        <option value="all">全部赛道</option>
        {TRACKS.map((trackName) => (
          <option key={trackName} value={trackName}>
            {trackName}
          </option>
        ))}
      </select>

      <select
        aria-label="筛选状态"
        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        value={currentStatus}
        onChange={(event) => router.push(buildHref({ status: event.target.value }))}
      >
        {STATUS_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      <Button type="submit">搜索</Button>
    </form>
  );
}
