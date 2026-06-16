import PublicSiteShell from "@/app/components/public/PublicSiteShell";
import PublicImage from "@/app/components/public/PublicImage";
import {
  formatNumber,
  getPublicSiteData,
  publicSiteImages,
} from "@/app/lib/public-site";
import { ArrowRight, MapPin, Package, Wheat } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function FarmsPage() {
  const data = await getPublicSiteData();

  return (
    <PublicSiteShell>
      <section className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0">
          <PublicImage
            src={publicSiteImages.farmsHero}
            alt="Green farm landscape"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-black/35" />
        </div>
        <div className="relative mx-auto max-w-7xl px-5 py-16 text-white lg:py-24">
          <div className="max-w-3xl">
            <div className="text-xs font-semibold uppercase tracking-widest text-white/70">
              Farms
            </div>
            <h1 className="mt-2 text-4xl font-extrabold leading-tight sm:text-5xl">
              Meet the farms behind the harvest.
            </h1>
            <p className="mt-5 text-base leading-7 text-white/80">
              From field crops to livestock operations, every farm here manages
              its own records, products, and daily work in one connected system.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-12">
        <div className="mb-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="text-3xl font-extrabold text-primary">
              {formatNumber(data.totals.farms)}
            </div>
            <div className="mt-1 text-sm text-secondary">active farm workspaces</div>
          </div>
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="text-3xl font-extrabold text-primary">
              {formatNumber(data.totals.weatherStations)}
            </div>
            <div className="mt-1 text-sm text-secondary">weather stations tracked</div>
          </div>
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="text-3xl font-extrabold text-primary">
              {formatNumber(data.totals.acreage)}
            </div>
            <div className="mt-1 text-sm text-secondary">acres under management</div>
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
          {data.farms.map((farm, index) => (
            <article
              className="overflow-hidden rounded-[24px] border border-border bg-card"
              key={farm.id}
            >
              <div className="relative aspect-[16/10]">
                <PublicImage
                  src={
                    index % 3 === 0
                      ? publicSiteImages.produce
                      : index % 3 === 1
                        ? publicSiteImages.livestock
                        : publicSiteImages.soil
                  }
                  alt={farm.name}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-bold text-primary">{farm.name}</h2>
                    <div className="mt-1 flex items-center gap-1.5 text-sm text-muted">
                      <MapPin size={15} />
                      {farm.location ?? "Location not listed"}
                    </div>
                  </div>
                  <div className="rounded-full bg-green/10 px-2.5 py-1 text-xs font-semibold text-green">
                    {farm.acreage ? `${formatNumber(farm.acreage)} acres` : "Farm workspace"}
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-4 gap-2 text-center">
                  <div className="rounded-lg bg-surface px-2 py-3">
                    <div className="font-bold text-primary">{farm._count.products}</div>
                    <div className="text-xs text-muted">products</div>
                  </div>
                  <div className="rounded-lg bg-surface px-2 py-3">
                    <div className="font-bold text-primary">{farm._count.fields}</div>
                    <div className="text-xs text-muted">fields</div>
                  </div>
                  <div className="rounded-lg bg-surface px-2 py-3">
                    <div className="font-bold text-primary">{farm._count.animals}</div>
                    <div className="text-xs text-muted">animals</div>
                  </div>
                  <div className="rounded-lg bg-surface px-2 py-3">
                    <div className="font-bold text-primary">{farm._count.batches}</div>
                    <div className="text-xs text-muted">batches</div>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  <Link href="/products" className="btn-ghost">
                    <Package size={15} />
                    Products
                  </Link>
                  <Link href="/login" className="btn-ghost">
                    <Wheat size={15} />
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
              What to expect
            </div>
            <h2 className="mt-2 text-3xl font-bold text-primary">
              Each farm profile is meant to give useful signal, not filler.
            </h2>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <article className="rounded-2xl border border-border bg-card p-5">
              <h3 className="text-lg font-bold text-primary">Products in context</h3>
              <p className="mt-2 text-sm leading-7 text-secondary">
                Buyers can see how broad a farm’s offering is without leaving
                the profile and starting over.
              </p>
            </article>
            <article className="rounded-2xl border border-border bg-card p-5">
              <h3 className="text-lg font-bold text-primary">Operational depth</h3>
              <p className="mt-2 text-sm leading-7 text-secondary">
                Field counts, animals, stations, and batches point to how the
                operation is actually being managed.
              </p>
            </article>
            <article className="rounded-2xl border border-border bg-card p-5">
              <h3 className="text-lg font-bold text-primary">Room to grow</h3>
              <p className="mt-2 text-sm leading-7 text-secondary">
                The directory works for one farm or many, so the catalog can
                expand without feeling stitched together.
              </p>
            </article>
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-card">
        <div className="mx-auto grid max-w-7xl gap-4 px-5 py-12 md:grid-cols-3">
          <div className="rounded-2xl border border-border bg-surface p-5">
            <h2 className="text-lg font-bold text-primary">Independent workspaces</h2>
            <p className="mt-2 text-sm leading-6 text-secondary">
              Each farm keeps its own staff, records, products, and field data
              without crossing into another operation.
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-surface p-5">
            <h2 className="text-lg font-bold text-primary">Operational depth</h2>
            <p className="mt-2 text-sm leading-6 text-secondary">
              Listings are backed by real field activity, weather data,
              livestock logs, and inventory discipline.
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-surface p-5">
            <h2 className="text-lg font-bold text-primary">Buyer transparency</h2>
            <p className="mt-2 text-sm leading-6 text-secondary">
              Farms can share product information clearly while keeping private
              workflows behind a login.
            </p>
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-surface">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-10 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-primary">
              Want your farm listed here?
            </h2>
            <p className="mt-2 text-sm leading-6 text-secondary">
              Set up your farm account, add your products, and start sharing
              traceable records with customers.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/features" className="btn-ghost">
              Explore features
            </Link>
            <Link href="/onboard" className="btn-primary">
              Create farm account
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>
    </PublicSiteShell>
  );
}
