import PublicSiteShell from "@/app/components/public/PublicSiteShell";
import PublicImage from "@/app/components/public/PublicImage";
import {
  formatCurrency,
  formatNumber,
  getPublicSiteData,
  portalModules,
  publicSiteImages,
} from "@/app/lib/public-site";
import {
  ArrowRight,
  BadgeCheck,
  Beef,
  CloudSun,
  Fingerprint,
  Package,
  Satellite,
  ShieldCheck,
  Sprout,
  Store,
  Wheat,
} from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

const showcase = [
  {
    title: "Weather and crop timing",
    copy:
      "Field-level weather, GDD tracking, and growth stage forecasting for better operational timing.",
    href: "/features",
    Icon: CloudSun,
  },
  {
    title: "Batch traceability",
    copy:
      "Consumer verification with product origin, processing history, and public lookup workflows.",
    href: "/traceability",
    Icon: Fingerprint,
  },
  {
    title: "Drone scouting",
    copy:
      "Flights, orthomosaics, and observations linked back to fields and production decisions.",
    href: "/features",
    Icon: Satellite,
  },
  {
    title: "Inventory and retail",
    copy:
      "Products, stock adjustments, low-stock alerts, and point-of-sale operations in one place.",
    href: "/features",
    Icon: Package,
  },
] as const;

const confidencePoints = [
  {
    title: "Know who grew it",
    copy:
      "Every listing stays attached to a real farm profile with acreage, product mix, and operating context.",
  },
  {
    title: "Follow the batch",
    copy:
      "When traceability matters, buyers can move from product to batch history without friction.",
  },
  {
    title: "See what is current",
    copy:
      "Listings are tied to the same operational records farms use to manage stock and readiness.",
  },
] as const;

const questions = [
  {
    title: "Is this a marketplace or a farm management platform?",
    copy:
      "It is both. Buyers get a clean browsing experience, while farms manage the deeper operational side behind a secure sign-in.",
  },
  {
    title: "Can more than one farm use it?",
    copy:
      "Yes. Each farm runs in its own workspace with separate users, fields, products, and records.",
  },
  {
    title: "What stays public?",
    copy:
      "Farm profiles, product listings, and traceability lookups can be shared publicly. Editing tools and operational workflows stay protected.",
  },
] as const;

