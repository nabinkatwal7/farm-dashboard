import PublicSiteShell from "@/app/components/public/PublicSiteShell";
import PublicImage from "@/app/components/public/PublicImage";
import {
  formatCurrency,
  formatNumber,
  getPublicSiteData,
  publicSiteImages,
} from "@/app/lib/public-site";
import { ArrowRight, Fingerprint, MapPin, ShoppingBag } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function ProductsPage() {
  const data = await getPublicSiteData();

  return (
    <PublicSiteShell>
      <section className="border-b border-border bg-surface">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 py-10 lg:grid-cols-[1fr_1fr] lg:items-center">
          <div>
            <div className="text-xs font-semibold uppercase tracking-widest text-muted">
              Products
            </div>
            <h1 className="mt-2 text-4xl font-extrabold leading-tight text-primary sm:text-5xl">
              Fresh listings backed by real farm data.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-secondary">
              These products come straight from farms managing stock, batches,
              and production records inside FieldPilot, so buyers get cleaner
              listings and stronger traceability.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {data.categories.map((category) => (
                <span className="badge-blue" key={category.category}>
                  {category.category}: {category._count._all}
                </span>
              ))}
            </div>
          </div>
          <div className="relative min-h-[360px] overflow-hidden rounded-[28px] border border-border">
            <PublicImage
              src={publicSiteImages.productsHero}
              alt="Crates of fresh produce"
              fill
              className="object-cover"
              priority
            />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-12">
        <div className="mb-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="text-3xl font-extrabold text-primary">
              {formatNumber(data.totals.products)}
            </div>
            <div className="mt-1 text-sm text-secondary">listed products</div>
          </div>
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="text-3xl font-extrabold text-primary">
              {formatNumber(data.totals.batches)}
            </div>
            <div className="mt-1 text-sm text-secondary">traceable batches</div>
          </div>
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="text-3xl font-extrabold text-primary">
              {formatNumber(data.categories.length)}
            </div>
            <div className="mt-1 text-sm text-secondary">product categories</div>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {data.products.map((product, index) => (
            <article
              key={product.id}
              className="overflow-hidden rounded-[24px] border border-border bg-card"
            >
              <div className="relative aspect-[16/10]">
                <PublicImage
                  src={
                    index % 3 === 0
                      ? publicSiteImages.produce
                      : index % 3 === 1
                        ? publicSiteImages.productsHero
                        : publicSiteImages.homeHero
                  }
                  alt={product.name}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="inline-flex rounded-full bg-blue/10 px-2.5 py-1 text-xs font-semibold text-blue">
                      {product.category}
                    </div>
                    <h2 className="mt-3 text-xl font-bold text-primary">
                      {product.name}
                    </h2>
                    <div className="mt-1 flex items-center gap-1.5 text-sm text-muted">
                      <MapPin size={15} />
                      {product.farm.location ?? product.farm.name}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-primary">
                      {formatCurrency(product.price)}
                    </div>
                    <div className="text-xs text-muted">
                      {formatNumber(product.stock)} {product.unit}
                    </div>
                  </div>
                </div>

                <div className="mt-5 grid gap-2 sm:grid-cols-2">
                  <Link href="/traceability" className="btn-ghost">
                    <Fingerprint size={15} />
                    Trace batch
                  </Link>
                  <Link href="/login" className="btn-ghost">
                    <ShoppingBag size={15} />
                    Sign in
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="border-t border-border bg-surface">
        <div className="mx-auto max-w-7xl px-5 py-12">
          <div className="mb-8 max-w-3xl">
            <div className="text-xs font-semibold uppercase tracking-widest text-muted">
              What makes a stronger listing
            </div>
            <h2 className="mt-2 text-3xl font-bold text-primary">
              Better product pages start with better farm records.
            </h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <article className="rounded-2xl border border-border bg-card p-5">
              <h3 className="text-lg font-bold text-primary">Clear category and unit</h3>
              <p className="mt-2 text-sm leading-7 text-secondary">
                Shoppers should know at a glance what is being sold and how it
                is measured.
              </p>
            </article>
            <article className="rounded-2xl border border-border bg-card p-5">
              <h3 className="text-lg font-bold text-primary">Reliable stock view</h3>
              <p className="mt-2 text-sm leading-7 text-secondary">
                Listings feel more trustworthy when availability is connected to
                live inventory rather than separate manual updates.
              </p>
            </article>
            <article className="rounded-2xl border border-border bg-card p-5">
              <h3 className="text-lg font-bold text-primary">Traceability when needed</h3>
              <p className="mt-2 text-sm leading-7 text-secondary">
                Some products need a quicker sales path. Others need proof of
                origin. The platform supports both.
              </p>
            </article>
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-card">
        <div className="mx-auto grid max-w-7xl gap-4 px-5 py-12 md:grid-cols-3">
          <div className="rounded-2xl border border-border bg-surface p-5">
            <h2 className="text-lg font-bold text-primary">Ready-to-sell listings</h2>
            <p className="mt-2 text-sm leading-6 text-secondary">
              Product pages stay tied to stock, category, and farm details so
              shoppers see information that is actually current.
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-surface p-5">
            <h2 className="text-lg font-bold text-primary">Batch transparency</h2>
            <p className="mt-2 text-sm leading-6 text-secondary">
              Traceability is available when a product needs a stronger proof of
              origin or production history.
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-surface p-5">
            <h2 className="text-lg font-bold text-primary">Operational control</h2>
            <p className="mt-2 text-sm leading-6 text-secondary">
              Farms keep the deeper inventory, sales, and compliance tools
              inside the protected workspace.
            </p>
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-surface">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-10 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-primary">
              Listings stay in sync with the work happening on the farm.
            </h2>
            <p className="mt-2 text-sm leading-6 text-secondary">
              Product setup, stock levels, and sales activity are managed in the
              portal and reflected here automatically.
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
        </div>
      </section>
    </PublicSiteShell>
  );
}
