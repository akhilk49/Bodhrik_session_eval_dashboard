"use client";

import Link from "next/link";
import type { Session } from "@/types";
import { calcAverageScore, formatDate } from "@/lib/utils";

interface SessionCardProps {
  session: Session;
}

export default function SessionCard({ session }: SessionCardProps) {
  const avgScore = calcAverageScore(session).toFixed(1);
  const humanDate = formatDate(session.date);

  return (
    <Link
      href={`/dashboard/${session.id}`}
      className="block rounded-lg border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Left: student + date */}
        <div className="flex flex-col gap-1">
          <span className="text-base font-semibold text-gray-900">{session.student}</span>
          <span className="text-sm text-gray-500">{humanDate}</span>
        </div>

        {/* Right: duration + average score */}
        <div className="flex items-center gap-4 text-sm">
          <span className="text-gray-600">
            <span className="font-medium text-gray-800">{session.durationMinutes}</span> min
          </span>
          <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-blue-700">
            Avg{" "}
            <span className="ml-1 font-semibold">{avgScore}</span>
          </span>
        </div>
      </div>
    </Link>
  );
}
