import { NextResponse } from "next/server";

export function ok<T>(data: T, status = 200) {
  return NextResponse.json({ ok: true, data }, { status });
}

export function fail(error: string, status = 400) {
  return NextResponse.json({ ok: false, error }, { status });
}

/** 把未知异常转成统一错误响应。 */
export function handleError(e: unknown) {
  console.error(e);
  const message =
    e instanceof Error ? e.message : "服务器内部错误，请稍后重试";
  return fail(message, 500);
}
