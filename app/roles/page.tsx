import PublicSiteShell from "@/app/components/public/PublicSiteShell";
import Image from "next/image";

type RoleCard = {
  title: string;
  tag: string;
  img: string;
  points: string[];
};

const cards: RoleCard[] = [
  {
    title: "Admin",
    tag: "Owns the whole farm account",
    img: "https://images.unsplash.com/photo-1527525443983-6e60c75fff46?auto=format&fit=crop&w=800&q=80",
    points: [
      "Can see everything and change anything",
      "Adds new people and picks what they can do",
      "Manages billing and farm settings",
    ],
  },
  {
    title: "Farm Manager",
    tag: "Runs things day to day",
    img: "https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&w=800&q=80",
    points: [
      "Gives out jobs and checks they get done",
      "Logs planting, harvest, and stock levels",
      "Registers animals and tracks sales",
    ],
  },
  {
    title: "Field Worker",
    tag: "Out in the fields every day",
    img: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=800&q=80",
    points: [
      "Records what was planted, sprayed, or harvested",
      "Logs drone flights and soil readings",
      "Completes jobs the manager assigns",
    ],
  },
  {
    title: "Livestock Manager",
    tag: "Looks after the animals",
    img: "https://images.unsplash.com/photo-1516467508483-a7212febe31a?auto=format&fit=crop&w=800&q=80",
    points: [
      "Adds new animals and tracks ear tags",
      "Logs breeding, births, and weights",
      "Syncs with national livestock databases",
    ],
  },
  {
    title: "Inventory Manager",
    tag: "Keeps stock in order",
    img: "https://images.unsplash.com/photo-1580674285054-bed31e145f59?auto=format&fit=crop&w=800&q=80",
    points: [
      "Tracks what is in storage and how much",
      "Records where each batch came from",
      "Sets up products for the farm shop",
    ],
  },
  {
    title: "Shop Staff",
    tag: "Serves customers",
    img: "https://images.unsplash.com/photo-1488459716781-31db52582fe9?auto=format&fit=crop&w=800&q=80",
    points: [
      "Rings up sales at the till",
      "Updates product prices and info",
      "Checks how much stock is left",
    ],
  },
  {
    title: "Accountant",
    tag: "Handles the paperwork",
    img: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=800&q=80",
    points: [
      "Views spending and sales for reporting",
      "Exports data for tax or accounting software",
      "Cannot change or delete records",
    ],
  },
  {
    title: "Veterinary",
    tag: "Animal health and welfare",
    img: "https://images.unsplash.com/photo-1516467508483-a7212febe31a?auto=format&fit=crop&w=800&q=80",
    points: [
      "Logs treatments, vaccinations, and illness",
      "Tracks weights and growth over time",
      "Records breeding and advises on pairings",
    ],
  },
  {
    title: "Viewer",
    tag: "Can look but not touch",
    img: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=800&q=80",
    points: [
      "Browses any part of the farm system",
      "Views reports and dashboards",
      "Cannot add, edit, or delete anything",
    ],
  },
];

export default function RolesPage() {
  return (
    <PublicSiteShell>
      <section className="border-b border-border bg-surface">
        <div className="mx-auto max-w-7xl px-5 py-10">
          <div className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted">
            Roles
          </div>
          <h1 className="text-4xl font-extrabold leading-tight text-primary sm:text-5xl">
            The right person sees the right thing.
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-7 text-secondary">
            FieldPilot has nine roles so your team only sees what matters to
            them. The person working the field does not need to see the accounts.
            The shop staff do not need to adjust stock levels. Everyone stays in
            their own lane, and nothing sensitive gets seen by accident.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-12">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((card) => (
            <article
              key={card.title}
              className="group relative overflow-hidden rounded-2xl border border-border bg-card"
            >
              <div className="relative h-48 overflow-hidden">
                <Image
                  src={card.img}
                  alt=""
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                  unoptimized
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                <div className="absolute bottom-3 left-4">
                  <h2 className="text-xl font-extrabold text-white">
                    {card.title}
                  </h2>
                  <span className="text-sm font-medium text-white/80">
                    {card.tag}
                  </span>
                </div>
              </div>
              <div className="p-4">
                <ul className="space-y-2">
                  {card.points.map((point) => (
                    <li
                      key={point}
                      className="flex items-start gap-2 text-sm leading-5 text-secondary"
                    >
                      <span className="mt-1 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-green" />
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="border-t border-border bg-surface">
        <div className="mx-auto max-w-7xl px-5 py-12">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-bold text-primary">
              Your farm does not fit a box? No problem.
            </h2>
            <p className="mt-3 text-sm leading-7 text-secondary">
              The nine roles above work for most setups, but we can build
              custom ones that mix and match however you need. Enterprise plans
              include bespoke roles tailored to your operation.
            </p>
          </div>
        </div>
      </section>
    </PublicSiteShell>
  );
}
