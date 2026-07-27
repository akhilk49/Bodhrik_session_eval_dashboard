import { NextResponse } from "next/server";

export async function POST(_request: Request): Promise<NextResponse> {
  try {
    const response = NextResponse.json({ ok: true }, { status: 200 });
    response.cookies.set("session-token", "", {
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      maxAge: 0,
    });
    return response;
  } catch {
    return NextResponse.json({ ok: true }, { status: 200 });
  }
}
