import type { Tenant, ContactMessage, NewsletterSubscriber } from "../types";
import { prispaConfig } from "./config";
import { exhibitors } from "./data/exhibitors";
import { products } from "./data/products";
import { destinations } from "./data/destinations";
import { program } from "./data/program";
import { partners } from "./data/partners";
import { gallery } from "./data/gallery";
import { articles } from "./data/articles";

const contactMessages: ContactMessage[] = [
  {
    id: "cm-1",
    name: "Ioana Petrescu",
    email: "ioana.p@example.com",
    subject: "Înscriere ca expozant",
    message:
      "Bună ziua! Suntem o mică brutărie din Sibiu și ne-ar plăcea să participăm la ediția viitoare. Cum ne putem înscrie?",
    date: "2025-07-28",
    read: false,
  },
  {
    id: "cm-2",
    name: "Andrei Munteanu",
    email: "andrei.m@example.com",
    subject: "Colaborare parteneriat media",
    message:
      "Reprezint un portal de turism și am dori să discutăm un parteneriat media pentru festival.",
    date: "2025-07-30",
    read: true,
  },
  {
    id: "cm-3",
    name: "Familia Georgescu",
    email: "georgescu@example.com",
    subject: "Program pentru copii",
    message:
      "Venim cu doi copii de 5 și 8 ani. Ce ateliere le recomandați și trebuie să rezervăm din timp?",
    date: "2025-08-02",
    read: false,
  },
];

const newsletter: NewsletterSubscriber[] = [
  { id: "ns-1", email: "maria.ionescu@example.com", date: "2025-07-15", source: "Homepage" },
  { id: "ns-2", email: "vlad.dumitru@example.com", date: "2025-07-19", source: "Homepage" },
  { id: "ns-3", email: "elena.stan@example.com", date: "2025-07-24", source: "Articol" },
  { id: "ns-4", email: "george.pop@example.com", date: "2025-08-01", source: "Homepage" },
  { id: "ns-5", email: "raluca.matei@example.com", date: "2025-08-03", source: "Contact" },
];

export const prispaTenant: Tenant = {
  slug: "prispa",
  config: prispaConfig,
  content: {
    exhibitors,
    products,
    destinations,
    program,
    partners,
    gallery,
    articles,
    contactMessages,
    newsletter,
  },
};
