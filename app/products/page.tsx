import PublicImage from "@/app/components/public/PublicImage";
import PublicSiteShell from "@/app/components/public/PublicSiteShell";
import {
  formatCurrency,
  formatNumber,
  getPublicSiteData,
  publicSiteImages,
} from "@/app/lib/public-site";
import { ArrowRight, Fingerprint, MapPin } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function ProductsPage() {
  const data = await getPublicSiteData();

  return (
    <PublicSiteShell>
      <section className="border-b border-border bg-surface">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 py-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <div>
            <div className="section-kicker">Products</div>
            <h1 className="mt-3 text-4xl font-semibold leading-tight text-primary sm:text-5xl">
              Product listings that feel current because they are tied to real farm operations.
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-secondary">
              These listings come from farms managing inventory, batches, and day-to-day activity in the same system.
              The result is a cleaner catalog and stronger traceability.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {data.categories.map((category) => (
                <span className="badge-blue" key={category.category}>
                  {category.category}: {category._count._all}
                </span>
              ))}
            </div>
          </div>
          <div className="relative min-h-[380px] overflow-hidden rounded-[28px] border border-border shadow-[0_26px_60px_rgba(30,41,33,0.12)]">
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

      <section className="mx-auto max-w-7xl px-5 py-14">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="surface-panel-soft p-5">
            <div className="text-3xl font-semibold text-primary">{formatNumber(data.totals.products)}</div>
            <div className="mt-1 text-sm text-secondary">listed products</div>
          </div>
          <div className="surface-panel-soft p-5">
            <div className="text-3xl font-semibold text-primary">{formatNumber(data.totals.batches)}</div>
            <div className="mt-1 text-sm text-secondary">traceable batches</div>
          </div>
          <div className="surface-panel-soft p-5">
            <div className="text-3xl font-semibold text-primary">{formatNumber(data.categories.length)}</div>
            <div className="mt-1 text-sm text-secondary">active categories</div>
          </div>
        </div>
      </section>

      <section className="border-y border-border bg-card">
        <div className="mx-auto max-w-7xl px-5 py-14">
          <div className="mb-8 max-w-3xl">
            <div className="section-kicker">Catalog</div>
            <h2 className="mt-3 section-heading">Fresh listings with clear farm context.</h2>
          </div>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {data.products.map((product, index) => (
              <article key={product.id} className="surface-panel overflow-hidden">
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
                      <div className="badge-blue">{product.category}</div>
                      <h2 className="mt-3 text-xl font-semibold text-primary">{product.name}</h2>
                      <div className="mt-1 flex items-center gap-1.5 text-sm text-muted">
                        <MapPin size={15} />
                        {product.farm.location ?? product.farm.name}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-semibold text-primary">{formatCurrency(product.price)}</div>
                      <div className="text-xs text-muted">
                        {formatNumber(product.stock)} {product.unit}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 surface-inset px-4 py-3">
                    <div className="text-sm font-medium text-primary">{product.farm.name}</div>
                    <div className="mt-1 text-xs leading-5 text-muted">
                      Managed from the farm workspace with stock, price, and batch visibility kept in sync.
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-3">
                    <Link href="/traceability" className="btn-ghost">
                      <Fingerprint size={15} />
                      Trace batch
                    </Link>
                    <Link href="/login" className="btn-ghost">
                      Open portal
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-14">
        <div className="grid gap-4 md:grid-cols-3">
          <article className="surface-panel-soft p-5">
            <h3 className="text-lg font-semibold text-primary">Clear category and unit</h3>
            <p className="mt-2 text-sm leading-7 text-secondary">
              Buyers should understand what is being sold and how it is measured without second-guessing.
            </p>
          </article>
          <article className="surface-panel-soft p-5">
            <h3 className="text-lg font-semibold text-primary">Reliable stock view</h3>
            <p className="mt-2 text-sm leading-7 text-secondary">
              Listings are more believable when availability comes from live inventory instead of separate manual edits.
            </p>
          </article>
          <article className="surface-panel-soft p-5">
            <h3 className="text-lg font-semibold text-primary">Traceability where it matters</h3>
            <p className="mt-2 text-sm leading-7 text-secondary">
              Some products need a quick path to checkout. Others need proof of origin. The platform supports both.
            </p>
          </article>
        </div>
      </section>

      <section className="border-t border-border bg-surface">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-14 md:flex-row md:items-center md:justify-between">
          <div className="max-w-2xl">
            <div className="section-kicker">For farm teams</div>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-primary">
              Product setup should not drift away from the work on the farm.
            </h2>
            <p className="mt-3 text-sm leading-7 text-secondary">
              Keep listings, stock, and sales discipline in one place, then publish what buyers need to see.
            </p>
          </div>
          <Link href="/login" className="btn-primary">
            Open management portal
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>
    </PublicSiteShell>
  );
}
