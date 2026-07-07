import { describe, it, expect } from "vitest";
import { eventCreateSchema } from "./schemas";

describe("eventCreateSchema", () => {
  it("接受最小合法输入并默认 phase=draft", () => {
    const parsed = eventCreateSchema.parse({
      name: "第二届黑客松",
      description: "面向全体员工",
    });
    expect(parsed.phase).toBe("draft");
    expect(parsed.track).toBeUndefined();
  });

  it("name 少于 2 字符时拒绝", () => {
    const r = eventCreateSchema.safeParse({ name: "x", description: "有效描述" });
    expect(r.success).toBe(false);
  });

  it("接受可选 track 与 phase", () => {
    const parsed = eventCreateSchema.parse({
      name: "赛事A",
      description: "描述内容",
      track: "AI应用",
      phase: "registration",
    });
    expect(parsed.track).toBe("AI应用");
    expect(parsed.phase).toBe("registration");
  });
});
