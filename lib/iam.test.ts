import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  parseAccessToken,
  mapProfile,
  safeInternalPath,
  buildAuthorizeUrl,
  isIamEnabled,
  type IamConfig,
} from "@/lib/iam";

const cfg: IamConfig = {
  baseUrl: "https://iam.dongpeng.net/esc-sso",
  clientId: "cid",
  clientSecret: "secret",
  redirectUri: "https://app.example.com/api/sso/iam/callback",
  mock: false,
};

describe("parseAccessToken", () => {
  it("parses CAS form format", () => {
    expect(parseAccessToken("access_token=a855d95f1974&expires=7200")).toBe("a855d95f1974");
  });
  it("falls back to JSON format", () => {
    expect(parseAccessToken('{"access_token":"abc123"}')).toBe("abc123");
  });
  it("returns null when absent", () => {
    expect(parseAccessToken("error=invalid_grant")).toBeNull();
    expect(parseAccessToken("")).toBeNull();
  });
});

describe("mapProfile", () => {
  it("maps id and account_no", () => {
    expect(
      mapProfile({ id: "sysadmin", attributes: { account_no: "sysadmintest" } })
    ).toEqual({ ssoId: "sysadmin", accountNo: "sysadmintest" });
  });
  it("tolerates missing attributes", () => {
    expect(mapProfile({ id: "sysadmin" })).toEqual({ ssoId: "sysadmin", accountNo: null });
  });
  it("rejects payload without id", () => {
    expect(mapProfile({ attributes: { account_no: "x" } })).toBeNull();
    expect(mapProfile(null)).toBeNull();
    expect(mapProfile("nope")).toBeNull();
  });
});

describe("safeInternalPath", () => {
  it("accepts internal absolute paths", () => {
    expect(safeInternalPath("/dashboard", "/x")).toBe("/dashboard");
  });
  it("rejects protocol-relative and external", () => {
    expect(safeInternalPath("//evil.com", "/x")).toBe("/x");
    expect(safeInternalPath("https://evil.com", "/x")).toBe("/x");
    expect(safeInternalPath(null, "/x")).toBe("/x");
  });
});

describe("buildAuthorizeUrl", () => {
  it("includes required oauth params", () => {
    const url = buildAuthorizeUrl(cfg, "state123");
    expect(url).toContain("https://iam.dongpeng.net/esc-sso/oauth2.0/authorize?");
    expect(url).toContain("client_id=cid");
    expect(url).toContain("response_type=code");
    expect(url).toContain("state=state123");
    expect(url).toContain(
      "redirect_uri=https%3A%2F%2Fapp.example.com%2Fapi%2Fsso%2Fiam%2Fcallback"
    );
  });
});

describe("isIamEnabled", () => {
  const original = process.env.IAM_CLIENT_ID;
  afterEach(() => {
    if (original === undefined) delete process.env.IAM_CLIENT_ID;
    else process.env.IAM_CLIENT_ID = original;
  });
  it("true when client id present", () => {
    process.env.IAM_CLIENT_ID = "x";
    expect(isIamEnabled()).toBe(true);
  });
  it("false when absent", () => {
    delete process.env.IAM_CLIENT_ID;
    expect(isIamEnabled()).toBe(false);
  });
});
