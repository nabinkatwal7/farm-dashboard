import PublicSiteShell from "@/app/components/public/PublicSiteShell";
import PublicImage from "@/app/components/public/PublicImage";
import { publicSiteImages } from "@/app/lib/public-site";
import { Check, Minus } from "lucide-react";

type FeatureTier = {
  name: string;
  monthly: number;
  annualMonthly: number;
  badge?: string;
  description: string;
  cta: string;
  ctaHref: string;
  highlighted?: boolean;
};

type Feature = {
  label: string;
  free?: boolean;
  starter?: boolean;
  growth?: boolean;
  enterprise?: boolean;
};

const FEATURE_ROWS: Feature[] = [
  { label: "Farm workspace", free: true, starter: true, growth: true, enterprise: true },
  { label: "Field mapping (up to 5 fields)", free: true, starter: true, growth: true, enterprise: true },
  { label: "Weather & GDD tracking", free: true, starter: true, growth: true, enterprise: true },
  { label: "Basic crop records", free: true, starter: true, growth: true, enterprise: true },
  { label: "Public traceability portal", free: true, starter: true, growth: true, enterprise: true },
  { label: "Up to 2 team members", free: true, starter: false, growth: false, enterprise: false },
  { label: "Inventory (up to 20 items)", free: true, starter: false, growth: false, enterprise: false },
  { label: "Community support (email)", free: true, starter: false, growth: false, enterprise: false },
  { label: "Field mapping (unlimited)", free: false, starter: true, growth: true, enterprise: true },
  { label: "Up to 6 team members", free: false, starter: true, growth: false, enterprise: false },
  { label: "Machine & task management", free: false, starter: true, growth: true, enterprise: true },
  { label: "Soil moisture & irrigation", free: false, starter: true, growth: true, enterprise: true },
  { label: "Inventory & batch records", free: false, starter: true, growth: true, enterprise: true },
  { label: "Animal registry & health records", free: false, starter: true, growth: true, enterprise: true },
  { label: "Seeding zones & prescriptions", free: false, starter: true, growth: true, enterprise: true },
  { label: "Priority email support", free: false, starter: true, growth: false, enterprise: false },
  { label: "Up to 20 team members", free: false, starter: false, growth: true, enterprise: false },
  { label: "Drone flight & scouting logs", free: false, starter: false, growth: true, enterprise: true },
  { label: "RFID & traceability sync", free: false, starter: false, growth: true, enterprise: true },
  { label: "Drydown simulator", free: false, starter: false, growth: true, enterprise: true },
  { label: "Product listings & POS", free: false, starter: false, growth: true, enterprise: true },
  { label: "Growth stage forecasting", free: false, starter: false, growth: true, enterprise: true },
  { label: "Chat & phone support", free: false, starter: false, growth: true, enterprise: false },
  { label: "Unlimited team members", free: false, starter: false, growth: false, enterprise: true },
  { label: "Custom roles & permissions", free: false, starter: false, growth: false, enterprise: true },
  { label: "Multi-farm management", free: false, starter: false, growth: false, enterprise: true },
  { label: "API access & webhooks", free: false, starter: false, growth: false, enterprise: true },
  { label: "Dedicated account manager", free: false, starter: false, growth: false, enterprise: true },
  { label: "SSO / SAML", free: false, starter: false, growth: false, enterprise: true },
  { label: "Custom integrations", free: false, starter: false, growth: false, enterprise: true },
  { label: "SLA & priority response", free: false, starter: false, growth: false, enterprise: true },
];

const TIERS: FeatureTier[] = [
  {
    name: "Free",
    monthly: 0,
    annualMonthly: 0,
    badge: "Get started",
    description: "Essential tools for a small farm getting organised.",
    cta: "Start free",
    ctaHref: "/onboard",
  },
  {
    name: "Starter",
    monthly: 29,
    annualMonthly: 24,
    description: "Core farm management for growing operations.",
    cta: "Start trial",
    ctaHref: "/onboard",
    highlighted: true,
  },
  {
    name: "Growth",
    monthly: 79,
    annualMonthly: 65,
    description: "Full platform for commercial farms with diverse operations.",
    cta: "Start trial",
    ctaHref: "/onboard",
  },
  {
    name: "Enterprise",
    monthly: 199,
    annualMonthly: 165,
    description: "Custom deployment for large estates and multi-farm groups.",
    cta: "Contact sales",
    ctaHref: "/onboard",
  },
];

