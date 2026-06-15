"use client";

import { BadgeCheck, Globe, Plus, RefreshCw, Trash2, XCircle } from "lucide-react";
import { useState } from "react";
import { Button, Group } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import FormField from "@/app/abstract/ui/FormField";
import Modal from "@/app/abstract/ui/Modal";
import StatCard from "@/app/abstract/ui/StatCard";
import { useFarmData } from "@/app/base/hooks/useFarmData";
import {
  deleteData,
  generateId,
  saveData,
  type Animal,
  type LivestockIntegration,
  type LivestockSyncRecord,
} from "@/app/base/services/farm-client";

const ENTITIES = {
  integrations: "livestockIntegrations",
  syncRecords: "livestockSyncRecords",
  animals: "animals",
} as const;

const PROVIDERS = [
  { value: "bcms", label: "BCMS (UK)" },
  { value: "nlis", label: "NLIS (Australia)" },
  { value: "agri", label: "National Agri Registry" },
] as const;

const EVENT_LABELS: Record<string, string> = {
  birth: "Birth Registration",
  death: "Death Notification",
  transfer_in: "Transfer In",
  transfer_out: "Transfer Out",
  registration: "Animal Registration",
  movement: "Movement Record",
};

function statusBadge(status: string) {
  const colors: Record<string, { bg: string; color: string }> = {
    synced: { bg: "rgba(74,222,128,0.15)", color: "#4ade80" },
    failed: { bg: "rgba(248,113,113,0.15)", color: "#f87171" },
    pending: { bg: "rgba(251,191,36,0.15)", color: "#fbbf24" },
  };
  const s = colors[status] ?? { bg: "rgba(148,163,184,0.15)", color: "#94a3b8" };
  return (
    <span style={{ display: "inline-block", padding: "2px 10px", borderRadius: 999, fontSize: "0.75rem", fontWeight: 600, background: s.bg, color: s.color }}>
      {status}
    </span>
  );
}

