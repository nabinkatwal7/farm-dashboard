"use client";

import { Plus, ShieldCheck } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import {
  TextInput,
  PasswordInput,
  Select,
  Button,
  Group,
  Modal,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import StatCard from "@/app/abstract/ui/StatCard";
import TableSkeleton from "@/app/abstract/ui/TableSkeleton";
import {
  ROLES,
  createUser as createFarmUser,
  listUsers,
  updateUser,
  type FarmUser,
} from "@/app/base/services/user-service";

function roleLabel(role: string) {
  return role
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default function UsersPage() {
  const [users, setUsers] = useState<FarmUser[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      setUsers(await listUsers());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void Promise.resolve().then(load);
  }, []);

  async function createUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const form = new FormData(event.currentTarget);

    try {
      await createFarmUser({
        name: String(form.get("name") ?? ""),
        email: String(form.get("email") ?? ""),
        password: String(form.get("password") ?? ""),
        role: String(form.get("role") ?? "FIELD_WORKER"),
      });
      await load();
      notifications.show({ title: "Success", message: "User created", color: "green" });
      setShowCreate(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create user");
    }
  }

  async function toggleUser(user: FarmUser) {
    await updateUser(user.id, { isActive: !user.isActive });
    await load();
    notifications.show({ title: "Success", message: `User ${user.isActive ? "disabled" : "enabled"}`, color: "green" });
  }

  if (loading) return <TableSkeleton rows={5} cols={5} />;

  return (
    <div className="p-6">
      <div className="mb-7 flex justify-between items-start">
        <div>
          <h1 className="text-[1.6rem] font-extrabold text-primary">Users & Roles</h1>
          <p className="text-muted text-sm">Create farm users and assign role-based access.</p>
        </div>
        <button className="btn-primary" onClick={() => setShowCreate(true)}>
          <Plus size={14} /> Create User
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3.5 mb-6">
        <StatCard
          label="Total Users"
          value={users.length}
          icon={ShieldCheck}
          color="#4ade80"
        />
        <StatCard
          label="Active Users"
          value={users.filter((user) => user.isActive).length}
          icon={ShieldCheck}
          color="#60a5fa"
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
        />
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
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
            {users.length === 0 ? (
              <tr>
                <td colSpan={99}>
                  <div style={{textAlign:"center",padding:"48px 16px",fontSize:"0.875rem",color:"var(--text-muted)"}}>
                    No users yet. Invite team members to collaborate.
                  </div>
                </td>
              </tr>
            ) : (
            users.map((user) => (
              <tr key={user.id}>
                <td className="text-primary font-semibold">{user.name}</td>
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
            ))
            )}
          </tbody>
        </table>
      </div>

      <Modal
        opened={showCreate}
        title="Create farm user"
        onClose={() => {
          setShowCreate(false);
          setError(null);
        }}
        size="lg"
      >
          <form
            onSubmit={createUser}
            className="flex flex-col gap-3.5"
          >
            <TextInput
              label="Full name"
              name="name"
              placeholder="Tom Greene"
              required
            />
            <TextInput
              label="Email address"
              name="email"
              type="email"
              placeholder="tom@fieldpilot.com"
              required
            />
            <PasswordInput
              label="Temporary password"
              name="password"
              placeholder="At least 8 characters"
              required
            />
            <Select
              label="Access role"
              name="role"
              data={ROLES.map((r) => ({ value: r, label: roleLabel(r) }))}
              defaultValue="FIELD_WORKER"
              required
            />
            {error && (
              <div className="text-red text-sm">{error}</div>
            )}
            <Group gap="sm" justify="flex-end">
              <Button type="button" variant="default" onClick={() => setShowCreate(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="filled">Create User</Button>
            </Group>
          </form>
      </Modal>
    </div>
  );
}