export default async function ConsumerHomePage() {
  const data = await getPublicSiteData();
  const featuredProducts = data.products.slice(0, 4);
  const featuredFarms = data.farms.slice(0, 3);

  return (
    <PublicSiteShell>
      <section className="border-b border-border bg-surface">
        <div className="relative mx-auto grid max-w-7xl gap-8 px-5 py-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:py-12">
          <div className="order-2 lg:order-1">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-green/20 bg-green/10 px-3 py-1.5 text-sm font-semibold text-green">
              <BadgeCheck size={16} />
              Built for buyers who care where food comes from
            </div>
            <h1 className="max-w-3xl text-4xl font-extrabold leading-tight text-primary sm:text-5xl lg:text-6xl">
              Shop with a clearer line back to the farm.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-secondary sm:text-lg">
              Browse farms, discover what is in season, and trace products with
              confidence. Each listing is backed by the same system farmers use
              to run the work behind the scenes.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/products" className="btn-primary">
                Browse products
                <ArrowRight size={16} />
              </Link>
              <Link href="/farms" className="btn-ghost">
                Explore farms
                <Store size={16} />
              </Link>
            </div>
            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-border bg-card p-4">
                <div className="text-2xl font-extrabold text-primary">
                  {formatNumber(data.totals.farms)}
                </div>
                <div className="mt-1 text-sm text-secondary">
                  farms represented
                </div>
              </div>
              <div className="rounded-xl border border-border bg-card p-4">
                <div className="text-2xl font-extrabold text-primary">
                  {formatNumber(data.totals.products)}
                </div>
                <div className="mt-1 text-sm text-secondary">
                  products listed
                </div>
              </div>
              <div className="rounded-xl border border-border bg-card p-4">
                <div className="text-2xl font-extrabold text-primary">
                  {formatNumber(data.totals.batches)}
                </div>
                <div className="mt-1 text-sm text-secondary">
                  traceable batches
                </div>
              </div>
            </div>
          </div>

          <div className="order-1 grid gap-4 lg:order-2">
            <div className="relative min-h-[340px] overflow-hidden rounded-[28px] border border-white/30 shadow-[0_24px_80px_rgba(24,40,30,0.16)]">
              <PublicImage
                src={publicSiteImages.homeHero}
                alt="Aerial view of cultivated farmland"
                fill
                className="object-cover"
                priority
              />
              <div className="absolute inset-0 bg-black/20" />
              <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
                <div className="max-w-sm text-2xl font-bold leading-tight">
                  Farm stories up front. The full operation behind every order.
                </div>
                <div className="mt-2 text-sm text-white/80">
                  Farmers publish what is ready to sell while keeping day-to-day
                  work organized in the portal.
                </div>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-border bg-card p-5">
                <ShieldCheck className="mb-4 text-green" size={22} />
                <div className="text-lg font-bold text-primary">
                  Built for growing networks
                </div>
                <p className="mt-2 text-sm leading-6 text-secondary">
                  Every farm gets its own team, records, listings, and field
                  map without sharing operational data with anyone else.
                </p>
              </div>
              <div className="rounded-2xl border border-border bg-card p-5">
                <Wheat className="mb-4 text-amber" size={22} />
                <div className="text-lg font-bold text-primary">
                  {formatNumber(data.totals.acreage)}
                </div>
                <p className="mt-2 text-sm leading-6 text-secondary">
                  acres represented across participating producers.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-12">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-widest text-muted">
              Platform modules
            </div>
            <h2 className="mt-1 text-3xl font-bold text-primary">
              Explore what the platform can do
            </h2>
          </div>
          <Link href="/features" className="text-sm font-semibold text-green no-underline">
            View all features
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {showcase.map(({ title, copy, href, Icon }) => (
            <Link
              href={href}
              key={title}
              className="rounded-2xl border border-border bg-card p-5 no-underline transition-transform duration-200 hover:-translate-y-1"
            >
              <Icon className="mb-4 text-green" size={22} />
              <div className="text-lg font-bold text-primary">{title}</div>
              <p className="mt-2 text-sm leading-6 text-secondary">{copy}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="border-y border-border bg-card">
        <div className="mx-auto max-w-7xl px-5 py-12">
          <div className="mb-8 max-w-3xl">
            <div className="text-xs font-semibold uppercase tracking-widest text-muted">
              How it works
            </div>
            <h2 className="mt-2 text-3xl font-bold text-primary">
              A cleaner buying experience backed by disciplined farm operations.
            </h2>
            <p className="mt-4 text-base leading-7 text-secondary">
              Farms set up their records once, keep stock current, and publish
              batches that buyers can verify. That makes the storefront easier
              to trust and the day-to-day workflow easier to manage.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <article className="rounded-2xl border border-border bg-surface p-5">
              <div className="text-sm font-semibold text-green">01</div>
              <h3 className="mt-3 text-xl font-bold text-primary">Set up the farm</h3>
              <p className="mt-2 text-sm leading-6 text-secondary">
                Add the farm, place the home location, map fields, and bring the
                team into one workspace.
              </p>
            </article>
            <article className="rounded-2xl border border-border bg-surface p-5">
              <div className="text-sm font-semibold text-green">02</div>
              <h3 className="mt-3 text-xl font-bold text-primary">Run the operation</h3>
              <p className="mt-2 text-sm leading-6 text-secondary">
                Track weather, field work, livestock, inventory, and sales
                activity without juggling separate tools.
              </p>
            </article>
            <article className="rounded-2xl border border-border bg-surface p-5">
              <div className="text-sm font-semibold text-green">03</div>
              <h3 className="mt-3 text-xl font-bold text-primary">Share with confidence</h3>
              <p className="mt-2 text-sm leading-6 text-secondary">
                Publish products, keep batches traceable, and give buyers a
                direct path to origin details when they want them.
              </p>
            </article>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-12">
        <div className="mb-8 max-w-3xl">
          <div className="text-xs font-semibold uppercase tracking-widest text-muted">
            Why people return
          </div>
          <h2 className="mt-2 text-3xl font-bold text-primary">
            Clear sourcing should feel simple, not buried in paperwork.
          </h2>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {confidencePoints.map((point) => (
            <article key={point.title} className="rounded-2xl border border-border bg-card p-5">
              <h3 className="text-lg font-bold text-primary">{point.title}</h3>
              <p className="mt-2 text-sm leading-7 text-secondary">{point.copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-border bg-surface">
        <div className="mx-auto max-w-7xl px-5 py-12">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <div className="text-xs font-semibold uppercase tracking-widest text-muted">
                Featured farms
              </div>
              <h2 className="mt-1 text-3xl font-bold text-primary">
                Producers with live operational data
              </h2>
            </div>
            <Link href="/farms" className="text-sm font-semibold text-green no-underline">
              View all farms
            </Link>
          </div>

          <div className="grid gap-5 lg:grid-cols-3">
            {featuredFarms.map((farm, index) => (
              <article
                className="overflow-hidden rounded-[24px] border border-border bg-card"
                key={farm.id}
              >
                <div className="relative aspect-[4/3]">
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
                <div className="p-5">
                  <div className="text-xl font-bold text-primary">
                    {farm.name}
                  </div>
                  <div className="mt-1 text-sm text-muted">
                    {farm.location ?? "Location not listed"}
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-lg bg-surface px-2 py-3">
                      <div className="font-bold text-primary">
                        {farm._count.products}
                      </div>
                      <div className="text-xs text-muted">products</div>
                    </div>
                    <div className="rounded-lg bg-surface px-2 py-3">
                      <div className="font-bold text-primary">
                        {farm._count.fields}
                      </div>
                      <div className="text-xs text-muted">fields</div>
                    </div>
                    <div className="rounded-lg bg-surface px-2 py-3">
                      <div className="font-bold text-primary">
                        {farm._count.weatherStations}
                      </div>
                      <div className="text-xs text-muted">stations</div>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-12">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-widest text-muted">
              Featured products
            </div>
            <h2 className="mt-1 text-3xl font-bold text-primary">
              Consumer-ready listings
            </h2>
          </div>
          <Link href="/products" className="text-sm font-semibold text-green no-underline">
            View all products
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {featuredProducts.map((product, index) => (
            <article
              className="overflow-hidden rounded-2xl border border-border bg-card"
              key={product.id}
            >
              <div className="relative aspect-[4/3]">
                <PublicImage
                  src={
                    index % 2 === 0
                      ? publicSiteImages.productsHero
                      : publicSiteImages.produce
                  }
                  alt={product.name}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="p-5">
                <div className="inline-flex rounded-full bg-blue/10 px-2.5 py-1 text-xs font-semibold text-blue">
                  {product.category}
                </div>
                <div className="mt-3 text-lg font-bold text-primary">
                  {product.name}
                </div>
                <div className="mt-1 text-sm text-muted">
                  {product.farm.name}
                </div>
                <div className="mt-4 flex items-center justify-between text-sm">
                  <span className="font-bold text-primary">
                    {formatCurrency(product.price)}
                  </span>
                  <span className="text-secondary">
                    {formatNumber(product.stock)} {product.unit}
                  </span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="border-t border-border bg-card">
        <div className="mx-auto grid max-w-7xl gap-6 px-5 py-12 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <div>
            <div className="text-xs font-semibold uppercase tracking-widest text-muted">
              Management portal
            </div>
            <h2 className="mt-1 text-3xl font-bold text-primary">
              Running the farm takes more than a product page.
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-secondary">
              The portal handles field work, compliance, stock, traceability,
              and daily decision-making. These links jump straight into the
              workspace farmers use every day.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/login" className="btn-primary">
                Sign in to portal
                <ArrowRight size={16} />
              </Link>
              <Link href="/features" className="btn-ghost">
                Explore features
                <Sprout size={16} />
              </Link>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {portalModules.slice(0, 4).map((module) => (
              <Link
                href={module.href}
                key={module.title}
                className="rounded-2xl border border-border bg-surface p-4 no-underline transition-colors hover:bg-card"
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
      </section>

      <section className="border-t border-border bg-surface">
        <div className="mx-auto max-w-7xl px-5 py-12">
          <div className="mb-8 max-w-3xl">
            <div className="text-xs font-semibold uppercase tracking-widest text-muted">
              Questions
            </div>
            <h2 className="mt-2 text-3xl font-bold text-primary">
              A few things people usually want to know first.
            </h2>
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            {questions.map((question) => (
              <article key={question.title} className="rounded-2xl border border-border bg-card p-5">
                <h3 className="text-lg font-bold text-primary">{question.title}</h3>
                <p className="mt-2 text-sm leading-7 text-secondary">{question.copy}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </PublicSiteShell>
  );
}
