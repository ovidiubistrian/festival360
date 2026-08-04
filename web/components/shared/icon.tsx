import {
  Store,
  MapPin,
  CalendarDays,
  Users,
  UtensilsCrossed,
  ShoppingBasket,
  Hammer,
  Mountain,
  Music,
  Baby,
  type LucideIcon,
  HelpCircle,
} from "lucide-react";

const map: Record<string, LucideIcon> = {
  Store,
  MapPin,
  CalendarDays,
  Users,
  UtensilsCrossed,
  ShoppingBasket,
  Hammer,
  Mountain,
  Music,
  Baby,
};

export function Icon({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  const Cmp = map[name] ?? HelpCircle;
  return <Cmp className={className} />;
}
