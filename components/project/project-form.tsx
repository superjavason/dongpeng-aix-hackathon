"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { TRACKS } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ImageUploader } from "@/components/upload/image-uploader";

function getText(form: FormData, key: string) {
  return String(form.get(key) ?? "").trim();
}

function buildDescription(form: FormData) {
  const sections = [
    ["项目介绍", getText(form, "description")],
    ["场景痛点", getText(form, "painPoint")],
    ["解决方案", getText(form, "solution")],
    ["预期价值", getText(form, "expectedValue")],
    ["需要支持", getText(form, "support")],
  ];

  return sections
    .filter(([, value]) => value)
    .map(([label, value]) => `【${label}】\n${value}`)
    .join("\n\n");
}

export function ProjectForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [track, setTrack] = useState<string>(TRACKS[0]);
  const [cover, setCover] = useState<string[]>([]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const form = new FormData(e.currentTarget);
    const payload = {
      title: getText(form, "title"),
      tagline: getText(form, "tagline"),
      description: buildDescription(form),
      track,
      maxMembers: form.get("maxMembers"),
      coverImageUrl: cover[0] ?? "",
    };
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    setLoading(false);
    if (!data.ok) {
      toast.error(data.error ?? "提报失败");
      return;
    }
    toast.success("项目提报成功");
    router.push(`/projects/${data.data.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-8">
      <section className="space-y-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand-red">
            Basic
          </p>
          <h2 className="mt-2 text-xl font-bold">基础信息</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            一句话简介会展示在项目广场，详细内容用于评审和队友了解项目。
          </p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="title">项目名称</Label>
          <Input
            id="title"
            name="title"
            required
            placeholder="例如：AI 智能门店巡检助手"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="tagline">一句话介绍（用于项目广场展示）</Label>
          <Input
            id="tagline"
            name="tagline"
            required
            placeholder="用一句话说清项目解决什么问题、带来什么价值"
          />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>参赛赛道</Label>
            <Select value={track} onValueChange={setTrack}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TRACKS.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="maxMembers">队伍人数上限</Label>
            <Input
              id="maxMembers"
              name="maxMembers"
              type="number"
              min={1}
              max={5}
              defaultValue={5}
              required
            />
          </div>
        </div>
      </section>

      <section className="space-y-5 border-t pt-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand-red">
            Scenario
          </p>
          <h2 className="mt-2 text-xl font-bold">业务场景</h2>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="description">项目介绍</Label>
          <Textarea
            id="description"
            name="description"
            required
            rows={3}
            placeholder="用 1-2 句话介绍你的项目是什么，适合谁使用。"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="painPoint">解决什么场景痛点</Label>
          <Textarea
            id="painPoint"
            name="painPoint"
            required
            rows={4}
            placeholder="写清楚真实业务场景、当前问题、影响范围或效率损耗。"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="solution">初步解决方案</Label>
          <Textarea
            id="solution"
            name="solution"
            required
            rows={4}
            placeholder="说明计划如何使用 AI、数据、流程或工具完成解决。"
          />
        </div>
      </section>

      <section className="space-y-5 border-t pt-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-brand-red">
            Value
          </p>
          <h2 className="mt-2 text-xl font-bold">落地价值</h2>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="expectedValue">预期价值</Label>
          <Textarea
            id="expectedValue"
            name="expectedValue"
            required
            rows={4}
            placeholder="例如：降本增效、体验提升、流程优化、风险降低、可复制推广等。"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="support">需要的资源支持（选填）</Label>
          <Textarea
            id="support"
            name="support"
            rows={3}
            placeholder="可以写需要的数据、业务专家、系统权限、设备或协作资源。"
          />
        </div>

        <div className="space-y-1.5">
          <Label>项目封面（选填）</Label>
          <ImageUploader value={cover} onChange={setCover} max={1} />
        </div>
      </section>

      <Button type="submit" size="lg" disabled={loading} className="w-full sm:w-auto">
        {loading ? "提交中..." : "提交项目"}
      </Button>
    </form>
  );
}
