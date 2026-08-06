import Link from "next/link";
import { Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-warm-white px-6 text-center">
      <p className="font-serif text-7xl font-semibold text-primary">404</p>
      <h1 className="mt-4 font-serif text-2xl font-semibold text-charcoal">
        Pagina nu a fost găsită
      </h1>
      <p className="mt-2 max-w-md text-muted-foreground">
        Ne pare rău, pagina căutată nu există sau a fost mutată.
      </p>
      <div className="mt-8 flex gap-3">
        <Button asChild>
          <Link href="/">
            <Home className="h-4 w-4" />
            Acasă
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/prispa">Festivalul VATRA</Link>
        </Button>
      </div>
    </div>
  );
}
