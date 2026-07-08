import { describe, it, expect } from "vitest";
import { rankPopular, remainingBudget, type RankablePopular } from "./likes";

function make(
  projectId: string,
  likeCount: number,
  createdAtMs: number
): RankablePopular {
  return {
    projectId,
    title: projectId,
    tagline: "t",
    track: "AI智能体赛道",
    ownerName: "owner",
    likeCount,
    createdAt: new Date(createdAtMs),
  };
}

describe("remainingBudget", () => {
  it("正常剩余", () => {
    expect(remainingBudget(10, 3)).toBe(7);
  });

  it("用尽为 0", () => {
    expect(remainingBudget(10, 10)).toBe(0);
  });

  it("超额不为负", () => {
    expect(remainingBudget(5, 8)).toBe(0);
  });
});

describe("rankPopular", () => {
  it("按票数降序排名", () => {
    const ranked = rankPopular([
      make("a", 3, 1),
      make("b", 8, 2),
      make("c", 5, 3),
    ]);
    expect(ranked.map((r) => r.projectId)).toEqual(["b", "c", "a"]);
    expect(ranked.map((r) => r.rank)).toEqual([1, 2, 3]);
  });

  it("票数相同按创建时间升序（更早在前）", () => {
    const ranked = rankPopular([
      make("late", 5, 200),
      make("early", 5, 100),
    ]);
    expect(ranked.map((r) => r.projectId)).toEqual(["early", "late"]);
  });

  it("过滤掉 0 票项目", () => {
    const ranked = rankPopular([make("a", 0, 1), make("b", 2, 2)]);
    expect(ranked.map((r) => r.projectId)).toEqual(["b"]);
  });

  it("全 0 票返回空", () => {
    expect(rankPopular([make("a", 0, 1), make("b", 0, 2)])).toEqual([]);
  });
});
