import PublicImage from "@/app/components/public/PublicImage";
import PublicSiteShell from "@/app/components/public/PublicSiteShell";
import {
  formatNumber,
  getPublicSiteData,
  publicSiteImages,
} from "@/app/lib/public-site";
import { ArrowRight, MapPin } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function FarmsPage() {
  const data = await getPublicSiteData();

  return (
    <PublicSiteShell>
      <section className="border-b border-border bg-surface">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 py-10 lg:grid-cols-[0.96fr_1.04fr] lg:items-center">
          <div>
            <div className="section-kicker">Farms</div>
            <h1 className="mt-3 text-4xl font-semibold leading-tight text-primary sm:text-5xl">
              Meet the farms behind the products.
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-secondary">
              Each farm manages its own workspace, team, fields, products, and records.
              That makes the directory feel coherent even as more producers join.
            </p>
          </div>
          <div className="relative min-h-[380px] overflow-hidden rounded-[28px] border border-border shadow-[0_26px_60px_rgba(30,41,33,0.12)]">
            <PublicImage
              src={publicSiteImages.farmsHero}
              alt="Working farm landscape"
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
            <div className="text-3xl font-semibold text-primary">{formatNumber(data.totals.farms)}</div>
            <div className="mt-1 text-sm text-secondary">active farm workspaces</div>
          </div>
          <div className="surface-panel-soft p-5">
            <div className="text-3xl font-semibold text-primary">{formatNumber(data.totals.weatherStations)}</div>
            <div className="mt-1 text-sm text-secondary">weather stations tracked</div>
          </div>
          <div className="surface-panel-soft p-5">
            <div className="text-3xl font-semibold text-primary">{formatNumber(data.totals.acreage)}</div>
            <div className="mt-1 text-sm text-secondary">acres under management</div>
          </div>
        </div>
      </section>

      <section className="border-y border-border bg-card">
        <div className="mx-auto max-w-7xl px-5 py-14">
          <div className="mb-8 max-w-3xl">
            <div className="section-kicker">Directory</div>
            <h2 className="mt-3 section-heading">Independent operations, one shared standard for clarity.</h2>
          </div>
          <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
            {data.farms.map((farm, index) => (
              <article key={farm.id} className="surface-panel overflow-hidden">
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
                      <h2 className="text-xl font-semibold text-primary">{farm.name}</h2>
                      <div className="mt-1 flex items-center gap-1.5 text-sm text-muted">
                        <MapPin size={15} />
                        {farm.location ?? "Location not listed"}
                      </div>
                    </div>
                    <div className="badge-green">
                      {farm.acreage ? `${formatNumber(farm.acreage)} acres` : "Farm workspace"}
                    </div>
                  </div>

                  <div className="mt-5 grid grid-cols-4 gap-2 text-center">
                    <div className="surface-inset px-2 py-3">
                      <div className="font-semibold text-primary">{farm._count.products}</div>
                      <div className="text-xs text-muted">products</div>
                    </div>
                    <div className="surface-inset px-2 py-3">
                      <div className="font-semibold text-primary">{farm._count.fields}</div>
                      <div className="text-xs text-muted">fields</div>
                    </div>
                    <div className="surface-inset px-2 py-3">
                      <div className="font-semibold text-primary">{farm._count.animals}</div>
                      <div className="text-xs text-muted">animals</div>
                    </div>
                    <div className="surface-inset px-2 py-3">
                      <div className="font-semibold text-primary">{farm._count.batches}</div>
                      <div className="text-xs text-muted">batches</div>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-3">
                    <Link href="/products" className="btn-ghost">
                      View products
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
            <h3 className="text-lg font-semibold text-primary">Independent workspaces</h3>
            <p className="mt-2 text-sm leading-7 text-secondary">
              Every farm has its own records, staff, and operational context. Nothing feels shared by accident.
            </p>
          </article>
          <article className="surface-panel-soft p-5">
            <h3 className="text-lg font-semibold text-primary">Operational depth</h3>
            <p className="mt-2 text-sm leading-7 text-secondary">
              Fields, animals, batches, and stations give the directory substance instead of filler.
            </p>
          </article>
          <article className="surface-panel-soft p-5">
            <h3 className="text-lg font-semibold text-primary">Built to grow</h3>
            <p className="mt-2 text-sm leading-7 text-secondary">
              The platform can support one farm or many without making the public experience feel bolted together.
            </p>
          </article>
        </div>
      </section>

      <section className="border-t border-border bg-surface">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-14 md:flex-row md:items-center md:justify-between">
          <div className="max-w-2xl">
            <div className="section-kicker">Join the directory</div>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-primary">
              Want your farm listed here?
            </h2>
            <p className="mt-3 text-sm leading-7 text-secondary">
              Set up the workspace, add the farm details, map the operation, and publish products when you are ready.
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
