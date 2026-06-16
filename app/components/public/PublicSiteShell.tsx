"use client";

import FieldPilotLogo from "@/app/components/brand/FieldPilotLogo";
import { ArrowRight, Menu, Search, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState, type ReactNode } from "react";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/features", label: "Features" },
  { href: "/roles", label: "Roles" },
  { href: "/pricing", label: "Pricing" },
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
      <header className="sticky top-0 z-30 border-b border-border bg-[color:var(--bg-glass)]">
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
                  className="text-sm font-medium text-secondary no-underline transition-colors hover:text-primary"
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
                Portal
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
      {drawerOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={closeDrawer}
        />
      )}

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
              className="rounded-xl px-4 py-3 text-base font-medium text-secondary no-underline transition-colors hover:bg-card-hover hover:text-primary"
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
              className="flex items-center justify-center gap-2 rounded-xl bg-green px-4 py-3 text-base font-semibold text-white no-underline"
            >
              Portal
              <ArrowRight size={16} />
            </Link>
          </div>
        </nav>
      </aside>

      {children}

      <footer className="border-t border-border bg-surface">
        <div className="mx-auto grid max-w-7xl gap-6 px-5 py-8 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <FieldPilotLogo size="sm" />
            <p className="mt-2 max-w-2xl text-sm leading-6 text-secondary">
              The operating layer for farms that want stronger product stories,
              cleaner records, and a calmer way to run the day.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            {navItems.map((item) => (
              <Link
                href={item.href}
                key={item.href}
                className="text-sm font-medium text-secondary no-underline transition-colors hover:text-primary"
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/onboard"
              className="text-sm font-semibold text-green no-underline"
            >
              Start a farm account
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