export default function LivestockTraceabilityPage() {
  const { data, reload } = useFarmData(ENTITIES);
  const integrations = data.integrations as LivestockIntegration[];
  const syncRecords = data.syncRecords as LivestockSyncRecord[];
  const animals = data.animals as Animal[];

  const [showAddIntegration, setShowAddIntegration] = useState(false);
  const [integrationForm, setIntegrationForm] = useState<Partial<LivestockIntegration>>({
    provider: "bcms", label: "", isActive: true,
  });
  const [syncing, setSyncing] = useState(false);

  const activeIntegration = integrations.find((i) => i.isActive);
  const totalAnimals = animals.length;
  const syncedCount = animals.filter((a) => syncRecords.some((r) => r.animalEarTag === a.earTag && r.status === "synced")).length;
  const failedCount = syncRecords.filter((r) => r.status === "failed").length;
  const pendingCount = syncRecords.filter((r) => r.status === "pending").length;

  async function handleSaveIntegration() {
    try {
      if (!integrationForm.label?.trim() || !integrationForm.provider) {
        notifications.show({ title: "Validation", message: "Provider and label are required", color: "orange" });
        return;
      }
      await saveData("livestockIntegrations", {
        id: generateId(),
        provider: integrationForm.provider,
        label: integrationForm.label.trim(),
        apiEndpoint: integrationForm.apiEndpoint || undefined,
        apiKey: integrationForm.apiKey || undefined,
        herdMark: integrationForm.herdMark || undefined,
        isActive: integrationForm.isActive ?? true,
      } as LivestockIntegration);
      notifications.show({ title: "Success", message: "Integration configured", color: "green" });
      await reload(); setShowAddIntegration(false);
      setIntegrationForm({ provider: "bcms", label: "", isActive: true });
    } catch (e) {
      notifications.show({ title: "Error", message: e instanceof Error ? e.message : "Failed to save", color: "red" });
    }
  }

  async function handleDeleteIntegration(id: string) {
    try {
      await deleteData("livestockIntegrations", id);
      notifications.show({ title: "Deleted", message: "Integration removed", color: "green" });
      await reload();
    } catch (e) {
      notifications.show({ title: "Error", message: e instanceof Error ? e.message : "Failed to delete", color: "red" });
    }
  }

  async function triggerSync(action: string) {
    if (!activeIntegration) {
      notifications.show({ title: "Warning", message: "No active integration configured", color: "orange" });
      return;
    }
    setSyncing(true);
    try {
      const response = await fetch("/api/livestock/traceability/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, integrationId: activeIntegration.id }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Sync failed");
      const result = data.result;
      const synced = result.synced ?? (result.status === "synced" ? 1 : 0);
      const failed = result.failed ?? (result.status === "failed" ? 1 : 0);
      notifications.show({
        title: "Sync Complete",
        message: `${synced} synced, ${failed} failed`,
        color: failed > 0 ? "orange" : "green",
      });
      await reload();
    } catch (e) {
      notifications.show({ title: "Sync Error", message: e instanceof Error ? e.message : "Request failed", color: "red" });
    } finally {
      setSyncing(false);
    }
  }

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 28 }}>
        <h1 className="text-primary" style={{ fontSize: "1.6rem", fontWeight: 800, letterSpacing: "-0.02em" }}>
          National Livestock Traceability
        </h1>
        <p className="text-muted" style={{ fontSize: "0.875rem", marginTop: 4 }}>
          Automated statutory animal registrations, births, deaths, and transfers via national database integration
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 24 }}>
        <StatCard label="Total Animals" value={totalAnimals} sub="on farm" icon={Globe} color="#60a5fa" delay={0} />
        <StatCard label="Synced to National DB" value={syncedCount} sub={`${totalAnimals > 0 ? (syncedCount / totalAnimals * 100).toFixed(0) : 0}% coverage`} icon={BadgeCheck} color="#4ade80" delay={60} />
        <StatCard label="Failed Syncs" value={failedCount} sub="require attention" icon={XCircle} color={failedCount > 0 ? "#f87171" : "#4ade80"} delay={120} />
        <StatCard label="Pending Events" value={pendingCount} sub="awaiting sync" icon={RefreshCw} color={pendingCount > 0 ? "#fbbf24" : "#4ade80"} delay={180} />
      </div>

      <div className="bg-card border border-border" style={{ borderRadius: 12, padding: 20, marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--color-primary)", margin: 0 }}>Integration Configuration</h2>
          <Button size="sm" leftSection={<Plus size={14} />} onClick={() => setShowAddIntegration(true)}>
            Add Connection
          </Button>
        </div>

        {integrations.length === 0 ? (
          <div style={{ textAlign: "center", padding: "30px 20px", fontSize: "0.85rem", color: "var(--color-muted)" }}>
            No national database connections configured. Add a connection to enable automated livestock traceability.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {integrations.map((int) => (
              <div key={int.id} className="bg-background border border-border" style={{ borderRadius: 10, padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 8,
                    background: int.isActive ? "rgba(74,222,128,0.15)" : "rgba(148,163,184,0.15)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <Globe size={18} color={int.isActive ? "#4ade80" : "#94a3b8"} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: "0.9rem", color: "var(--color-primary)" }}>
                      {int.label}
                      {int.isActive && <span style={{ color: "#4ade80", fontWeight: 600, fontSize: "0.75rem", marginLeft: 8 }}>ACTIVE</span>}
                    </div>
                    <div style={{ fontSize: "0.8rem", color: "var(--color-muted)" }}>
                      {PROVIDERS.find((p) => p.value === int.provider)?.label ?? int.provider}
                      {int.herdMark ? ` · Herd: ${int.herdMark}` : ""}
                      {int.lastSyncAt ? ` · Last sync: ${new Date(int.lastSyncAt).toLocaleString("en-GB")}` : ""}
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  {int.lastSyncStatus && (
                    <span style={{ fontSize: "0.75rem", color: int.lastSyncStatus === "synced" ? "#4ade80" : "#fbbf24" }}>
                      {int.lastSyncStatus}
                    </span>
                  )}
                  <button onClick={() => handleDeleteIntegration(int.id)} style={{
                    background: "rgba(248,113,113,0.15)", border: "1px solid rgba(248,113,113,0.3)", color: "#f87171",
                    borderRadius: 6, padding: "4px 10px", cursor: "pointer", display: "flex", alignItems: "center",
                  }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-card border border-border" style={{ borderRadius: 12, padding: 20, marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--color-primary)", margin: 0 }}>Sync Operations</h2>
          <div style={{ display: "flex", gap: 8 }}>
            <Button size="sm" variant="default" leftSection={<RefreshCw size={14} />} loading={syncing} onClick={() => triggerSync("syncAll")}>
              Sync All
            </Button>
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <Button size="sm" variant="default" loading={syncing} onClick={() => triggerSync("syncAll")} style={{ flex: 1, minWidth: 120 }}>
            Sync All Animals
          </Button>
          <Button size="sm" variant="default" loading={syncing} onClick={() => triggerSync("syncAnimal")} style={{ flex: 1, minWidth: 120 }}>
            Sync Registrations
          </Button>
          <Button size="sm" variant="default" loading={syncing} onClick={() => triggerSync("syncBirth")} style={{ flex: 1, minWidth: 120 }}>
            Sync Births
          </Button>
          <Button size="sm" variant="default" loading={syncing} onClick={() => triggerSync("syncDeath")} style={{ flex: 1, minWidth: 120 }}>
            Sync Deaths
          </Button>
        </div>
      </div>

      <div className="bg-card border border-border" style={{ borderRadius: 12, padding: 20 }}>
        <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--color-primary)", margin: 0, marginBottom: 16 }}>
          Sync History
        </h2>
        <div style={{ overflow: "auto" }}>
          <table className="farm-table" style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left", padding: "8px 12px", borderBottom: "1px solid var(--color-border)", color: "var(--color-muted)", fontWeight: 600 }}>Date</th>
                <th style={{ textAlign: "left", padding: "8px 12px", borderBottom: "1px solid var(--color-border)", color: "var(--color-muted)", fontWeight: 600 }}>Event</th>
                <th style={{ textAlign: "left", padding: "8px 12px", borderBottom: "1px solid var(--color-border)", color: "var(--color-muted)", fontWeight: 600 }}>Animal</th>
                <th style={{ textAlign: "center", padding: "8px 12px", borderBottom: "1px solid var(--color-border)", color: "var(--color-muted)", fontWeight: 600 }}>Status</th>
                <th style={{ textAlign: "left", padding: "8px 12px", borderBottom: "1px solid var(--color-border)", color: "var(--color-muted)", fontWeight: 600 }}>Response</th>
              </tr>
            </thead>
            <tbody>
              {syncRecords.map((r) => (
                <tr key={r.id}>
                  <td style={{ padding: "10px 12px", whiteSpace: "nowrap", color: "var(--color-secondary)" }}>
                    {r.syncedAt ? new Date(r.syncedAt).toLocaleString("en-GB") : new Date(r.createdAt!).toLocaleString("en-GB")}
                  </td>
                  <td style={{ padding: "10px 12px", color: "var(--color-primary)", fontWeight: 500 }}>
                    {EVENT_LABELS[r.eventType] ?? r.eventType}
                  </td>
                  <td style={{ padding: "10px 12px", color: "var(--color-secondary)" }}>
                    {r.animalEarTag ?? "—"}
                  </td>
                  <td style={{ padding: "10px 12px", textAlign: "center" }}>{statusBadge(r.status)}</td>
                  <td style={{ padding: "10px 12px", fontSize: "0.75rem", color: "var(--color-muted)", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis" }}>
                    {r.responseData ? (() => { try { const p = JSON.parse(r.responseData); return p.nationalId ?? p.confirmed === true ? "Confirmed" : r.responseData; } catch { return r.responseData; } })() : r.errorMessage ? <span style={{ color: "#f87171" }}>{r.errorMessage}</span> : "—"}
                  </td>
                </tr>
              ))}
              {syncRecords.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", padding: "40px 20px", fontSize: "0.85rem", color: "var(--color-muted)" }}>
                    No sync records yet. Configure an integration and trigger a sync.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showAddIntegration && (
        <Modal title="Add National Database Connection" onClose={() => { setShowAddIntegration(false); setIntegrationForm({ provider: "bcms", label: "", isActive: true }); }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <FormField as="select" label="Provider" name="provider"
              value={integrationForm.provider ?? "bcms"}
              onChange={(e) => setIntegrationForm((f) => ({ ...f, provider: e.target.value }))}
            >
              {PROVIDERS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
            </FormField>
            <FormField label="Connection Label" name="label" type="text" placeholder="e.g. BCMS Main Herd"
              value={String(integrationForm.label ?? "")}
              onChange={(e) => setIntegrationForm((f) => ({ ...f, label: e.target.value }))}
            />
            <FormField label="API Endpoint (optional)" name="apiEndpoint" type="text" placeholder="e.g. https://api.bcms.gov.uk/v2"
              value={String(integrationForm.apiEndpoint ?? "")}
              onChange={(e) => setIntegrationForm((f) => ({ ...f, apiEndpoint: e.target.value }))}
            />
            <FormField label="API Key (optional)" name="apiKey" type="text" placeholder="Your national database API key"
              value={String(integrationForm.apiKey ?? "")}
              onChange={(e) => setIntegrationForm((f) => ({ ...f, apiKey: e.target.value }))}
            />
            <FormField label="Herd / Flock Mark (optional)" name="herdMark" type="text" placeholder="e.g. UK123456"
              value={String(integrationForm.herdMark ?? "")}
              onChange={(e) => setIntegrationForm((f) => ({ ...f, herdMark: e.target.value }))}
            />
            <FormField as="select" label="Status" name="isActive"
              value={integrationForm.isActive ? "active" : "inactive"}
              onChange={(e) => setIntegrationForm((f) => ({ ...f, isActive: e.target.value === "active" }))}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </FormField>
            <Group grow mt={4}>
              <Button onClick={handleSaveIntegration}>Save Connection</Button>
              <Button variant="default" onClick={() => { setShowAddIntegration(false); setIntegrationForm({ provider: "bcms", label: "", isActive: true }); }}>Cancel</Button>
            </Group>
          </div>
        </Modal>
      )}
    </div>
  );
}
