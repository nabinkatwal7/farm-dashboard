"use client";

import { Plus, ShieldCheck } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import Modal from "../components/Modal";
import StatCard from "../components/StatCard";

const ROLES = [
  "ADMIN",
  "FARM_MANAGER",
  "FIELD_WORKER",
  "LIVESTOCK_MANAGER",
  "INVENTORY_MANAGER",
  "SHOP_STAFF",
  "ACCOUNTANT",
  "VETERINARY",
  "VIEWER",
] as const;

type UserRole = (typeof ROLES)[number];

type FarmUser = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
};

function roleLabel(role: string) {
  return role
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

async function api<T>(url: string, init?: RequestInit) {
  const response = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as
      | { error?: string }
      | null;
    throw new Error(body?.error ?? "Request failed");
  }

  return response.json() as Promise<T>;
}

export default function UsersPage() {
  const [users, setUsers] = useState<FarmUser[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setUsers(await api<FarmUser[]>("/api/users"));
  }

  useEffect(() => {
    void Promise.resolve().then(load);
  }, []);

  async function createUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const form = new FormData(event.currentTarget);

    try {
      await api<FarmUser>("/api/users", {
        method: "POST",
        body: JSON.stringify({
          name: String(form.get("name") ?? ""),
          email: String(form.get("email") ?? ""),
          password: String(form.get("password") ?? ""),
          role: String(form.get("role") ?? "FIELD_WORKER"),
        }),
      });
      await load();
      setShowCreate(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create user");
    }
  }

  async function toggleUser(user: FarmUser) {
    await api<FarmUser>(`/api/users/${user.id}`, {
      method: "PATCH",
      body: JSON.stringify({ isActive: !user.isActive }),
    });
    await load();
  }

  return (
    <div style={{ padding: "32px 32px 48px" }}>
      <div
        style={{
          marginBottom: 28,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        <div>
          <h1
            style={{
              fontSize: "1.6rem",
              fontWeight: 800,
              color: "var(--text-primary)",
            }}
          >
            Users & Roles
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>
            Create farm users and assign role-based access.
          </p>
        </div>
        <button className="btn-primary" onClick={() => setShowCreate(true)}>
          <Plus size={14} /> Create User
        </button>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 14,
          marginBottom: 24,
        }}
      >
        <StatCard
          label="Total Users"
          value={users.length}
          icon={ShieldCheck}
          color="#4ade80"
          delay={0}
        />
        <StatCard
          label="Active Users"
          value={users.filter((user) => user.isActive).length}
          icon={ShieldCheck}
          color="#60a5fa"
          delay={60}
        />
        <StatCard
          label="Managers/Admins"
          value={
            users.filter(
              (user) => user.role === "ADMIN" || user.role === "FARM_MANAGER",
            ).length
          }
          icon={ShieldCheck}
          color="#a78bfa"
          delay={120}
        />
      </div>

      <div
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: 12,
          overflow: "hidden",
        }}
      >
        <table className="farm-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Created</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td style={{ color: "var(--text-primary)", fontWeight: 600 }}>
                  {user.name}
                </td>
                <td>{user.email}</td>
                <td>
                  <span className="badge-blue">{roleLabel(user.role)}</span>
                </td>
                <td>
                  <span className={user.isActive ? "badge-green" : "badge-red"}>
                    {user.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td>{new Date(user.createdAt).toLocaleDateString("en-GB")}</td>
                <td>
                  <button className="btn-ghost" onClick={() => toggleUser(user)}>
                    {user.isActive ? "Disable" : "Enable"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showCreate && (
        <Modal
          title="Create Farm User"
          onClose={() => {
            setShowCreate(false);
            setError(null);
          }}
        >
          <form
            onSubmit={createUser}
            style={{ display: "flex", flexDirection: "column", gap: 14 }}
          >
            <input className="farm-input" name="name" placeholder="Name" required />
            <input
              className="farm-input"
              name="email"
              type="email"
              placeholder="Email"
              required
            />
            <input
              className="farm-input"
              name="password"
              type="password"
              placeholder="Temporary password"
              minLength={8}
              required
            />
            <select className="farm-input" name="role" defaultValue="FIELD_WORKER">
              {ROLES.map((role) => (
                <option key={role} value={role}>
                  {roleLabel(role)}
                </option>
              ))}
            </select>
            {error && (
              <div style={{ color: "#f87171", fontSize: "0.85rem" }}>{error}</div>
            )}
            <div style={{ display: "flex", gap: 10 }}>
              <button className="btn-primary" style={{ flex: 1 }}>
                Create User
              </button>
              <button
                type="button"
                className="btn-ghost"
                onClick={() => setShowCreate(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}