export default function PricingPage() {
  return (
    <PublicSiteShell>
      <section className="border-b border-border bg-surface">
        <div className="mx-auto max-w-7xl px-5 py-10">
          <div className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted">
            Pricing
          </div>
          <h1 className="text-4xl font-extrabold leading-tight text-primary sm:text-5xl">
            Plans that scale with the farm.
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-7 text-secondary">
            Every plan includes field mapping, weather data, crop records, and
            the public traceability portal. Upgrade when you need more team
            members, modules, or enterprise controls.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-12">
        <div className="mb-8 flex items-center justify-center gap-3 text-sm">
          <span className="font-medium text-secondary">Monthly</span>
          <span className="inline-flex h-6 w-10 items-center justify-center rounded-full bg-green/20 px-3 text-[11px] font-semibold text-green">
            -17%
          </span>
          <span className="font-medium text-primary">Annual (save ~2 months)</span>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {TIERS.map((tier) => {
            const featureFlags = FEATURE_ROWS.map(
              (f) =>
                (f[tier.name.toLowerCase() as keyof Feature] as boolean | undefined) ??
                false,
            );

            return (
              <article
                key={tier.name}
                className={`relative flex flex-col rounded-2xl border p-5 ${
                  tier.highlighted
                    ? "border-green/50 bg-card ring-2 ring-green/10"
                    : "border-border bg-surface"
                }`}
              >
                {tier.badge && (
                  <span className="mb-4 inline-block self-start rounded-full bg-green/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-green">
                    {tier.badge}
                  </span>
                )}

                <h2 className="text-xl font-extrabold text-primary">
                  {tier.name}
                </h2>
                <p className="mt-1 text-sm leading-5 text-secondary">
                  {tier.description}
                </p>

                <div className="mt-5">
                  <span className="text-4xl font-extrabold text-primary">
                    ${tier.monthly}
                  </span>
                  <span className="ml-1.5 text-sm text-muted">/ month</span>
                  {tier.annualMonthly > 0 && (
                    <div className="mt-0.5 text-xs text-muted">
                      ${tier.annualMonthly}/month billed annually
                    </div>
                  )}
                </div>

                <ul className="mt-6 flex-1 space-y-2.5">
                  {FEATURE_ROWS.map((feature, idx) => {
                    const enabled = featureFlags[idx];
                    return (
                      <li
                        key={feature.label}
                        className={`flex items-start gap-2 text-sm ${
                          enabled ? "text-primary" : "text-muted"
                        }`}
                      >
                        {enabled ? (
                          <Check size={15} className="mt-0.5 shrink-0 text-green" />
                        ) : (
                          <Minus size={15} className="mt-0.5 shrink-0 text-muted" />
                        )}
                        <span>{feature.label}</span>
                      </li>
                    );
                  })}
                </ul>

                <a
                  href={tier.ctaHref}
                  className={`mt-6 block rounded-xl px-4 py-2.5 text-center text-sm font-semibold no-underline ${
                    tier.highlighted
                      ? "bg-green text-white hover:bg-green-dark"
                      : "border border-border bg-surface text-primary hover:bg-card-hover"
                  }`}
                >
                  {tier.cta}
                </a>
              </article>
            );
          })}
        </div>
      </section>

      <section className="border-y border-border bg-surface">
        <div className="mx-auto max-w-7xl px-5 py-12">
          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div>
              <div className="text-xs font-semibold uppercase tracking-widest text-muted">
                Comparison
              </div>
              <h2 className="mt-2 text-3xl font-bold text-primary">
                See exactly what changes between plans.
              </h2>
              <p className="mt-4 text-sm leading-7 text-secondary">
                All plans include a shared set of core tools. The difference is
                scope — how many team members, how many fields, and which
                advanced modules are unlocked.
              </p>
            </div>
            <div className="overflow-hidden rounded-2xl border border-border">
              <div className="relative aspect-[4/3]">
                <PublicImage
                  src={publicSiteImages.produce}
                  alt="Fresh produce from a farm"
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-12">
        <div className="mb-8 max-w-3xl">
          <div className="text-xs font-semibold uppercase tracking-widest text-muted">
            FAQ
          </div>
          <h2 className="mt-2 text-3xl font-bold text-primary">
            Common questions.
          </h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {[
            {
              q: "Can I switch plans mid-billing cycle?",
              a: "Yes. Upgrades apply immediately with a prorated credit. Downgrades take effect at the end of the current billing period.",
            },
            {
              q: "Is there a free trial for paid plans?",
              a: "Starter and Growth plans include a 14-day free trial with full access. No credit card is required to start.",
            },
            {
              q: "What payment methods are accepted?",
              a: "We accept Visa, Mastercard, and American Express. Enterprise invoices can be paid by bank transfer on net-30 terms.",
            },
            {
              q: "Can I export my data if I cancel?",
              a: "Absolutely. You can export all your farm data as CSV at any time, including after cancellation.",
            },
            {
              q: "Do you offer non-profit or educational discounts?",
              a: "Yes. Registered educational institutions and non-profit farms can contact us for a 40% discount on any plan.",
            },
            {
              q: "Is my farm data hosted securely?",
              a: "All data is encrypted at rest and in transit. We use PostgreSQL on Supabase with automated backups, point-in-time recovery, and SOC 2 compliance.",
            },
          ].map(({ q, a }) => (
            <article
              key={q}
              className="rounded-2xl border border-border bg-card p-5"
            >
              <h3 className="text-base font-bold text-primary">{q}</h3>
              <p className="mt-2 text-sm leading-6 text-secondary">{a}</p>
            </article>
          ))}
        </div>
      </section>
    </PublicSiteShell>
  );
}
