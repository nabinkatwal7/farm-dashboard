import PublicImage from "@/app/components/public/PublicImage";
import PublicSiteShell from "@/app/components/public/PublicSiteShell";
import { publicSiteImages } from "@/app/lib/public-site";
import {
  CloudSun,
  Fingerprint,
  MapPinned,
  Package,
  Satellite,
  ShieldCheck,
  Sprout,
  Tractor,
  Users,
  Wheat,
} from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

const featureGroups = [
  {
    title: "Farm onboarding",
    copy: "Create a farm account, confirm location, and get the first team members into the workspace without a messy setup phase.",
    Icon: Users,
  },
  {
    title: "Field creation and mapping",
    copy: "Name fields, capture acreage, define crop context, and keep the production map easy to understand at a glance.",
    Icon: MapPinned,
  },
  {
    title: "Crop planning and timing",
    copy: "Track crop status, seasonal timing, and field conditions in a way operators can act on quickly.",
    Icon: Wheat,
  },
  {
    title: "Weather and guidance",
    copy: "Weather signals, GDD tracking, and operational prompts help teams make better calls during the season.",
    Icon: CloudSun,
  },
  {
    title: "Inventory and product readiness",
    copy: "Manage stock, categories, pricing, and live product listings from the same operating system.",
    Icon: Package,
  },
  {
    title: "Traceability",
    copy: "Batch records and origin lookup give buyers proof when they need it and keep the workflow manageable for farms.",
    Icon: Fingerprint,
  },
];

const workflows = [
  {
    title: "Start clean",
    body: "Onboarding focuses on the essentials first so teams get live faster and fill in detail as they grow.",
    Icon: Sprout,
  },
  {
    title: "Operate in context",
    body: "Fields, weather, operations, livestock, and inventory stay connected instead of becoming separate islands.",
    Icon: Tractor,
  },
  {
    title: "Publish with confidence",
    body: "Products go public only when stock, pricing, and traceability information are ready.",
    Icon: ShieldCheck,
  },
  {
    title: "Inspect and improve",
    body: "Drone scouting, observations, and activity history help farms tighten decisions over time.",
    Icon: Satellite,
  },
];

export default function FeaturesPage() {
  return (
    <PublicSiteShell>
      <section className="border-b border-border bg-surface">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 py-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <div>
            <div className="section-kicker">Features</div>
            <h1 className="mt-3 text-4xl font-semibold leading-tight text-primary sm:text-5xl">
              Everything the platform needs to feel clear in the field and polished in front of buyers.
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-secondary">
              FieldPilot is built to make the hard parts of farm software feel simpler:
              onboarding, field creation, daily operations, stock control, and product publishing.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/login" className="btn-primary">
                Open management portal
              </Link>
              <Link href="/farms" className="btn-ghost">
                Browse farm directory
              </Link>
            </div>
          </div>
          <div className="relative min-h-[380px] overflow-hidden rounded-[28px] border border-border shadow-[0_26px_60px_rgba(30,41,33,0.12)]">
            <PublicImage
              src={publicSiteImages.soil}
              alt="Cultivated soil and new growth"
              fill
              className="object-cover"
              priority
            />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-14">
        <div className="mb-8 max-w-3xl">
          <div className="section-kicker">Core capabilities</div>
          <h2 className="mt-3 section-heading">Designed around farm workflows, not generic admin screens.</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {featureGroups.map(({ title, copy, Icon }) => (
            <article key={title} className="surface-panel p-6">
              <Icon size={22} className="text-green" />
              <h3 className="mt-4 text-xl font-semibold text-primary">{title}</h3>
              <p className="mt-2 text-sm leading-7 text-secondary">{copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-border bg-card">
        <div className="mx-auto max-w-7xl px-5 py-14">
          <div className="mb-8 max-w-3xl">
            <div className="section-kicker">Experience</div>
            <h2 className="mt-3 section-heading">The product should guide the next step without forcing users to decode the system.</h2>
          </div>
          <div className="grid gap-4 lg:grid-cols-4">
            {workflows.map(({ title, body, Icon }) => (
              <article key={title} className="surface-panel-soft p-5">
                <Icon size={20} className="text-green" />
                <h3 className="mt-4 text-lg font-semibold text-primary">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-secondary">{body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-14">
        <div className="grid gap-6 lg:grid-cols-[1fr_1fr] lg:items-center">
          <div className="surface-panel overflow-hidden">
            <div className="relative aspect-[16/11]">
              <PublicImage
                src={publicSiteImages.drone}
                alt="Drone review over a field"
                fill
                className="object-cover"
              />
            </div>
          </div>
          <div>
            <div className="section-kicker">Access model</div>
            <h2 className="mt-3 section-heading">The storefront stays open. Operational tools stay protected.</h2>
            <p className="mt-4 section-copy">
              Buyers can browse farms, products, and traceability details freely. Editing records,
              managing fields, updating stock, and running operations remain inside the authenticated portal.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="surface-panel-soft p-5">
                <h3 className="text-lg font-semibold text-primary">Open pages</h3>
                <p className="mt-2 text-sm leading-6 text-secondary">
                  Home, about, features, farms, products, and batch lookup.
                </p>
              </div>
              <div className="surface-panel-soft p-5">
                <h3 className="text-lg font-semibold text-primary">Portal modules</h3>
                <p className="mt-2 text-sm leading-6 text-secondary">
                  Dashboard, crops, inventory, livestock, sales, and settings.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </PublicSiteShell>
  );
}
