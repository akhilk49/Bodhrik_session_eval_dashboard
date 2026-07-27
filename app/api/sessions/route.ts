import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import type { Session, FilterParams } from "@/types";
import { applyFilters, sleep } from "@/lib/utils";

export async function GET(request: Request): Promise<NextResponse> {
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

    // Build filter params from query string (only include defined values)
    const params: FilterParams = {};
    const student = searchParams.get("student");
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    if (student) params.student = student;
    if (from) params.from = from;
    if (to) params.to = to;

    // Apply filters
    const filtered = applyFilters(sessions, params);

    // Random delay between 400–800 ms
    const delay = Math.floor(Math.random() * 401) + 400;
    await sleep(delay);

    return NextResponse.json(filtered, { status: 200 });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
