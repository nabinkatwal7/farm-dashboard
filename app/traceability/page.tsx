"use client";

import { Leaf, Search } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function TraceabilityPortal() {
  const [code, setCode] = useState("");

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 50%, #f0f9ff 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 560,
          padding: "60px 24px",
          textAlign: "center",
        }}
      >
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: 20,
            background: "linear-gradient(135deg, #22c55e, #16a34a)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 24px",
            boxShadow: "0 8px 32px rgba(34,197,94,0.25)",
          }}
        >
          <Leaf size={36} color="white" strokeWidth={2} />
        </div>

        <h1
          style={{
            fontSize: "1.8rem",
            fontWeight: 800,
            color: "#166534",
            margin: "0 0 8px",
            letterSpacing: "-0.02em",
          }}
        >
          Product Traceability
        </h1>
        <p
          style={{
            fontSize: "0.95rem",
            color: "#6b7280",
            margin: "0 0 36px",
            lineHeight: 1.6,
          }}
        >
          Enter your batch code to trace the full journey of your product — from
          field to table.
        </p>

        <div
          style={{
            background: "white",
            borderRadius: 16,
            padding: 32,
            boxShadow: "0 4px 24px rgba(0,0,0,0.06)",
            border: "1px solid #e5e7eb",
            marginBottom: 24,
          }}
        >
          <div style={{ display: "flex", gap: 10 }}>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && code.trim())
                  window.location.href = `/traceability/${encodeURIComponent(code.trim())}`;
              }}
              placeholder="Enter batch code (e.g. BATCH-2024-001)"
              style={{
                flex: 1,
                padding: "12px 16px",
                borderRadius: 10,
                border: "1px solid #d1d5db",
                fontSize: "0.95rem",
                outline: "none",
                transition: "border-color 0.15s",
              }}
              onFocus={(e) => {
                e.target.style.borderColor = "#22c55e";
              }}
              onBlur={(e) => {
                e.target.style.borderColor = "#d1d5db";
              }}
            />
            <Link
              href={
                code.trim()
                  ? `/traceability/${encodeURIComponent(code.trim())}`
                  : "#"
              }
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "12px 24px",
                borderRadius: 10,
                background: code.trim()
                  ? "linear-gradient(135deg, #22c55e, #16a34a)"
                  : "#d1d5db",
                color: "white",
                fontWeight: 600,
                fontSize: "0.9rem",
                textDecoration: "none",
                pointerEvents: code.trim() ? "auto" : "none",
              }}
            >
              <Search size={18} /> Trace
            </Link>
          </div>
        </div>

        <div style={{ fontSize: "0.8rem", color: "#9ca3af", lineHeight: 1.8 }}>
          <p style={{ margin: 0 }}>
            Your batch code can be found on product packaging or your order
            confirmation.
          </p>
          <p style={{ margin: "8px 0 0" }}>
            This portal provides transparent access to field origin, harvest
            dates, and production history.
          </p>
        </div>
      </div>
    </div>
  );
}
