"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { TimeseriesPoint } from "@/lib/admin/analytics";
import { formatNumber } from "@/lib/utils";

const GREEN = "#183C32";
const GOLD = "#C89B3C";

/** Short Romanian day label for an ISO date, e.g. "2026-08-05" → "5 aug". */
function dayLabel(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("ro-RO", {
    day: "numeric",
    month: "short",
  }).format(d);
}

export interface VisitorsChartProps {
  /** Real, zero-filled daily timeseries from the analytics API. */
  data: TimeseriesPoint[];
}

/**
 * Area chart of daily page views + unique visitors. Fully props-driven — the
 * caller (dashboard or analytics page) supplies the real timeseries.
 */
export function VisitorsChart({ data }: VisitorsChartProps) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="fillUniques" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={GREEN} stopOpacity={0.28} />
              <stop offset="100%" stopColor={GREEN} stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id="fillViews" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={GOLD} stopOpacity={0.24} />
              <stop offset="100%" stopColor={GOLD} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid
            vertical={false}
            stroke="rgba(24,60,50,0.08)"
            strokeDasharray="4 4"
          />
          <XAxis
            dataKey="date"
            tickFormatter={dayLabel}
            tickLine={false}
            axisLine={false}
            tick={{ fill: "rgba(24,60,50,0.55)", fontSize: 11 }}
            interval="preserveStartEnd"
            minTickGap={16}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            width={44}
            allowDecimals={false}
            tick={{ fill: "rgba(24,60,50,0.55)", fontSize: 11 }}
            tickFormatter={(v) => formatNumber(Number(v))}
          />
          <Tooltip
            cursor={{ stroke: "rgba(24,60,50,0.2)", strokeWidth: 1 }}
            contentStyle={{
              borderRadius: "0.75rem",
              border: "1px solid var(--border)",
              background: "var(--card)",
              fontSize: "12px",
            }}
            labelStyle={{ color: "var(--foreground)", fontWeight: 600 }}
            labelFormatter={(label) => dayLabel(String(label))}
            formatter={(value, name) => [
              formatNumber(Number(value)),
              name === "uniques" ? "Vizitatori unici" : "Pagini vizualizate",
            ]}
          />
          <Area
            type="monotone"
            dataKey="views"
            stroke={GOLD}
            strokeWidth={2}
            fill="url(#fillViews)"
          />
          <Area
            type="monotone"
            dataKey="uniques"
            stroke={GREEN}
            strokeWidth={2.5}
            fill="url(#fillUniques)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
