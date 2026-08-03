import { Badge } from "@/components/ui/badge";
import type { PublishStatus } from "@/lib/tenants/types";

const LABELS: Record<PublishStatus, string> = {
  published: "Publicat",
  draft: "Ciornă",
  archived: "Arhivat",
};

const VARIANTS: Record<PublishStatus, "success" | "muted" | "outline"> = {
  published: "success",
  draft: "muted",
  archived: "outline",
};

export function StatusBadge({ status }: { status: PublishStatus }) {
  return <Badge variant={VARIANTS[status]}>{LABELS[status]}</Badge>;
}
