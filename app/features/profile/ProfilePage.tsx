"use client";

import {
  Alert,
  Button,
  Group,
  NumberInput,
  PasswordInput,
  TextInput,
} from "@mantine/core";
import {
  BadgeCheck,
  Building2,
  CalendarClock,
  Mail,
  Save,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import type { ComponentType } from "react";
import { useEffect, useState } from "react";
import { useUserContext, type CurrentUser } from "@/app/lib/user-context";

type ProfileResponse = Required<
  Pick<CurrentUser, "id" | "email" | "name" | "role" | "isActive" | "createdAt" | "updatedAt">
> & {
  farm: Required<Pick<CurrentUser["farm"], "id" | "name" | "createdAt" | "updatedAt">> & {
    location: string | null;
    acreage: number | null;
  };
};

function roleLabel(role: string) {
  return role
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function canEditFarm(role: string) {
  return role === "ADMIN" || role === "FARM_MANAGER";
}

function formatDate(value?: string | null) {
  if (!value) return "Not available";
  return new Date(value).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function DetailItem({
  icon: Icon,
  label,
  value,
}: {
  icon: ComponentType<{ size?: number; className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted">
        <Icon size={14} />
        {label}
      </div>
      <div className="break-words text-sm font-medium text-primary">{value}</div>
    </div>
  );
}

export default function ProfilePage() {
  const { user, setUser } = useUserContext();
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    currentPassword: "",
    newPassword: "",
    farmName: "",
    farmLocation: "",
    farmAcreage: null as number | null,
  });

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/profile", { cache: "no-store" });
      const data = (await response.json()) as ProfileResponse | { error?: string };

      if (!active) return;

      if (!response.ok) {
        setError("error" in data && data.error ? data.error : "Unable to load profile");
        setLoading(false);
        return;
      }

      const loaded = data as ProfileResponse;
      setProfile(loaded);
      setForm({
        name: loaded.name,
        email: loaded.email,
        currentPassword: "",
        newPassword: "",
        farmName: loaded.farm.name,
        farmLocation: loaded.farm.location ?? "",
        farmAcreage: loaded.farm.acreage,
      });
      setLoading(false);
    }

    void loadProfile();

    return () => {
      active = false;
    };
  }, []);

  async function saveProfile() {
    setSaving(true);
    setError(null);
    setMessage(null);

    const payload: Record<string, unknown> = {
      name: form.name,
      email: form.email,
    };

    if (form.newPassword) {
      payload.currentPassword = form.currentPassword;
      payload.newPassword = form.newPassword;
    }

    if (profile && canEditFarm(profile.role)) {
      payload.farmName = form.farmName;
      payload.farmLocation = form.farmLocation;
      payload.farmAcreage = form.farmAcreage;
    }

    const response = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = (await response.json()) as ProfileResponse | { error?: string };

    setSaving(false);

    if (!response.ok) {
      setError("error" in data && data.error ? data.error : "Unable to save profile");
      return;
    }

    const updated = data as ProfileResponse;
    setProfile(updated);
    setUser(updated);
    setForm((current) => ({
      ...current,
      name: updated.name,
      email: updated.email,
      currentPassword: "",
      newPassword: "",
      farmName: updated.farm.name,
      farmLocation: updated.farm.location ?? "",
      farmAcreage: updated.farm.acreage,
    }));
    setMessage("Profile updated");
  }

  const effectiveProfile = profile ?? user;

  if (loading) {
    return (
      <main className="min-h-screen bg-background px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl rounded-2xl border border-border bg-card p-6 text-sm text-muted">
          Loading profile...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-border bg-card p-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-secondary">
              <UserRound size={14} className="text-green" />
              Profile
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-primary">
              {effectiveProfile?.name ?? "User profile"}
            </h1>
            <p className="mt-2 text-sm text-muted">
              Manage your account identity, contact details, password, and farm workspace metadata.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="badge-blue">{roleLabel(effectiveProfile?.role ?? "VIEWER")}</span>
            <span className={effectiveProfile?.isActive === false ? "badge-red" : "badge-green"}>
              {effectiveProfile?.isActive === false ? "Inactive" : "Active"}
            </span>
          </div>
        </div>

        {error && (
          <Alert color="red" variant="light" mb="md">
            {error}
          </Alert>
        )}
        {message && (
          <Alert color="green" variant="light" mb="md">
            {message}
          </Alert>
        )}

        <div className="grid gap-5 lg:grid-cols-[0.85fr_1.15fr]">
          <section className="space-y-5">
            <div className="rounded-2xl border border-border bg-card p-5">
              <h2 className="mb-4 text-sm font-semibold text-primary">User information</h2>
              <div className="grid gap-3">
                <DetailItem icon={Mail} label="Email" value={effectiveProfile?.email ?? "Not set"} />
                <DetailItem icon={ShieldCheck} label="Role" value={roleLabel(effectiveProfile?.role ?? "VIEWER")} />
                <DetailItem icon={BadgeCheck} label="User ID" value={effectiveProfile?.id ?? "Not available"} />
                <DetailItem icon={CalendarClock} label="Created" value={formatDate(effectiveProfile?.createdAt)} />
                <DetailItem icon={CalendarClock} label="Updated" value={formatDate(effectiveProfile?.updatedAt)} />
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-5">
              <h2 className="mb-4 text-sm font-semibold text-primary">Farm information</h2>
              <div className="grid gap-3">
                <DetailItem icon={Building2} label="Farm" value={effectiveProfile?.farm.name ?? "Not set"} />
                <DetailItem icon={Building2} label="Location" value={effectiveProfile?.farm.location ?? "Not set"} />
                <DetailItem
                  icon={Building2}
                  label="Acreage"
                  value={
                    effectiveProfile?.farm.acreage
                      ? `${effectiveProfile.farm.acreage.toLocaleString()} acres`
                      : "Not set"
                  }
                />
                <DetailItem icon={BadgeCheck} label="Farm ID" value={effectiveProfile?.farm.id ?? "Not available"} />
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-card p-5">
            <div className="mb-5">
              <h2 className="text-sm font-semibold text-primary">Edit profile</h2>
              <p className="mt-1 text-sm text-muted">
                Changes apply to your signed-in account. Password changes require your current password.
              </p>
            </div>

            <div className="grid gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <TextInput
                  label="Name"
                  value={form.name}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, name: event.target.value }))
                  }
                  required
                />
                <TextInput
                  label="Email"
                  type="email"
                  value={form.email}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, email: event.target.value }))
                  }
                  required
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <PasswordInput
                  label="Current password"
                  value={form.currentPassword}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      currentPassword: event.target.value,
                    }))
                  }
                />
                <PasswordInput
                  label="New password"
                  description="Leave blank to keep your current password"
                  value={form.newPassword}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      newPassword: event.target.value,
                    }))
                  }
                />
              </div>

              <div className="border-t border-border pt-5">
                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-primary">Farm workspace</h3>
                  <p className="mt-1 text-sm text-muted">
                    {profile && canEditFarm(profile.role)
                      ? "Admins and farm managers can update farm-level profile details."
                      : "Farm-level details are managed by admins and farm managers."}
                  </p>
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  <TextInput
                    label="Farm name"
                    value={form.farmName}
                    disabled={!profile || !canEditFarm(profile.role)}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        farmName: event.target.value,
                      }))
                    }
                  />
                  <TextInput
                    label="Location"
                    value={form.farmLocation}
                    disabled={!profile || !canEditFarm(profile.role)}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        farmLocation: event.target.value,
                      }))
                    }
                  />
                  <NumberInput
                    label="Acreage"
                    value={form.farmAcreage ?? ""}
                    min={0}
                    disabled={!profile || !canEditFarm(profile.role)}
                    onChange={(value) =>
                      setForm((current) => ({
                        ...current,
                        farmAcreage:
                          typeof value === "number" && !Number.isNaN(value)
                            ? value
                            : null,
                      }))
                    }
                  />
                </div>
              </div>

              <Group justify="flex-end" mt="md">
                <Button
                  leftSection={<Save size={16} />}
                  loading={saving}
                  onClick={saveProfile}
                >
                  Save profile
                </Button>
              </Group>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
