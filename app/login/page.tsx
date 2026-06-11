"use client";

import { Leaf } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

type Mode = "login" | "setup";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("login");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function checkSetup() {
      const response = await fetch("/api/auth/me", { cache: "no-store" });
      const data = (await response.json()) as { setupRequired: boolean };
      setMode(data.setupRequired ? "setup" : "login");
      setLoading(false);
    }

    void checkSetup();
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    const form = new FormData(event.currentTarget);
    const payload =
      mode === "setup"
        ? {
            farmName: String(form.get("farmName") ?? ""),
            location: String(form.get("location") ?? ""),
            acreage: Number(form.get("acreage") ?? 0) || null,
            name: String(form.get("name") ?? ""),
            email: String(form.get("email") ?? ""),
            password: String(form.get("password") ?? ""),
          }
        : {
            email: String(form.get("email") ?? ""),
            password: String(form.get("password") ?? ""),
          };

    const response = await fetch(
      mode === "setup" ? "/api/auth/setup" : "/api/auth/login",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );

    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as
        | { error?: string }
        | null;
      setError(body?.error ?? "Authentication failed");
      setSubmitting(false);
      return;
    }

    router.replace("/");
  }

  if (loading) return null;

  return (
    <main
      style={{
        minHeight: "100vh",
        width: "100%",
        display: "grid",
        placeItems: "center",
        padding: 24,
      }}
    >
      <form
        onSubmit={submit}
        style={{
          width: "min(460px, 100%)",
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: 12,
          padding: 28,
          display: "flex",
          flexDirection: "column",
          gap: 14,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 10,
              background: "linear-gradient(135deg, #4ade80, #22d3ee)",
              display: "grid",
              placeItems: "center",
            }}
          >
            <Leaf color="#000" size={22} strokeWidth={2.5} />
          </div>
          <div>
            <h1
              style={{
                fontSize: "1.35rem",
                fontWeight: 800,
                color: "var(--text-primary)",
              }}
            >
              {mode === "setup" ? "Create Farm Workspace" : "Sign in"}
            </h1>
            <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
              {mode === "setup"
                ? "Set up the first admin account"
                : "Use your farm account"}
            </p>
          </div>
        </div>

        {mode === "setup" && (
          <>
            <input className="farm-input" name="farmName" placeholder="Farm name" required />
            <input className="farm-input" name="location" placeholder="Location" />
            <input className="farm-input" name="acreage" type="number" placeholder="Acreage" />
            <input className="farm-input" name="name" placeholder="Admin name" required />
          </>
        )}

        <input className="farm-input" name="email" type="email" placeholder="Email" required />
        <input
          className="farm-input"
          name="password"
          type="password"
          placeholder="Password"
          minLength={8}
          required
        />

        {error && (
          <div
            style={{
              color: "#f87171",
              fontSize: "0.85rem",
              background: "rgba(248,113,113,0.08)",
              border: "1px solid rgba(248,113,113,0.2)",
              borderRadius: 8,
              padding: "10px 12px",
            }}
          >
            {error}
          </div>
        )}

        <button className="btn-primary" disabled={submitting} style={{ justifyContent: "center" }}>
          {submitting
            ? "Please wait..."
            : mode === "setup"
              ? "Create Workspace"
              : "Sign in"}
        </button>
      </form>
    </main>
  );
}
