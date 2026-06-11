"use client";

import {
  Beef,
  ChevronRight,
  LayoutDashboard,
  Leaf,
  Package,
  PoundSterling,
  ShoppingCart,
  Wheat,
  Wrench,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/crops", label: "Crops & Fields", icon: Wheat },
  { href: "/livestock", label: "Livestock", icon: Beef },
  { href: "/inventory", label: "Inventory", icon: Package },
  { href: "/shop", label: "Shop & POS", icon: ShoppingCart },
  { href: "/operations", label: "Operations", icon: Wrench },
  { href: "/finance", label: "Finance & Costs", icon: PoundSterling },
];

export default function Sidebar() {
  const pathname = usePathname();

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
      {/* Logo */}
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
                letterSpacing: "-0.02em",
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

      {/* Farm info */}
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
          Greenwood Estate
        </div>
        <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
          🌍 Yorkshire, UK · 320 acres
        </div>
      </div>

      {/* Nav */}
      <nav
        style={{
          flex: 1,
          padding: "12px 12px",
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
        {navItems.map(({ href, label, icon: Icon }) => {
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
                background: isActive ? "rgba(74,222,128,0.12)" : "transparent",
                border: isActive
                  ? "1px solid rgba(74,222,128,0.2)"
                  : "1px solid transparent",
                color: isActive ? "#4ade80" : "var(--text-secondary)",
                fontWeight: isActive ? 600 : 400,
                fontSize: "0.875rem",
                position: "relative",
              }}
            >
              <Icon size={18} strokeWidth={isActive ? 2.5 : 1.8} />
              <span style={{ flex: 1 }}>{label}</span>
              {isActive && <ChevronRight size={14} />}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div
        style={{
          padding: "16px 20px",
          borderTop: "1px solid var(--border)",
          background: "rgba(74,222,128,0.04)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "#4ade80",
              boxShadow: "0 0 6px #4ade80",
            }}
          />
          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
            All systems online · Offline ready
          </span>
        </div>
      </div>
    </aside>
  );
}
