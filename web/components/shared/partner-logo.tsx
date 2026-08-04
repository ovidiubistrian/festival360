import { cn } from "@/lib/utils";

/**
 * Renders a partner logo. In the demo `logo` is a short monogram string, shown
 * as a styled placeholder on a neutral background. If `logo` is a URL (starts
 * with http or /), it renders as an image instead.
 */
export function PartnerLogo({
  logo,
  name,
  className,
}: {
  logo: string;
  name: string;
  className?: string;
}) {
  const isImage = logo.startsWith("http") || logo.startsWith("/");

  if (isImage) {
    return (
      // Partner logos may be arbitrary external hosts not whitelisted for
      // next/image; a plain img keeps the demo robust. Swap for next/image
      // once real logo assets live under /public.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={logo}
        alt={name}
        className={cn("max-h-12 w-auto object-contain", className)}
      />
    );
  }

  return (
    <div
      className={cn(
        "flex h-14 w-14 items-center justify-center rounded-xl bg-secondary font-serif text-lg font-semibold tracking-tight text-primary",
        className
      )}
      aria-label={name}
    >
      {logo}
    </div>
  );
}
