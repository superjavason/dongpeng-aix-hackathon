import { describe, it, expect } from "vitest";
import { can } from "./permissions";

describe("can - create_project", () => {
  it("参赛者在报名阶段可提报", () => {
    expect(can("create_project", { phase: "registration", role: "participant" })).toBe(true);
  });
  it("非报名阶段不可提报", () => {
    expect(can("create_project", { phase: "in_progress", role: "participant" })).toBe(false);
  });
  it("评委不可提报", () => {
    expect(can("create_project", { phase: "registration", role: "judge" })).toBe(false);
  });
});

describe("can - apply", () => {
  it("报名阶段、非成员参赛者可报名", () => {
    expect(can("apply", { phase: "registration", role: "participant", isMember: false })).toBe(true);
  });
  it("已是成员不可重复报名", () => {
    expect(can("apply", { phase: "registration", role: "participant", isMember: true })).toBe(false);
  });
  it("非报名阶段不可报名", () => {
    expect(can("apply", { phase: "judging", role: "participant", isMember: false })).toBe(false);
  });
});

describe("can - review_application", () => {
  it("发起人在报名阶段可审核", () => {
    expect(can("review_application", { phase: "registration", role: "participant", isOwner: true })).toBe(true);
  });
  it("非发起人不可审核", () => {
    expect(can("review_application", { phase: "registration", role: "participant", isOwner: false })).toBe(false);
  });
});

describe("can - submit_work", () => {
  it("比赛进行中、已通过成员可提交", () => {
    expect(can("submit_work", { phase: "in_progress", role: "participant", isMember: true })).toBe(true);
  });
  it("非成员不可提交", () => {
    expect(can("submit_work", { phase: "in_progress", role: "participant", isMember: false })).toBe(false);
  });
  it("评分阶段锁定不可提交", () => {
    expect(can("submit_work", { phase: "judging", role: "participant", isMember: true })).toBe(false);
  });
});

describe("can - score", () => {
  it("评分阶段评委可打分", () => {
    expect(can("score", { phase: "judging", role: "judge" })).toBe(true);
  });
  it("非评分阶段不可打分", () => {
    expect(can("score", { phase: "in_progress", role: "judge" })).toBe(false);
  });
  it("非评委不可打分", () => {
    expect(can("score", { phase: "judging", role: "participant" })).toBe(false);
  });
});
