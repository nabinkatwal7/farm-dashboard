"use client";

import FieldPilotLogo from "@/app/components/brand/FieldPilotLogo";
import { ArrowRight, ExternalLink, Menu, Search, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState, type ReactNode } from "react";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/features", label: "Features" },
  { href: "/farms", label: "Farms" },
  { href: "/products", label: "Products" },
] as const;

export default function PublicSiteShell({
  children,
}: {
  children: ReactNode;
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const pathname = usePathname();

  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  useEffect(() => {
    closeDrawer();
  }, [pathname, closeDrawer]);

  return (
    <main className="public-site-shell min-h-screen bg-background text-primary">
      <header className="sticky top-0 z-30 border-b border-border bg-[color:var(--bg-glass)] shadow-[0_10px_30px_rgba(30,41,33,0.05)]">
        <div className="mx-auto max-w-7xl px-5 py-4 backdrop-blur-xl">
          <div className="flex items-center justify-between gap-4">
            <Link href="/" className="flex items-center gap-3 no-underline">
              <FieldPilotLogo size="md" />
            </Link>

            <nav className="hidden items-center gap-6 md:flex">
              {navItems.map((item) => (
                <Link
                  href={item.href}
                  key={item.href}
                  className={`rounded-full px-3 py-2 text-sm font-medium no-underline transition-colors ${
                    pathname === item.href
                      ? "bg-card-hover text-primary"
                      : "text-secondary hover:text-primary"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            <div className="flex items-center gap-2">
              <Link href="/traceability" className="btn-ghost hidden md:inline-flex">
                <Search size={16} />
                Trace
              </Link>
              <Link href="/login" className="btn-primary hidden md:inline-flex">
                Management portal
                <ArrowRight size={16} />
              </Link>
              <button
                onClick={() => setDrawerOpen(true)}
                className="btn-ghost md:hidden"
                aria-label="Open navigation"
              >
                <Menu size={20} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile drawer overlay */}
      {drawerOpen && <div className="fixed inset-0 z-40 bg-black/40 md:hidden" onClick={closeDrawer} />}

      {/* Mobile drawer panel */}
      <aside
        className={`fixed right-0 top-0 z-50 flex h-full w-72 flex-col bg-surface shadow-xl transition-transform duration-300 md:hidden ${
          drawerOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <FieldPilotLogo size="sm" />
          <button
            onClick={closeDrawer}
            className="btn-ghost"
            aria-label="Close navigation"
          >
            <X size={20} />
          </button>
        </div>
        <nav className="flex flex-1 flex-col gap-1 p-4">
          {navItems.map((item) => (
            <Link
              href={item.href}
              key={item.href}
              className={`rounded-xl px-4 py-3 text-base font-medium no-underline transition-colors ${
                pathname === item.href
                  ? "bg-card-hover text-primary"
                  : "text-secondary hover:bg-card-hover hover:text-primary"
              }`}
            >
              {item.label}
            </Link>
          ))}
          <div className="mt-auto space-y-2 pt-4">
            <Link
              href="/traceability"
              className="flex items-center justify-center gap-2 rounded-xl border border-border px-4 py-3 text-base font-medium text-secondary no-underline transition-colors hover:bg-card-hover hover:text-primary"
            >
              <Search size={16} />
              Trace
            </Link>
            <Link
              href="/login"
              className="btn-primary w-full"
            >
              Management portal
              <ArrowRight size={16} />
            </Link>
          </div>
        </nav>
      </aside>

      {children}

      <footer className="border-t border-border bg-surface">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 py-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
            <FieldPilotLogo size="sm" />
            <p className="mt-3 max-w-2xl text-sm leading-6 text-secondary">
              FieldPilot gives modern farms a calm operating layer for field work,
              inventory, product readiness, and buyer-facing trust.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <div className="section-kicker">Explore</div>
              <div className="mt-3 flex flex-col gap-2">
                {navItems.map((item) => (
                  <Link
                    href={item.href}
                    key={item.href}
                    className="text-sm font-medium text-secondary no-underline transition-colors hover:text-primary"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
            <div>
              <div className="section-kicker">For farms</div>
              <div className="mt-3 flex flex-col gap-2">
                <Link href="/login" className="inline-flex items-center gap-2 text-sm font-semibold text-primary no-underline">
                  Open management portal
                  <ExternalLink size={14} />
                </Link>
                <Link href="/onboard" className="text-sm font-medium text-secondary no-underline transition-colors hover:text-primary">
                  Create a farm account
                </Link>
                <Link href="/traceability" className="text-sm font-medium text-secondary no-underline transition-colors hover:text-primary">
                  Batch lookup
                </Link>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
