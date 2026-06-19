import { describe, it, expect } from "vitest";
import { computeTotal, averageScore } from "./scoring";
import type { Criterion } from "./constants";

const criteria: Criterion[] = [
  { key: "a", label: "A", weight: 50, max: 100 },
  { key: "b", label: "B", weight: 50, max: 100 },
];

describe("computeTotal", () => {
  it("满分得 100", () => {
    expect(computeTotal({ a: 100, b: 100 }, criteria)).toBe(100);
  });

  it("等权重取平均", () => {
    expect(computeTotal({ a: 80, b: 60 }, criteria)).toBe(70);
  });

  it("按权重加权", () => {
    const c: Criterion[] = [
      { key: "a", label: "A", weight: 70, max: 100 },
      { key: "b", label: "B", weight: 30, max: 100 },
    ];
    // 0.7*100 + 0.3*0 = 70
    expect(computeTotal({ a: 100, b: 0 }, c)).toBe(70);
  });

  it("不同满分归一化", () => {
    const c: Criterion[] = [{ key: "a", label: "A", weight: 100, max: 10 }];
    expect(computeTotal({ a: 5 }, c)).toBe(50);
  });

  it("缺失维度按 0 计", () => {
    expect(computeTotal({ a: 100 }, criteria)).toBe(50);
  });

  it("超界与非法值被裁剪", () => {
    expect(computeTotal({ a: 999, b: -10 }, criteria)).toBe(50);
    expect(computeTotal({ a: NaN, b: 100 } as never, criteria)).toBe(50);
  });

  it("空维度或零权重返回 0", () => {
    expect(computeTotal({ a: 100 }, [])).toBe(0);
    expect(
      computeTotal({ a: 100 }, [{ key: "a", label: "A", weight: 0, max: 100 }])
    ).toBe(0);
  });
});

describe("averageScore", () => {
  it("计算平均", () => {
    expect(averageScore([80, 90, 100])).toBe(90);
  });
  it("四舍五入到两位", () => {
    expect(averageScore([80, 81])).toBe(80.5);
    expect(averageScore([10, 20, 25])).toBeCloseTo(18.33, 2);
  });
  it("空数组返回 null", () => {
    expect(averageScore([])).toBeNull();
  });
});
