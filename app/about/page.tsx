import PublicImage from "@/app/components/public/PublicImage";
import PublicSiteShell from "@/app/components/public/PublicSiteShell";
import {
  getPublicSiteData,
  portalModules,
  publicSiteImages,
} from "@/app/lib/public-site";
import { CloudSun, Fingerprint, Package, Sprout, Users } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

const principles = [
  {
    title: "Useful before decorative",
    body: "The product is designed to reduce friction in real farm work, not just present a neat dashboard.",
  },
  {
    title: "One shared source of truth",
    body: "Field work, inventory, livestock, products, and traceability should not drift apart into separate stories.",
  },
  {
    title: "Clear for buyers, controlled for teams",
    body: "What needs to be public stays easy to browse. What needs operational discipline stays protected.",
  },
];

export default async function AboutPage() {
  const data = await getPublicSiteData();

  return (
    <PublicSiteShell>
      <section className="border-b border-border bg-surface">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 py-10 lg:grid-cols-[0.98fr_1.02fr] lg:items-center">
          <div>
            <div className="section-kicker">About</div>
            <h1 className="mt-3 text-4xl font-semibold leading-tight text-primary sm:text-5xl">
              Built for farms that need structure behind the scenes and clarity out front.
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-secondary">
              FieldPilot brings together operations, inventory, field data, product readiness,
              and traceability so the public-facing experience can stay simple without becoming shallow.
            </p>
          </div>
          <div className="relative min-h-[380px] overflow-hidden rounded-[28px] border border-border shadow-[0_26px_60px_rgba(30,41,33,0.12)]">
            <PublicImage
              src={publicSiteImages.aboutHero}
              alt="Rows of produce growing in a managed farm field"
              fill
              className="object-cover"
            />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-14">
        <div className="mb-8 max-w-3xl">
          <div className="section-kicker">What the platform connects</div>
          <h2 className="mt-3 section-heading">One system can carry the farm from planning to proof of origin.</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <article className="surface-panel p-5">
            <Users className="text-green" size={22} />
            <h3 className="mt-4 text-lg font-semibold text-primary">Farm setup and teams</h3>
            <p className="mt-2 text-sm leading-6 text-secondary">
              Separate workspaces, cleaner onboarding, and role-based access for operators and managers.
            </p>
          </article>
          <article className="surface-panel p-5">
            <CloudSun className="text-blue" size={22} />
            <h3 className="mt-4 text-lg font-semibold text-primary">Crop timing and weather</h3>
            <p className="mt-2 text-sm leading-6 text-secondary">
              Field conditions, weather guidance, and seasonal timing stay close to the work they affect.
            </p>
          </article>
          <article className="surface-panel p-5">
            <Package className="text-amber" size={22} />
            <h3 className="mt-4 text-lg font-semibold text-primary">Inventory and products</h3>
            <p className="mt-2 text-sm leading-6 text-secondary">
              Product listings and stock position stay in sync instead of being maintained in parallel.
            </p>
          </article>
          <article className="surface-panel p-5">
            <Fingerprint className="text-purple" size={22} />
            <h3 className="mt-4 text-lg font-semibold text-primary">Traceability and trust</h3>
            <p className="mt-2 text-sm leading-6 text-secondary">
              Buyers can verify origin when needed without exposing the whole operating system.
            </p>
          </article>
        </div>
      </section>

      <section className="border-y border-border bg-card">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 py-14 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="overflow-hidden rounded-[24px] border border-border shadow-[0_18px_40px_rgba(30,41,33,0.08)]">
              <div className="relative aspect-[4/5]">
                <PublicImage src={publicSiteImages.drone} alt="Drone flying above a field" fill className="object-cover" />
              </div>
            </div>
            <div className="overflow-hidden rounded-[24px] border border-border shadow-[0_18px_40px_rgba(30,41,33,0.08)]">
              <div className="relative aspect-[4/5]">
                <PublicImage src={publicSiteImages.livestock} alt="Livestock in pasture" fill className="object-cover" />
              </div>
            </div>
          </div>

          <div>
            <div className="section-kicker">Inside the portal</div>
            <h2 className="mt-3 section-heading">Teams run the details here so buyers do not have to decode them later.</h2>
            <p className="mt-4 section-copy">
              The portal is where farms manage fields, seed, livestock, stock, sales, weather stations,
              and daily activity. That operational depth is what makes the public-facing experience trustworthy.
            </p>
            <div className="mt-6 grid gap-3 md:grid-cols-2">
              {portalModules.slice(0, 4).map((module) => (
                <Link key={module.title} href={module.href} className="surface-panel-soft p-4 no-underline transition-colors hover:bg-card-hover">
                  <div className="text-base font-semibold text-primary">{module.title}</div>
                  <p className="mt-2 text-sm leading-6 text-secondary">{module.description}</p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-14">
        <div className="mb-8 max-w-3xl">
          <div className="section-kicker">Principles</div>
          <h2 className="mt-3 section-heading">The product should feel calm because the work is already demanding enough.</h2>
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          {principles.map((principle) => (
            <article key={principle.title} className="surface-panel p-6">
              <h3 className="text-xl font-semibold text-primary">{principle.title}</h3>
              <p className="mt-3 text-sm leading-7 text-secondary">{principle.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-t border-border bg-surface">
        <div className="mx-auto grid max-w-7xl gap-4 px-5 py-14 md:grid-cols-4">
          <div className="surface-panel-soft p-5">
            <div className="text-3xl font-semibold text-primary">{data.totals.farms}</div>
            <div className="mt-1 text-sm text-secondary">farm workspaces</div>
          </div>
          <div className="surface-panel-soft p-5">
            <div className="text-3xl font-semibold text-primary">{data.totals.products}</div>
            <div className="mt-1 text-sm text-secondary">listed products</div>
          </div>
          <div className="surface-panel-soft p-5">
            <div className="text-3xl font-semibold text-primary">{data.totals.batches}</div>
            <div className="mt-1 text-sm text-secondary">tracked batches</div>
          </div>
          <div className="surface-panel-soft p-5">
            <Sprout className="text-green" size={22} />
            <div className="mt-4 text-lg font-semibold text-primary">Built to scale across farms</div>
            <div className="mt-1 text-sm leading-6 text-secondary">
              Independent workspaces keep growth from turning into confusion.
            </div>
          </div>
        </div>
      </section>
    </PublicSiteShell>
  );
}
