"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface PagerProps {
  page: number;
  pageSize: number;
  total: number;
  onPage: (page: number) => void;
}

/** Simple client-side pagination footer: "afișez X din Y" + prev/next. */
export function Pager({ page, pageSize, total, onPage }: PagerProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  if (total <= pageSize) {
    return (
      <p className="text-xs text-muted-foreground">
        Afișez {total} din {total}
      </p>
    );
  }

  return (
    <div className="flex items-center justify-between gap-4">
      <p className="text-xs text-muted-foreground">
        Afișez {from}–{to} din {total}
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => onPage(page - 1)}
          aria-label="Pagina anterioară"
        >
          <ChevronLeft />
          Anterior
        </Button>
        <span className="text-xs text-muted-foreground">
          {page} / {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => onPage(page + 1)}
          aria-label="Pagina următoare"
        >
          Următor
          <ChevronRight />
        </Button>
      </div>
    </div>
  );
}
