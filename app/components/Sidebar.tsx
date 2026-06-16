"use client";

import { Drawer } from "@mantine/core";
import FieldPilotLogo from "@/app/components/brand/FieldPilotLogo";
import {
  Beef,
  Bluetooth,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  CircleDollarSign,
  ClipboardList,
  CloudSun,
  Droplets,
  Fingerprint,
  LayoutDashboard,
  Leaf,
  Package,
  PanelLeftClose,
  PanelLeftOpen,
  Satellite,
  Settings,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  Sprout,
  UsersRound,
  Warehouse,
  Wheat,
  Wrench,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

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
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
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
      { href: "/drydown", label: "Crop Drydown", icon: Warehouse },
      { href: "/livestock", label: "Livestock", icon: Beef },
      { href: "/livestock-traceability", label: "Traceability", icon: Fingerprint },
      { href: "/rfid-scanner", label: "RFID Scanner", icon: Bluetooth },
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
  mobileOpen,
  onCloseMobile,
}: {
  user: SidebarUser;
  collapsed: boolean;
  onToggleCollapsed: () => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}) {
  const pathname = usePathname();
  const canManageUsers =
    user?.role === "ADMIN" || user?.role === "FARM_MANAGER";
  const activeSection =
    navSections.find((section) =>
      section.items.some((item) =>
        item.href ? pathname === item.href || pathname.startsWith(item.href + "/") : false,
      ),
    )?.label ?? navSections[0]?.label;
  const [openSections, setOpenSections] = useState(
    () => new Set(activeSection ? [activeSection] : []),
  );

  useEffect(() => {
    if (!activeSection) return;
    setOpenSections(new Set([activeSection]));
  }, [activeSection]);

  function toggleSection(label: string) {
    setOpenSections((current) =>
      current.has(label) ? new Set<string>() : new Set([label]),
    );
  }

  const sidebarInner = (
    <>
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
          <FieldPilotLogo
            size="sm"
            showTagline={!collapsed}
            textClassName={collapsed ? "lg:hidden" : ""}
          />
        </div>
        <button
          type="button"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          onClick={onToggleCollapsed}
          className="absolute right-3 top-4 hidden h-8 w-8 place-items-center rounded-lg border border-border bg-card text-secondary transition-colors hover:bg-card-hover hover:text-primary lg:grid"
        >
          {collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
        </button>
      </div>

      <div
        className={`border-b border-border px-5 py-3.5 ${
          collapsed ? "lg:hidden" : ""
        }`}
      >
        <div className="mb-1.5 text-[0.7rem] uppercase tracking-widest text-muted">
          Active Farm
        </div>
        <div className="text-sm font-semibold text-primary">
          {user?.farm.name ?? "Farm workspace"}
        </div>
        <div className="text-xs text-muted">
          {user?.farm.location ?? "Location not set"}
          {user?.farm.acreage ? ` - ${user.farm.acreage} acres` : ""}
        </div>
      </div>

      <nav
        className={`flex flex-1 flex-col gap-5 overflow-y-auto p-4 ${
          collapsed ? "lg:gap-3 lg:p-3" : ""
        }`}
      >
        {navSections.map((section) => {
          const visibleItems = section.items.filter(
            (item) => !item.adminOnly || canManageUsers,
          );
          const sectionOpen = collapsed || openSections.has(section.label);
          return (
            <div key={section.label} className="flex flex-col">
              <button
                type="button"
                onClick={() => toggleSection(section.label)}
                className={`flex w-full items-center justify-between rounded-lg border border-transparent px-2 py-1 text-left text-[0.65rem] font-semibold uppercase tracking-widest text-muted transition-colors hover:border-border hover:bg-card-hover hover:text-primary ${
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
                className={`mt-1 flex flex-col gap-0.5 ${
                  sectionOpen ? "" : "hidden"
                }`}
              >
                {visibleItems.map(({ href, label, icon: Icon }) => {
                  const isActive = href
                    ? pathname === href || pathname.startsWith(href + "/")
                    : false;
                  const className = `flex items-center gap-2.5 rounded-lg border px-3 py-2.5 text-sm no-underline transition-all duration-150 ${
                    collapsed ? "lg:justify-center lg:px-2.5" : ""
                  } ${
                    isActive
                      ? "border-green/25 bg-green/10 font-semibold text-green"
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
                    <Link
                      key={`${section.label}-${label}`}
                      href={href}
                      className={className}
                      onClick={onCloseMobile}
                    >
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
    </>
  );

  return (
    <>
      <Drawer
        opened={mobileOpen}
        onClose={onCloseMobile}
        title="Navigation"
        padding={0}
        size="85%"
        hiddenFrom="lg"
        classNames={{
          content: "bg-surface",
          header: "border-b border-border bg-surface",
          title: "text-base font-semibold text-primary",
          body: "flex h-full flex-col overflow-hidden bg-surface p-0",
        }}
      >
        <div className="flex h-full flex-col overflow-hidden">{sidebarInner}</div>
      </Drawer>

      <aside
        className={`hidden overflow-hidden border-b border-border bg-surface transition-[width] duration-200 lg:fixed lg:left-0 lg:top-0 lg:flex lg:h-screen lg:flex-col lg:border-b-0 lg:border-r ${
          collapsed ? "lg:w-20" : "lg:w-[var(--sidebar-width)]"
        }`}
      >
        {sidebarInner}
      </aside>
    </>
  );
}
