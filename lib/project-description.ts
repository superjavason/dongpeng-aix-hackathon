import {
  CheckCircle2,
  Lightbulb,
  Sparkles,
  Target,
  Users,
  type LucideIcon,
} from "lucide-react";

export type ProjectDescriptionSection = {
  label: string;
  content: string;
  helper: string;
  icon: LucideIcon;
  muted: boolean;
};

const SECTION_META = [
  ["项目介绍", Lightbulb, "项目是什么，面向谁使用。"],
  ["场景痛点", Target, "真实业务场景中的问题和影响。"],
  ["解决方案", Sparkles, "AI、数据、流程或工具的解决思路。"],
  ["预期价值", CheckCircle2, "效率、成本、体验、风险或推广价值。"],
  ["需要支持", Users, "推进项目所需的资源或协作。"],
] as const;

const emptyText = "提报时暂未单独填写该项。";

export function parseProjectDescription(
  description: string
): ProjectDescriptionSection[] {
  const matches = Array.from(
    description.matchAll(/【([^】]+)】\s*\n?([\s\S]*?)(?=\n\n【[^】]+】|$)/g)
  );

  if (matches.length === 0) {
    return SECTION_META.map(([label, icon, helper], index) => ({
      label,
      content: index === 0 ? description : emptyText,
      icon,
      helper,
      muted: index !== 0,
    }));
  }

  const sectionMap = new Map(
    matches.map((match) => [match[1].trim(), match[2].trim()])
  );

  return SECTION_META.map(([label, icon, helper]) => {
    const content = sectionMap.get(label);
    return {
      label,
      content: content || emptyText,
      icon,
      helper,
      muted: !content,
    };
  });
}
