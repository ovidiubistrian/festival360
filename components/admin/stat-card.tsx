import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  hint?: string;
  trend?: {
    value: string;
    positive?: boolean;
  };
}

export function StatCard({ label, value, icon, hint, trend }: StatCardProps) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="flex items-start justify-between gap-4 p-5">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {label}
          </p>
          <p className="mt-2 font-serif text-2xl font-semibold text-primary">
            {value}
          </p>
          {trend ? (
            <p
              className={cn(
                "mt-1 text-xs font-medium",
                trend.positive === false
                  ? "text-terracotta"
                  : "text-emerald-700"
              )}
            >
              {trend.value}
            </p>
          ) : null}
          {hint ? (
            <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
          ) : null}
        </div>
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary [&_svg]:size-5">
          {icon}
        </div>
      </CardContent>
    </Card>
  );
}
