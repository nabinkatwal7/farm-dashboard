"use client";

import {
  Beef,
  ChevronRight,
  LayoutDashboard,
  Leaf,
  Package,
  PoundSterling,
  ShieldCheck,
  ShoppingCart,
  Wheat,
  Wrench,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/crops", label: "Crops & Fields", icon: Wheat },
  { href: "/livestock", label: "Livestock", icon: Beef },
  { href: "/inventory", label: "Inventory", icon: Package },
  { href: "/shop", label: "Shop & POS", icon: ShoppingCart },
  { href: "/operations", label: "Operations", icon: Wrench },
  { href: "/seeding", label: "Precision Seeding", icon: Wheat },
  { href: "/finance", label: "Finance & Costs", icon: PoundSterling },
  { href: "/users", label: "Users & Roles", icon: ShieldCheck },
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
  const router = useRouter();
  const canManageUsers =
    user?.role === "ADMIN" || user?.role === "FARM_MANAGER";

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
  }

  return (
    <aside
      style={{
        width: "var(--sidebar-width)",
        position: "fixed",
        top: 0,
        left: 0,
        height: "100vh",
        background: "var(--bg-surface)",
        borderRight: "1px solid var(--border)",
        display: "flex",
        flexDirection: "column",
        zIndex: 50,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: "24px 20px 20px",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: "linear-gradient(135deg, #4ade80, #22d3ee)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Leaf size={20} color="#000" strokeWidth={2.5} />
          </div>
          <div>
            <div
              style={{
                fontWeight: 800,
                fontSize: "1.1rem",
                color: "var(--text-primary)",
              }}
            >
              FarmOS
            </div>
            <div
              style={{
                fontSize: "0.7rem",
                color: "var(--text-muted)",
                fontWeight: 500,
              }}
            >
              Management Platform
            </div>
          </div>
        </div>
      </div>

      <div
        style={{
          padding: "14px 20px",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div
          style={{
            fontSize: "0.7rem",
            color: "var(--text-muted)",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            marginBottom: 6,
          }}
        >
          Active Farm
        </div>
        <div
          style={{
            fontWeight: 600,
            fontSize: "0.9rem",
            color: "var(--text-primary)",
          }}
        >
          {user?.farm.name ?? "Farm workspace"}
        </div>
        <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
          {user?.farm.location ?? "Location not set"}
          {user?.farm.acreage ? ` · ${user.farm.acreage} acres` : ""}
        </div>
      </div>

      <nav
        style={{
          flex: 1,
          padding: "12px",
          display: "flex",
          flexDirection: "column",
          gap: 2,
        }}
      >
        <div
          style={{
            fontSize: "0.65rem",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            color: "var(--text-muted)",
            fontWeight: 600,
            padding: "8px 8px 4px",
          }}
        >
          Modules
        </div>
        {navItems
          .filter((item) => item.href !== "/users" || canManageUsers)
          .map(({ href, label, icon: Icon }) => {
            const isActive =
              href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 12px",
                  borderRadius: 8,
                  textDecoration: "none",
                  transition: "all 0.15s",
                  background: isActive
                    ? "rgba(74,222,128,0.12)"
                    : "transparent",
                  border: isActive
                    ? "1px solid rgba(74,222,128,0.2)"
                    : "1px solid transparent",
                  color: isActive ? "#4ade80" : "var(--text-secondary)",
                  fontWeight: isActive ? 600 : 400,
                  fontSize: "0.875rem",
                }}
              >
                <Icon size={18} strokeWidth={isActive ? 2.5 : 1.8} />
                <span style={{ flex: 1 }}>{label}</span>
                {isActive && <ChevronRight size={14} />}
              </Link>
            );
          })}
      </nav>

      <div
        style={{
          padding: "16px 20px",
          borderTop: "1px solid var(--border)",
          background: "rgba(74,222,128,0.04)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              background: "rgba(74,222,128,0.15)",
              color: "#4ade80",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "0.8rem",
              fontWeight: 800,
              flexShrink: 0,
            }}
          >
            {user?.name.charAt(0).toUpperCase() ?? "U"}
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div
              style={{
                fontSize: "0.8rem",
                color: "var(--text-primary)",
                fontWeight: 700,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {user?.name ?? "User"}
            </div>
            <div style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
              {user ? roleLabel(user.role) : "Not signed in"}
            </div>
          </div>
          <button
            className="btn-ghost"
            onClick={logout}
            style={{ padding: "5px 8px", fontSize: "0.72rem" }}
          >
            Logout
          </button>
        </div>
      </div>
    </aside>
  );
}
