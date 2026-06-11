import { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon: LucideIcon;
  color?: string;
  trend?: { value: number; label: string };
  delay?: number;
}

export default function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  color = "#4ade80",
  trend,
  delay = 0,
}: StatCardProps) {
  return (
    <div
      className="animate-fadeInUp"
      style={{
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderRadius: 12,
        padding: "20px",
        display: "flex",
        flexDirection: "column",
        gap: 12,
        animationDelay: `${delay}ms`,
        position: "relative",
        overflow: "hidden",
        transition: "transform 0.2s, box-shadow 0.2s",
        cursor: "default",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.transform =
          "translateY(-2px)";
        (e.currentTarget as HTMLDivElement).style.boxShadow =
          `0 8px 24px rgba(0,0,0,0.3)`;
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
        (e.currentTarget as HTMLDivElement).style.boxShadow = "none";
      }}
    >
      {/* Background accent */}
      <div
        style={{
          position: "absolute",
          top: -20,
          right: -20,
          width: 80,
          height: 80,
          borderRadius: "50%",
          background: color,
          opacity: 0.06,
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            background: `${color}18`,
            border: `1px solid ${color}30`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon size={20} color={color} strokeWidth={2} />
        </div>

        {trend && (
          <div
            style={{
              fontSize: "0.75rem",
              fontWeight: 600,
              color: trend.value >= 0 ? "#4ade80" : "#f87171",
              background:
                trend.value >= 0
                  ? "rgba(74,222,128,0.1)"
                  : "rgba(248,113,113,0.1)",
              padding: "2px 8px",
              borderRadius: 6,
            }}
          >
            {trend.value >= 0 ? "↑" : "↓"} {Math.abs(trend.value)}%
          </div>
        )}
      </div>

      <div>
        <div
          style={{
            fontSize: "1.75rem",
            fontWeight: 700,
            color: "var(--text-primary)",
            lineHeight: 1,
          }}
        >
          {value}
        </div>
        <div
          style={{
            fontSize: "0.8rem",
            color: "var(--text-muted)",
            marginTop: 4,
          }}
        >
          {label}
        </div>
        {sub && (
          <div
            style={{
              fontSize: "0.75rem",
              color: "var(--text-muted)",
              marginTop: 2,
            }}
          >
            {sub}
          </div>
        )}
      </div>

      {trend && (
        <div style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>
          {trend.label}
        </div>
      )}
    </div>
  );
}
