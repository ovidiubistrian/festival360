import type { TenantConfig } from "../types";
import { IMG } from "./images";

export const prispaConfig: TenantConfig = {
  info: {
    name: "VATRA",
    slug: "prispa",
    tagline: "România autentică se întâlnește la VATRA",
    shortDescription:
      "Descoperă gusturi locale, meșteșuguri, tradiții și unele dintre cele mai frumoase destinații ale României.",
    longDescription:
      "VATRA este festivalul care aduce în inima Brașovului esența satului românesc: producători cu poveste, meșteșugari care păstrează gesturi vechi de sute de ani, bucătari care gătesc după rețete moștenite și destinații turistice care așteaptă să fie descoperite. Timp de trei zile, Piața Sfatului devine o vatră uriașă, un loc de întâlnire între tradiție și prezent, între oameni și locurile care îi definesc.",
    startDate: "2025-09-12",
    endDate: "2025-09-14",
    locationName: "Piața Sfatului",
    city: "Brașov",
    county: "Brașov",
    heroImage: IMG.hero,
    heroBadge: "Tradiții • Gastronomie • Turism",
    logoText: "VATRA",
  },
  theme: {
    primary: "#183C32",
    secondary: "#F5EFE3",
    terracotta: "#B85C3B",
    gold: "#C99A45",
    charcoal: "#202522",
    background: "#FCFAF6",
  },
  navigation: [
    { label: "Despre", href: "/despre" },
    { label: "Program", href: "/program" },
    { label: "Expozanți", href: "/expozanti" },
    { label: "Produse", href: "/produse" },
    { label: "Destinații", href: "/destinatii" },
    { label: "Parteneri", href: "/parteneri" },
    { label: "Galerie", href: "/galerie" },
    { label: "Noutăți", href: "/noutati" },
    { label: "Contact", href: "/contact" },
  ],
  social: {
    facebook: "https://facebook.com/festivalprispa",
    instagram: "https://instagram.com/festivalprispa",
    youtube: "https://youtube.com/@festivalprispa",
    website: "https://prispa.ro",
  },
  contact: {
    email: "contact@prispa.ro",
    phone: "+40 368 000 100",
    address: "Piața Sfatului nr. 1",
    city: "Brașov",
    county: "Brașov",
    mapEmbedQuery: "Piața Sfatului, Brașov",
  },
  sections: [
    { id: "hero", label: "Hero", visible: true },
    { id: "about", label: "Despre festival", visible: true },
    { id: "experiences", label: "Zone și experiențe", visible: true },
    { id: "program", label: "Program", visible: true },
    { id: "exhibitors", label: "Expozanți", visible: true },
    { id: "products", label: "Produse locale", visible: true },
    { id: "destinations", label: "Destinații turistice", visible: true },
    { id: "partners", label: "Parteneri și sponsori", visible: true },
    { id: "gallery", label: "Galerie", visible: true },
    { id: "news", label: "Noutăți", visible: true },
    { id: "newsletter", label: "Newsletter", visible: true },
  ],
  stats: [
    { label: "Expozanți", value: "100+", icon: "Store" },
    { label: "Zone turistice", value: "20", icon: "MapPin" },
    { label: "Zile de festival", value: "3", icon: "CalendarDays" },
    { label: "Vizitatori", value: "30.000+", icon: "Users" },
  ],
  experiences: [
    {
      id: "gastronomie",
      title: "Gastronomie locală",
      description:
        "Preparate gătite pe loc, după rețete moștenite din bucătăria satului românesc.",
      icon: "UtensilsCrossed",
      image: IMG.dish,
    },
    {
      id: "produse",
      title: "Produse tradiționale",
      description:
        "Brânzeturi, miere, dulcețuri și afumături de la producători cu certificare și poveste.",
      icon: "ShoppingBasket",
      image: IMG.cheese,
    },
    {
      id: "mestesuguri",
      title: "Meșteșuguri",
      description:
        "Ateliere de ceramică, țesut și lemn, unde gesturile vechi prind viață sub ochii tăi.",
      icon: "Hammer",
      image: IMG.pottery,
    },
    {
      id: "turism",
      title: "Turism și natură",
      description:
        "Destinații de munte, sate autentice și experiențe în inima naturii românești.",
      icon: "Mountain",
      image: IMG.mountainLake,
    },
    {
      id: "muzica",
      title: "Muzică și spectacole",
      description:
        "Concerte de folclor reinventat, fanfare și seri de muzică sub cerul liber.",
      icon: "Music",
      image: IMG.concert,
    },
    {
      id: "copii",
      title: "Ateliere pentru copii",
      description:
        "Un colț dedicat celor mici, cu ateliere creative și jocuri din alte vremuri.",
      icon: "Baby",
      image: IMG.children,
    },
  ],
};
