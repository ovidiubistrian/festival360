import { Footprints, Mountain, Clock, Ruler } from "lucide-react";
import { Container } from "@/components/shared/container";
import { SectionHeading } from "@/components/shared/section-heading";
import { cn } from "@/lib/utils";

type Difficulty = "Ușor" | "Mediu" | "Dificil";

interface Trail {
  name: string;
  difficulty: Difficulty;
  duration: string;
  length: string;
}

const TRAILS: Trail[] = [
  {
    name: "Traseul Lacului Verde",
    difficulty: "Ușor",
    duration: "1h 30m",
    length: "4,2 km",
  },
  {
    name: "Poteca Izvoarelor",
    difficulty: "Ușor",
    duration: "2h",
    length: "6 km",
  },
  {
    name: "Creasta Muntele Mic",
    difficulty: "Mediu",
    duration: "3h 30m",
    length: "9,5 km",
  },
  {
    name: "Vârful Țarcu",
    difficulty: "Dificil",
    duration: "6h",
    length: "16 km",
  },
];

const DIFFICULTY_STYLES: Record<Difficulty, string> = {
  "Ușor": "bg-emerald-100 text-emerald-800",
  Mediu: "bg-gold/20 text-[color:var(--gold-600)]",
  Dificil: "bg-terracotta/15 text-[color:var(--terracotta-600)]",
};

const MAP_SRC =
  "https://www.google.com/maps?q=Poiana%20M%C4%83rului&output=embed";

export function TrailsMap() {
  return (
    <section id="trasee" className="bg-secondary py-16 sm:py-24">
      <Container>
        <SectionHeading
          eyebrow="Explorează zona"
          title="Trasee & hartă"
          description="Descoperă potecile din jurul stațiunii — de la plimbări ușoare pe malul lacului până la ture montane pentru cei experimentați."
        />

        <div className="mt-10 grid gap-8 lg:grid-cols-[1.3fr_1fr] lg:gap-12">
          <div className="aspect-video overflow-hidden rounded-2xl border border-border">
            <iframe
              src={MAP_SRC}
              title="Harta traseelor din Poiana Mărului"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="h-full w-full border-0"
            />
          </div>

          <ul className="space-y-4">
            {TRAILS.map((trail) => (
              <li
                key={trail.name}
                className="rounded-2xl border border-border bg-card p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="flex items-center gap-2 font-serif text-lg font-semibold text-primary">
                    <Footprints className="h-5 w-5 shrink-0 text-terracotta" />
                    {trail.name}
                  </h3>
                  <span
                    className={cn(
                      "inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
                      DIFFICULTY_STYLES[trail.difficulty]
                    )}
                  >
                    <Mountain className="h-3.5 w-3.5" />
                    {trail.difficulty}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-charcoal/70">
                  <span className="inline-flex items-center gap-1.5">
                    <Clock className="h-4 w-4 text-primary" />
                    {trail.duration}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Ruler className="h-4 w-4 text-primary" />
                    {trail.length}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </section>
  );
}
