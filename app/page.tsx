import PublicImage from "@/app/components/public/PublicImage";
import PublicSiteShell from "@/app/components/public/PublicSiteShell";
import {
  formatNumber,
  getPublicSiteData,
  portalModules,
  publicSiteImages,
} from "@/app/lib/public-site";
import {
  ArrowRight,
  CloudSun,
  Fingerprint,
  Package,
  ShieldCheck,
  Sprout,
  Store,
  Tractor,
  Users,
  Wheat,
} from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

const trustSignals = [
  {
    title: "Farm identity stays visible",
    copy: "Every listing stays attached to a real producer, not a generic catalog entry.",
    Icon: Store,
  },
  {
    title: "Operational data stays current",
    copy: "Products, stock, and batch details come from the same workspace farms use every day.",
    Icon: Package,
  },
  {
    title: "Protected where it matters",
    copy: "Buyers can browse freely while farm operations, edits, and internal records stay behind login.",
    Icon: ShieldCheck,
  },
];

const workflow = [
  {
    title: "Onboard the farm",
    copy: "Create the workspace, add the main location, and bring the first team members in without friction.",
    Icon: Users,
  },
  {
    title: "Map fields and production",
    copy: "Define fields, acreage, crop plans, and the details operators need to run the season well.",
    Icon: Wheat,
  },
  {
    title: "Run the day cleanly",
    copy: "Weather, operations, livestock, inventory, and sales stay connected instead of scattered.",
    Icon: Tractor,
  },
  {
    title: "Publish what is ready",
    copy: "Share products and traceable batches with buyers only when they are ready to go live.",
    Icon: Fingerprint,
  },
];

