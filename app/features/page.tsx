import PublicSiteShell from "@/app/components/public/PublicSiteShell";
import PublicImage from "@/app/components/public/PublicImage";
import { publicSiteImages } from "@/app/lib/public-site";
import { CloudSun, Fingerprint, MapPinned, Package, Satellite, ShieldCheck, Sprout, Tractor, Users, Wheat } from "lucide-react";
import Link from "next/link";

const featureGroups = [
  {
    title: "Farm setup and team management",
    copy:
      "Create separate farm accounts, place the farm on the map, invite staff, and keep each operation isolated.",
    Icon: Users,
  },
  {
    title: "Field mapping and crop planning",
    copy:
      "Map boundaries, track acreage, log crop status, and keep field decisions grounded in the actual layout of the farm.",
    Icon: MapPinned,
  },
  {
    title: "Weather and growing conditions",
    copy:
      "Use weather data, GDD tracking, and crop timing insights to plan work with fewer surprises.",
    Icon: CloudSun,
  },
  {
    title: "Scouting and observations",
    copy:
      "Connect drone flights and field observations back to the places and products they affect.",
    Icon: Satellite,
  },
  {
    title: "Inventory and product readiness",
    copy:
      "Manage stock, product details, and sales readiness from the same system used to run the farm.",
    Icon: Package,
  },
  {
    title: "Traceability and buyer trust",
    copy:
      "Publish batch details and product histories when customers need a clearer line back to origin.",
    Icon: Fingerprint,
  },
] as const;

const workflow = [
  {
    title: "Onboard the farm",
    body: "Set up the account, confirm the location, and create the first admin without making the process feel heavy.",
    Icon: Sprout,
  },
  {
    title: "Build the production map",
    body: "Add fields, acreage, crop status, and the working details that teams need every week.",
    Icon: Wheat,
  },
  {
    title: "Run the season",
    body: "Keep activities, weather, scouting, inventory, and livestock connected instead of spread across separate systems.",
    Icon: Tractor,
  },
  {
    title: "Share what is ready",
    body: "Publish products and traceable batches without exposing the full operational workspace.",
    Icon: ShieldCheck,
  },
] as const;

const experienceNotes = [
  {
    title: "Onboarding should feel calm",
    body: "The first setup flow is designed to get a farm live quickly without burying people in fields they do not need yet.",
  },
  {
    title: "Field creation should feel obvious",
    body: "Mapping, naming, crop selection, and acreage feedback belong in one guided flow rather than scattered steps.",
  },
  {
    title: "Daily work should stay close at hand",
    body: "Weather, products, inventory, livestock, and traceability should feel connected because they are connected in the real business.",
  },
] as const;

export const dynamic = "force-dynamic";

export default function FeaturesPage() {
  return (
    <PublicSiteShell>
      <section className="border-b border-border bg-surface">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 py-10 lg:grid-cols-[1fr_1fr] lg:items-center">
          <div>
            <div className="text-xs font-semibold uppercase tracking-widest text-muted">
              Features
            </div>
            <h1 className="mt-2 text-4xl font-extrabold leading-tight text-primary sm:text-5xl">
              The full operating system behind the storefront.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-secondary">
              FieldPilot is built for farms that need structure behind the
              scenes and clarity out front. It supports the core workflows that
              make onboarding, field creation, product readiness, and daily work
              easier to handle.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/login" className="btn-primary">
                Sign in to portal
              </Link>
              <Link href="/onboard" className="btn-ghost">
                Create farm account
              </Link>
            </div>
          </div>
          <div className="relative min-h-[360px] overflow-hidden rounded-[28px] border border-border">
            <PublicImage
              src={publicSiteImages.soil}
              alt="Close view of cultivated soil and new growth"
              fill
              className="object-cover"
              priority
            />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-12">
        <div className="mb-8 max-w-3xl">
          <div className="text-xs font-semibold uppercase tracking-widest text-muted">
            Core capabilities
          </div>
          <h2 className="mt-2 text-3xl font-bold text-primary">
            Designed for real farm workflows, not just a clean dashboard.
          </h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {featureGroups.map(({ title, copy, Icon }) => (
            <article key={title} className="rounded-2xl border border-border bg-card p-6">
              <Icon size={22} className="text-green" />
              <h3 className="mt-4 text-xl font-bold text-primary">{title}</h3>
              <p className="mt-2 text-sm leading-7 text-secondary">{copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-border bg-card">
        <div className="mx-auto max-w-7xl px-5 py-12">
          <div className="mb-8 max-w-3xl">
            <div className="text-xs font-semibold uppercase tracking-widest text-muted">
              Workflow
            </div>
            <h2 className="mt-2 text-3xl font-bold text-primary">
              A straightforward path from setup to selling.
            </h2>
          </div>
          <div className="grid gap-4 lg:grid-cols-4">
            {workflow.map(({ title, body, Icon }, index) => (
              <article key={title} className="rounded-2xl border border-border bg-surface p-5">
                <div className="flex items-center justify-between gap-3">
                  <Icon size={20} className="text-green" />
                  <span className="text-xs font-semibold text-muted">0{index + 1}</span>
                </div>
                <h3 className="mt-4 text-lg font-bold text-primary">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-secondary">{body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-12">
        <div className="mb-8 max-w-3xl">
          <div className="text-xs font-semibold uppercase tracking-widest text-muted">
            Product experience
          </div>
          <h2 className="mt-2 text-3xl font-bold text-primary">
            Good software disappears into the work.
          </h2>
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          {experienceNotes.map((note) => (
            <article key={note.title} className="rounded-2xl border border-border bg-card p-5">
              <h3 className="text-lg font-bold text-primary">{note.title}</h3>
              <p className="mt-2 text-sm leading-7 text-secondary">{note.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-12">
        <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <div>
            <div className="text-xs font-semibold uppercase tracking-widest text-muted">
              Access
            </div>
            <h2 className="mt-2 text-3xl font-bold text-primary">
              The public experience stays open. The operational workspace stays protected.
            </h2>
            <p className="mt-4 text-base leading-7 text-secondary">
              Buyers can browse farms, products, and traceability details.
              Anything that involves editing records, managing stock, or running
              the farm is kept behind the sign-in screen.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-border bg-surface p-5">
              <h3 className="text-lg font-bold text-primary">Open to everyone</h3>
              <p className="mt-2 text-sm leading-6 text-secondary">
                Home, about, features, farms, products, and traceability lookup.
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-surface p-5">
              <h3 className="text-lg font-bold text-primary">Protected by login</h3>
              <p className="mt-2 text-sm leading-6 text-secondary">
                Operations, fields, inventory, sales, livestock, and team management.
              </p>
            </div>
          </div>
        </div>
      </section>
    </PublicSiteShell>
  );
}
