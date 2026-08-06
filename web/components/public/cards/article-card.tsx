import Link from "next/link";
import { Clock } from "lucide-react";
import { ImageWithFallback } from "@/components/shared/image-with-fallback";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import type { Article } from "@/lib/tenants/types";

export function ArticleCard({
  article,
  slug,
}: {
  article: Article;
  slug: string;
}) {
  return (
    <Link
      href={`/${slug}/noutati/${article.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all hover:-translate-y-1 hover:shadow-[0_12px_28px_rgba(32,37,34,0.10)]"
    >
      <div className="relative aspect-[3/4] overflow-hidden">
        <ImageWithFallback
          src={article.coverImage}
          alt={article.title}
          fill
          sizes="(max-width: 640px) 84vw, (max-width: 1024px) 47vw, 33vw"
          fallbackLabel={article.title}
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <Badge
          variant="secondary"
          className="absolute left-3 top-3 backdrop-blur"
        >
          {article.category}
        </Badge>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span>{formatDate(article.date)}</span>
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            {article.readingMinutes} min
          </span>
        </div>
        <h3 className="mt-2 font-serif text-xl font-semibold leading-snug text-primary transition-colors group-hover:text-terracotta">
          {article.title}
        </h3>
        <p className="mt-2 line-clamp-3 flex-1 text-sm leading-relaxed text-charcoal/70">
          {article.excerpt}
        </p>
        <p className="mt-4 text-sm font-medium text-terracotta">Citește articolul →</p>
      </div>
    </Link>
  );
}
