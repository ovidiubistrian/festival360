"use client";

import * as React from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export interface DataToolbarProps {
  query: string;
  onQuery: (value: string) => void;
  placeholder?: string;
  /** Optional filter controls (e.g. a status Select) rendered before `right`. */
  filter?: React.ReactNode;
  /** Optional trailing content (e.g. an "Adaugă" button). */
  right?: React.ReactNode;
}

export function DataToolbar({
  query,
  onQuery,
  placeholder = "Caută...",
  filter,
  right,
}: DataToolbarProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative sm:max-w-xs sm:flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => onQuery(e.target.value)}
            placeholder={placeholder}
            className="pl-9"
            aria-label="Caută"
          />
        </div>
        {filter ? <div className="flex gap-2">{filter}</div> : null}
      </div>
      {right ? <div className="flex items-center gap-2">{right}</div> : null}
    </div>
  );
}
