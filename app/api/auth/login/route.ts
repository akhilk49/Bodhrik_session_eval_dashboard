import { NextResponse } from "next/server";

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { username, password } = body ?? {};

    if (username === "admin" && password === "admin") {
      const response = NextResponse.json({ ok: true }, { status: 200 });
      response.cookies.set("session-token", "mock-token-abc123", {
        httpOnly: true,
        path: "/",
        sameSite: "lax",
        maxAge: 86400,
      });
      return response;
    }

    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  } catch {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }
}
