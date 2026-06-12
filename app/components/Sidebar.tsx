"use client";

import {
  Beef,
  CalendarDays,
  ChevronRight,
  CircleDollarSign,
  ClipboardList,
  LayoutDashboard,
  Leaf,
  Moon,
  Package,
  Settings,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  Sun,
  UsersRound,
  Wheat,
  Wrench,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMantineColorScheme } from "@mantine/core";

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
  name: string;
  email: string;
  role: string;
  farm: {
    name: string;
    location: string | null;
    acreage: number | null;
  };
} | null;

function roleLabel(role: string) {
  return role
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default function Sidebar({ user }: { user: SidebarUser }) {
  const pathname = usePathname();
  const canManageUsers =
    user?.role === "ADMIN" || user?.role === "FARM_MANAGER";
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();

  return (
    <aside className="z-50 flex w-full flex-col overflow-hidden border-b border-border bg-surface lg:fixed lg:left-0 lg:top-0 lg:h-screen lg:w-[var(--sidebar-width)] lg:border-b-0 lg:border-r">
      <div className="border-b border-border px-5 py-4 lg:py-6 lg:pb-5">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#4ade80] to-[#22d3ee] flex items-center justify-center">
            <Leaf size={20} color="#000" strokeWidth={2.5} />
          </div>
          <div>
            <div className="font-extrabold text-[1.1rem] text-primary leading-none">
              FarmOS
            </div>
            <div className="text-[0.7rem] text-muted font-medium">
              Management Platform
            </div>
          </div>
        </div>
      </div>

      <div className="hidden border-b border-border px-5 py-3.5 sm:block">
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

      <nav className="flex flex-1 gap-4 overflow-x-auto p-3 lg:flex-col lg:gap-5 lg:overflow-x-visible lg:p-4">
        {navSections.map((section) => {
          const visibleItems = section.items.filter(
            (item) => !item.adminOnly || canManageUsers,
          );
          return (
            <div key={section.label} className="flex shrink-0 flex-col lg:shrink">
              <div className="hidden px-2 pb-1 text-[0.65rem] font-semibold uppercase tracking-widest text-muted lg:block">
                {section.label}
              </div>
              <div className="flex gap-2 lg:flex-col lg:gap-0.5">
                {visibleItems.map(({ href, label, icon: Icon }) => {
                  const isActive = href
                    ? href === "/"
                      ? pathname === "/"
                      : pathname.startsWith(href)
                    : false;
                  const className = `flex shrink-0 items-center gap-2.5 rounded-lg border px-3 py-2.5 text-sm no-underline transition-all duration-150 lg:shrink ${
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
                        <span className="whitespace-nowrap lg:flex-1">
                          {label}
                        </span>
                      </div>
                    );
                  }

                  return (
                    <Link key={`${section.label}-${label}`} href={href} className={className}>
                      <Icon size={18} strokeWidth={isActive ? 2.5 : 1.8} />
                      <span className="whitespace-nowrap lg:flex-1">{label}</span>
                      {isActive && <ChevronRight size={14} />}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
        <div className="shrink-0 border-l border-border pl-2 lg:mt-auto lg:border-l-0 lg:border-t lg:px-3 lg:pt-2">
          <button
            onClick={toggleColorScheme}
            className="flex w-full cursor-pointer items-center gap-2.5 rounded-lg border-none bg-transparent px-3 py-2.5 text-left text-sm text-secondary transition-all duration-150 hover:bg-[rgba(255,255,255,0.04)]"
          >
            {colorScheme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            <span className="hidden whitespace-nowrap sm:inline">
              {colorScheme === "dark" ? "Light Mode" : "Dark Mode"}
            </span>
          </button>
        </div>
      </nav>

      <div className="hidden border-t border-border bg-[rgba(74,222,128,0.04)] px-5 py-4 lg:block">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-[rgba(74,222,128,0.15)] text-[#4ade80] flex items-center justify-center text-xs font-extrabold shrink-0">
            {user?.name.charAt(0).toUpperCase() ?? "U"}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs text-primary font-bold truncate">
              {user?.name ?? "User"}
            </div>
            <div className="text-[0.7rem] text-muted">
              {user ? roleLabel(user.role) : "Not signed in"}
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
