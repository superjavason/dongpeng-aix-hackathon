import { describe, it, expect } from "vitest";
import { resolveAdminEvent, type EventLike } from "./event";

const events: EventLike[] = [
  { id: "c", isActive: false }, // 最近
  { id: "b", isActive: true },
  { id: "a", isActive: false },
];

describe("resolveAdminEvent", () => {
  it("cookie 命中则返回该场", () => {
    expect(resolveAdminEvent("a", events)?.id).toBe("a");
  });

  it("cookie 失效则回落到活跃场", () => {
    expect(resolveAdminEvent("zzz", events)?.id).toBe("b");
  });

  it("无 cookie 则回落到活跃场", () => {
    expect(resolveAdminEvent(null, events)?.id).toBe("b");
  });

  it("无活跃场则回落到最近创建（第 0 个）", () => {
    const noActive: EventLike[] = [
      { id: "c", isActive: false },
      { id: "a", isActive: false },
    ];
    expect(resolveAdminEvent(undefined, noActive)?.id).toBe("c");
  });

  it("空列表返回 null", () => {
    expect(resolveAdminEvent("a", [])).toBeNull();
  });
});
