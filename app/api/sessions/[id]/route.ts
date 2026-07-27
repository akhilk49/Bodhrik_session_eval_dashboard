import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import type { Session } from "@/types";
import { sleep } from "@/lib/utils";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);

    // Check for simulated error flag
    if (searchParams.get("simulateError") === "1") {
      return NextResponse.json(
        { error: "Simulated server error" },
        { status: 500 }
      );
    }

    // Read and parse sessions data
    const filePath = path.join(process.cwd(), "data", "sessions.json");
    const raw = await fs.readFile(filePath, "utf-8");
    const sessions: Session[] = JSON.parse(raw);

    // Find the session by ID
    const session = sessions.find((s) => s.id === params.id);

    // Random delay between 400–800 ms
    const delay = Math.floor(Math.random() * 401) + 400;
    await sleep(delay);

    if (!session) {
      return NextResponse.json(
        { error: "Session not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(session, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
