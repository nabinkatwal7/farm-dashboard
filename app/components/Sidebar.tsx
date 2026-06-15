"use client";

import {
  Beef,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  CircleDollarSign,
  ClipboardList,
  CloudSun,
  Droplets,
  LayoutDashboard,
  Leaf,
  Package,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  ShieldCheck,
  Satellite,
  ShoppingBag,
  Sprout,
  ShoppingCart,
  UsersRound,
  Wheat,
  Wrench,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

type NavItem = {
  href?: string;
  label: string;
  icon: LucideIcon;
  adminOnly?: boolean;
};

const navSections: Array<{ label: string; items: NavItem[] }> = [
  {
    label: "Operations",
    items: [
      { href: "/", label: "Dashboard", icon: LayoutDashboard },
      { label: "Tasks", icon: ClipboardList },
      { label: "Calendar", icon: CalendarDays },
      { href: "/operations", label: "Operations", icon: Wrench },
    ],
  },
  {
    label: "Production",
    items: [
      { href: "/crops", label: "Crops & Fields", icon: Wheat },
      { href: "/weather", label: "Weather & GDD", icon: CloudSun },
      { href: "/soil", label: "Soil & Moisture", icon: Droplets },
      { href: "/seed", label: "Seed Tracker", icon: Sprout },
      { href: "/drone", label: "Drone Scouting", icon: Satellite },
      { href: "/livestock", label: "Livestock", icon: Beef },
      { href: "/seeding", label: "Precision Farming", icon: Leaf },
    ],
  },
  {
    label: "Commerce",
    items: [
      { href: "/inventory", label: "Inventory", icon: Package },
      { label: "Orders", icon: ShoppingBag },
      { href: "/shop", label: "Shop & POS", icon: ShoppingCart },
      { label: "Customers", icon: UsersRound },
    ],
  },
  {
    label: "Administration",
    items: [
      { href: "/finance", label: "Finance", icon: CircleDollarSign },
      { href: "/users", label: "Users", icon: ShieldCheck, adminOnly: true },
      { label: "Settings", icon: Settings },
    ],
  },
];

type SidebarUser = {
  role: string;
  farm: {
    name: string;
    location: string | null;
    acreage: number | null;
  };
} | null;

export default function Sidebar({
  user,
  collapsed,
  onToggleCollapsed,
}: {
  user: SidebarUser;
  collapsed: boolean;
  onToggleCollapsed: () => void;
}) {
  const pathname = usePathname();
  const canManageUsers =
    user?.role === "ADMIN" || user?.role === "FARM_MANAGER";
  const [openSections, setOpenSections] = useState(() =>
    new Set(navSections.map((section) => section.label))
  );

  function toggleSection(label: string) {
    setOpenSections((current) => {
      const next = new Set(current);
      if (next.has(label)) {
        next.delete(label);
      } else {
        next.add(label);
      }
      return next;
    });
  }

  return (
    <aside
      className={`z-50 flex w-full flex-col overflow-hidden border-b border-border bg-surface transition-[width] duration-200 lg:fixed lg:left-0 lg:top-0 lg:h-screen lg:border-b-0 lg:border-r ${
        collapsed ? "lg:w-20" : "lg:w-[var(--sidebar-width)]"
      }`}
    >
      <div
        className={`relative border-b border-border px-5 py-4 lg:py-6 lg:pb-5 ${
          collapsed ? "lg:px-3" : ""
        }`}
      >
        <div
          className={`flex items-center gap-2.5 ${
            collapsed ? "lg:justify-center" : ""
          }`}
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-border bg-card text-green">
            <Leaf size={20} strokeWidth={2.5} />
          </div>
          <div className={collapsed ? "lg:hidden" : ""}>
            <div className="font-extrabold text-[1.1rem] text-primary leading-none">
              FieldPilot
            </div>
            <div className="text-[0.7rem] text-muted font-medium">
              Management Platform
            </div>
          </div>
        </div>
        <button
          type="button"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          onClick={onToggleCollapsed}
          className="hidden absolute right-3 top-4 h-8 w-8 place-items-center rounded-lg border border-border bg-card text-secondary transition-colors hover:bg-card-hover hover:text-primary lg:grid"
        >
          {collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
        </button>
      </div>

      <div
        className={`hidden border-b border-border px-5 py-3.5 sm:block ${
          collapsed ? "lg:hidden" : ""
        }`}
      >
        <div className="text-[0.7rem] text-muted uppercase tracking-widest mb-1.5">
          Active Farm
        </div>
        <div className="font-semibold text-sm text-primary">
          {user?.farm.name ?? "Farm workspace"}
        </div>
        <div className="text-xs text-muted">
          {user?.farm.location ?? "Location not set"}
          {user?.farm.acreage ? ` · ${user.farm.acreage} acres` : ""}
        </div>
      </div>

      <nav
        className={`flex flex-1 gap-4 overflow-x-auto p-3 lg:flex-col lg:overflow-x-visible ${
          collapsed ? "lg:gap-3 lg:p-3" : "lg:gap-5 lg:p-4"
        }`}
      >
        {navSections.map((section) => {
          const visibleItems = section.items.filter(
            (item) => !item.adminOnly || canManageUsers,
          );
          const sectionOpen = collapsed || openSections.has(section.label);
          return (
            <div key={section.label} className="flex shrink-0 flex-col lg:shrink">
              <button
                type="button"
                onClick={() => toggleSection(section.label)}
                className={`hidden w-full items-center justify-between rounded-lg border border-transparent px-2 py-1 text-left text-[0.65rem] font-semibold uppercase tracking-widest text-muted transition-colors hover:border-border hover:bg-card-hover hover:text-primary lg:flex ${
                  collapsed ? "lg:hidden" : ""
                }`}
                aria-expanded={sectionOpen}
              >
                <span>{section.label}</span>
                {sectionOpen ? (
                  <ChevronDown size={13} />
                ) : (
                  <ChevronRight size={13} />
                )}
              </button>
              <div
                className={`flex gap-2 lg:flex-col lg:gap-0.5 ${
                  sectionOpen ? "" : "lg:hidden"
                }`}
              >
                {visibleItems.map(({ href, label, icon: Icon }) => {
                  const isActive = href
                    ? href === "/"
                      ? pathname === "/"
                      : pathname.startsWith(href)
                    : false;
                  const className = `flex shrink-0 items-center gap-2.5 rounded-lg border px-3 py-2.5 text-sm no-underline transition-all duration-150 lg:shrink ${
                    collapsed ? "lg:justify-center lg:px-2.5" : ""
                  } ${
                    isActive
                      ? "border-green/25 bg-green/10 text-green font-semibold"
                      : href
                        ? "border-transparent bg-transparent text-secondary hover:border-border hover:bg-card-hover hover:text-primary"
                        : "cursor-not-allowed border-transparent bg-transparent text-muted/60"
                  }`;

                  if (!href) {
                    return (
                      <div
                        key={`${section.label}-${label}`}
                        aria-disabled="true"
                        className={className}
                        title="Coming soon"
                      >
                        <Icon size={18} strokeWidth={1.8} />
                        <span
                          className={`whitespace-nowrap lg:flex-1 ${
                            collapsed ? "lg:hidden" : ""
                          }`}
                        >
                          {label}
                        </span>
                      </div>
                    );
                  }

                  return (
                    <Link key={`${section.label}-${label}`} href={href} className={className}>
                      <Icon size={18} strokeWidth={isActive ? 2.5 : 1.8} />
                      <span
                        className={`whitespace-nowrap lg:flex-1 ${
                          collapsed ? "lg:hidden" : ""
                        }`}
                      >
                        {label}
                      </span>
                      {isActive && !collapsed && <ChevronRight size={14} />}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
