import { NextResponse } from "next/server";

export function apiOk<T>(data: T, status = 200) {
  return NextResponse.json({ code: 0, data, message: "ok" }, { status });
}

export function apiError(message: string, status = 400, data?: unknown) {
  return NextResponse.json({ code: status, data, message }, { status });
}
