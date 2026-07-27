"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import type { MetricPoint } from "@/types";

interface MetricChartProps {
  metrics: MetricPoint[];
}

export default function MetricChart({ metrics }: MetricChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={metrics} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="t"
          tickFormatter={(t: number) => `${t}s`}
          label={{ value: "Time (s)", position: "insideBottomRight", offset: -10 }}
        />
        <YAxis domain={[0, 100]} />
        <Tooltip
          formatter={(value: number, name: string) => [value, name]}
          labelFormatter={(label: number) => `Time: ${label}s`}
        />
        <Legend verticalAlign="bottom" />
        <Line
          type="monotone"
          dataKey="engagement"
          stroke="#3b82f6"
          dot={false}
          strokeWidth={2}
        />
        <Line
          type="monotone"
          dataKey="clarity"
          stroke="#22c55e"
          dot={false}
          strokeWidth={2}
        />
        <Line
          type="monotone"
          dataKey="pacing"
          stroke="#f97316"
          dot={false}
          strokeWidth={2}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
