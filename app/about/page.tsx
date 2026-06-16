import PublicSiteShell from "@/app/components/public/PublicSiteShell";
import PublicImage from "@/app/components/public/PublicImage";
import {
  getPublicSiteData,
  portalModules,
  publicSiteImages,
} from "@/app/lib/public-site";
import { BarChart3, CloudSun, Fingerprint, Package, Sprout, Users } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

const platformFeatures = [
  {
    title: "Farm operations",
    body: "Tasks, machinery, field activities, and daily operational planning in one dashboard.",
    Icon: BarChart3,
  },
  {
    title: "Crop intelligence",
    body: "Weather, GDD, growth stages, seeding zones, and scouting workflows tied back to fields.",
    Icon: CloudSun,
  },
  {
    title: "Consumer trust",
    body: "Product discovery and traceability that give buyers confidence without exposing internal records.",
    Icon: Fingerprint,
  },
  {
    title: "Commerce and stock",
    body: "Products, inventory, point of sale, and batch-linked stock management for producers.",
    Icon: Package,
  },
] as const;

const principles = [
  {
    title: "Useful over flashy",
    body: "The platform is meant to help teams move through real work quickly, not just look polished in screenshots.",
  },
  {
    title: "Shared truth across the business",
    body: "Product listings, inventory, traceability, and field activity stay connected so people are not reconciling separate stories.",
  },
  {
    title: "Public clarity with private control",
    body: "Farms can share what buyers need to see without exposing the whole operating system behind it.",
  },
] as const;

export default async function AboutPage() {
  const data = await getPublicSiteData();

  return (
    <PublicSiteShell>
      <section className="border-b border-border bg-surface">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 py-10 lg:grid-cols-[1fr_1fr] lg:items-center">
          <div>
            <div className="text-xs font-semibold uppercase tracking-widest text-muted">
              About FieldPilot
            </div>
            <h1 className="mt-2 text-4xl font-extrabold leading-tight text-primary sm:text-5xl">
              Built for farms that sell with confidence and operate with clarity.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-secondary">
              FieldPilot brings together operations, inventory, product
              listings, and traceability so farms can stay organized while
              giving buyers a clearer view of where their food comes from.
            </p>
          </div>
          <div className="relative min-h-[360px] overflow-hidden rounded-[28px] border border-border">
            <PublicImage
              src={publicSiteImages.aboutHero}
              alt="Rows of produce growing in a managed farm field"
              fill
              className="object-cover"
            />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-12">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {platformFeatures.map(({ title, body, Icon }) => (
            <article
              key={title}
              className="rounded-2xl border border-border bg-card p-5"
            >
              <Icon className="mb-4 text-green" size={22} />
              <h2 className="text-lg font-bold text-primary">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-secondary">{body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-border bg-surface">
        <div className="mx-auto max-w-7xl px-5 py-12">
          <div className="mb-8 max-w-3xl">
            <div className="text-xs font-semibold uppercase tracking-widest text-muted">
              Principles
            </div>
            <h2 className="mt-2 text-3xl font-bold text-primary">
              The product is shaped around how farms actually work.
            </h2>
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            {principles.map((principle) => (
              <article key={principle.title} className="rounded-2xl border border-border bg-card p-5">
                <h3 className="text-lg font-bold text-primary">{principle.title}</h3>
                <p className="mt-2 text-sm leading-7 text-secondary">{principle.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-border bg-card">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 py-12 lg:grid-cols-[0.92fr_1.08fr] lg:items-center">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="overflow-hidden rounded-2xl border border-border">
              <div className="relative aspect-[4/5]">
                <PublicImage
                  src={publicSiteImages.drone}
                  alt="Drone flying above a field"
                  fill
                  className="object-cover"
                />
              </div>
            </div>
            <div className="overflow-hidden rounded-2xl border border-border">
              <div className="relative aspect-[4/5]">
                <PublicImage
                  src={publicSiteImages.livestock}
                  alt="Livestock in a pasture"
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          </div>

          <div>
            <div className="text-xs font-semibold uppercase tracking-widest text-muted">
              What keeps it running
            </div>
            <h2 className="mt-2 text-3xl font-bold text-primary">
              One workspace for field work, livestock, stock, and sales.
            </h2>
            <p className="mt-4 text-base leading-7 text-secondary">
              Teams use the portal to onboard farms, manage weather stations,
              seed lots, drydown, RFID scans, and day-to-day operations while
              buyers see a cleaner, simpler storefront.
            </p>
            <div className="mt-6 grid gap-3 md:grid-cols-2">
              {portalModules.map((module) => (
                <Link
                  href={module.href}
                  key={module.title}
                  className="rounded-xl border border-border bg-surface p-4 no-underline transition-colors hover:bg-card-hover"
                >
                  <div className="text-base font-bold text-primary">
                    {module.title}
                  </div>
                  <p className="mt-2 text-sm leading-6 text-secondary">
                    {module.description}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-12">
        <div className="mb-8 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-2xl border border-border bg-surface p-6">
            <div className="text-xs font-semibold uppercase tracking-widest text-muted">
              Why teams switch
            </div>
            <h2 className="mt-2 text-2xl font-bold text-primary">
              One system replaces scattered notes, spreadsheets, and side apps.
            </h2>
            <p className="mt-4 text-sm leading-7 text-secondary">
              Operations, product readiness, and customer-facing trust signals
              belong in the same workflow. That is where FieldPilot is strongest.
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="text-xs font-semibold uppercase tracking-widest text-muted">
              Next step
            </div>
            <p className="mt-2 text-sm leading-7 text-secondary">
              Want the full breakdown of modules, workflows, and day-to-day
              capabilities?
            </p>
            <Link href="/features" className="mt-4 inline-flex text-sm font-semibold text-green no-underline">
              See the feature guide
            </Link>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          <div className="rounded-2xl border border-border bg-surface p-5">
            <Users className="mb-4 text-green" size={22} />
            <div className="text-3xl font-extrabold text-primary">
              {data.totals.farms}
            </div>
            <div className="mt-1 text-sm text-secondary">farm workspaces</div>
          </div>
          <div className="rounded-2xl border border-border bg-surface p-5">
            <Package className="mb-4 text-blue" size={22} />
            <div className="text-3xl font-extrabold text-primary">
              {data.totals.products}
            </div>
            <div className="mt-1 text-sm text-secondary">product listings</div>
          </div>
          <div className="rounded-2xl border border-border bg-surface p-5">
            <Fingerprint className="mb-4 text-amber" size={22} />
            <div className="text-3xl font-extrabold text-primary">
              {data.totals.batches}
            </div>
            <div className="mt-1 text-sm text-secondary">tracked batches</div>
          </div>
          <div className="rounded-2xl border border-border bg-surface p-5">
            <Sprout className="mb-4 text-purple" size={22} />
            <div className="text-3xl font-extrabold text-primary">
              {data.totals.droneFlights}
            </div>
            <div className="mt-1 text-sm text-secondary">logged drone flights</div>
          </div>
        </div>
      </section>
    </PublicSiteShell>
  );
}