export default async function ConsumerHomePage() {
  const data = await getPublicSiteData();
  const featuredFarms = data.farms.slice(0, 3);
  const featuredProducts = data.products.slice(0, 4);

  return (
    <PublicSiteShell>
      <section className="border-b border-border bg-surface">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 py-8 lg:grid-cols-[1.02fr_0.98fr] lg:items-center lg:py-12">
          <div>
            <div className="section-kicker">FieldPilot</div>
            <h1 className="mt-3 max-w-3xl text-4xl font-semibold leading-tight text-primary sm:text-5xl lg:text-6xl">
              Better farm operations make for better buying.
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-secondary">
              Browse farms, discover what is ready, and trace products with confidence.
              Behind every listing is a workspace that keeps fields, stock, batches, and day-to-day
              work in order.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/products" className="btn-primary">
                Browse products
                <ArrowRight size={16} />
              </Link>
              <Link href="/farms" className="btn-ghost">
                Meet the farms
              </Link>
            </div>
            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <div className="surface-panel-soft p-4">
                <div className="text-3xl font-semibold text-primary">{formatNumber(data.totals.farms)}</div>
                <div className="mt-1 text-sm text-secondary">farm workspaces</div>
              </div>
              <div className="surface-panel-soft p-4">
                <div className="text-3xl font-semibold text-primary">{formatNumber(data.totals.products)}</div>
                <div className="mt-1 text-sm text-secondary">listed products</div>
              </div>
              <div className="surface-panel-soft p-4">
                <div className="text-3xl font-semibold text-primary">{formatNumber(data.totals.batches)}</div>
                <div className="mt-1 text-sm text-secondary">tracked batches</div>
              </div>
            </div>
          </div>

          <div className="grid gap-4">
            <div className="relative min-h-[360px] overflow-hidden rounded-[28px] border border-border shadow-[0_30px_70px_rgba(30,41,33,0.14)]">
              <PublicImage
                src={publicSiteImages.homeHero}
                alt="Aerial view of cultivated farmland"
                fill
                className="object-cover"
                priority
              />
              <div className="absolute inset-0 bg-black/18" />
              <div className="absolute inset-x-0 bottom-0 p-6 text-white">
                <div className="max-w-md text-2xl font-semibold leading-tight">
                  One place to run the farm. One clear story to share with buyers.
                </div>
                <p className="mt-3 max-w-md text-sm leading-6 text-white/80">
                  Farms manage the hard operational work in the portal and publish the useful parts
                  out front.
                </p>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="surface-panel-soft p-5">
                <CloudSun className="text-green" size={22} />
                <div className="mt-4 text-lg font-semibold text-primary">Sharper timing</div>
                <p className="mt-2 text-sm leading-6 text-secondary">
                  Weather, field conditions, and crop timing stay close to the decisions they affect.
                </p>
              </div>
              <div className="surface-panel-soft p-5">
                <Sprout className="text-amber" size={22} />
                <div className="mt-4 text-lg font-semibold text-primary">
                  {formatNumber(data.totals.acreage)} acres represented
                </div>
                <p className="mt-2 text-sm leading-6 text-secondary">
                  A growing network of producers can operate separately without fragmenting the catalog.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-14">
        <div className="mb-8 max-w-3xl">
          <div className="section-kicker">What buyers notice</div>
          <h2 className="mt-3 section-heading">The storefront feels calm because the operations behind it are disciplined.</h2>
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          {trustSignals.map(({ title, copy, Icon }) => (
            <article key={title} className="surface-panel p-6">
              <Icon className="text-green" size={22} />
              <h3 className="mt-4 text-xl font-semibold text-primary">{title}</h3>
              <p className="mt-2 text-sm leading-7 text-secondary">{copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-border bg-card">
        <div className="mx-auto max-w-7xl px-5 py-14">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div className="max-w-3xl">
              <div className="section-kicker">How the platform works</div>
              <h2 className="mt-3 section-heading">A straight path from setup to selling.</h2>
            </div>
            <Link href="/features" className="hidden text-sm font-semibold text-green no-underline md:inline-flex">
              See the full feature guide
            </Link>
          </div>
          <div className="grid gap-4 lg:grid-cols-4">
            {workflow.map(({ title, copy, Icon }, index) => (
              <article key={title} className="surface-panel-soft p-5">
                <div className="flex items-center justify-between gap-3">
                  <Icon size={20} className="text-green" />
                  <span className="text-xs font-semibold text-muted">0{index + 1}</span>
                </div>
                <h3 className="mt-4 text-lg font-semibold text-primary">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-secondary">{copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-14">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div className="max-w-3xl">
            <div className="section-kicker">Management portal</div>
            <h2 className="mt-3 section-heading">The buyer experience sits on top of a full operating layer.</h2>
            <p className="mt-4 section-copy">
              Teams use the portal to manage production, inventory, traceability, and sales without
              making the buyer-facing experience feel technical.
            </p>
          </div>
          <Link href="/login" className="hidden btn-primary md:inline-flex">
            Open portal
          </Link>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {portalModules.map((module) => (
            <Link key={module.title} href={module.href} className="surface-panel p-5 no-underline transition-transform duration-150 hover:-translate-y-0.5">
              <div className="text-lg font-semibold text-primary">{module.title}</div>
              <p className="mt-2 text-sm leading-6 text-secondary">{module.description}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="border-y border-border bg-surface">
        <div className="mx-auto max-w-7xl px-5 py-14">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <div className="section-kicker">Featured now</div>
              <h2 className="mt-3 section-heading">Live farms and current products.</h2>
            </div>
            <Link href="/products" className="text-sm font-semibold text-green no-underline">
              View all products
            </Link>
          </div>

          <div className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr]">
            <div className="grid gap-5 md:grid-cols-2">
              {featuredProducts.map((product, index) => (
                <article key={product.id} className="surface-panel overflow-hidden">
                  <div className="relative aspect-[16/10]">
                    <PublicImage
                      src={index % 2 === 0 ? publicSiteImages.produce : publicSiteImages.productsHero}
                      alt={product.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="p-5">
                    <div className="badge-blue">{product.category}</div>
                    <h3 className="mt-3 text-xl font-semibold text-primary">{product.name}</h3>
                    <p className="mt-1 text-sm leading-6 text-secondary">
                      Listed by {product.farm.name} with current stock and batch-ready tracking.
                    </p>
                    <Link href="/products" className="mt-4 inline-flex text-sm font-semibold text-green no-underline">
                      View product directory
                    </Link>
                  </div>
                </article>
              ))}
            </div>

            <div className="grid gap-4">
              {featuredFarms.map((farm, index) => (
                <article key={farm.id} className="surface-panel flex flex-col overflow-hidden sm:flex-row">
                  <div className="relative min-h-[180px] sm:w-44">
                    <PublicImage
                      src={
                        index === 0
                          ? publicSiteImages.produce
                          : index === 1
                            ? publicSiteImages.livestock
                            : publicSiteImages.soil
                      }
                      alt={farm.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1 p-5">
                    <h3 className="text-xl font-semibold text-primary">{farm.name}</h3>
                    <p className="mt-1 text-sm leading-6 text-secondary">
                      {farm.location ?? "Location not listed"}{farm.acreage ? ` - ${formatNumber(farm.acreage)} acres` : ""}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2 text-xs text-muted">
                      <span className="badge-green">{farm._count.products} products</span>
                      <span className="badge-amber">{farm._count.fields} fields</span>
                      <span className="badge-purple">{farm._count.batches} batches</span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-14 md:flex-row md:items-center md:justify-between">
        <div className="max-w-2xl">
          <div className="section-kicker">For farm teams</div>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-primary">
            Ready to run your own workspace?
          </h2>
          <p className="mt-3 text-sm leading-7 text-secondary">
            Set up the farm, invite the team, map fields, and publish products when the operation is ready.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link href="/features" className="btn-ghost">
            Explore features
          </Link>
          <Link href="/login" className="btn-primary">
            Open management portal
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>
    </PublicSiteShell>
  );
}
