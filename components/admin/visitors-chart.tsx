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
import { visitorsSeries } from "@/lib/admin/analytics";
import { formatNumber } from "@/lib/utils";

const GREEN = "#183C32";
const GOLD = "#C89B3C";

export function VisitorsChart() {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={visitorsSeries}
          margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="fillVisitors" x1="0" y1="0" x2="0" y2="1">
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
            dataKey="day"
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
            formatter={(value, name) => [
              formatNumber(Number(value)),
              name === "vizitatori" ? "Vizitatori" : "Pagini vizualizate",
            ]}
          />
          <Area
            type="monotone"
            dataKey="pagini"
            stroke={GOLD}
            strokeWidth={2}
            fill="url(#fillViews)"
          />
          <Area
            type="monotone"
            dataKey="vizitatori"
            stroke={GREEN}
            strokeWidth={2.5}
            fill="url(#fillVisitors)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
