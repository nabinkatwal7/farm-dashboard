"use client";

import {
  CloudUpload,
  ExternalLink,
  Map,
  Plus,
  Settings,
  Trash2,
  Wheat,
} from "lucide-react";
import dynamic from "next/dynamic";
import { useState } from "react";
import Modal from "@/app/abstract/ui/Modal";
import StatCard from "@/app/abstract/ui/StatCard";
import { useFarmData } from "@/app/base/hooks/useFarmData";
import {
  deleteData,
  generateId,
  saveData,
  type CropField,
  type PrescriptionMap,
  type SeedIntegration,
  type SeedingZone,
} from "@/app/base/services/farm-client";

const SEEDING_ENTITIES = {
  fields: "fields",
  prescriptionMaps: "prescriptionMaps",
  seedIntegrations: "seedIntegrations",
} as const;

const SeedingMap = dynamic(() => import("@/app/components/SeedingMap"), {
  ssr: false,
  loading: () => (
    <div
      style={{
        height: 450,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--bg-base)",
        borderRadius: 10,
        color: "var(--text-muted)",
        fontSize: "0.875rem",
      }}
    >
      Loading map...
    </div>
  ),
});

type Tab = "maps" | "prescriptions" | "integrations";

const ZONE_COLORS = ["#4ade80", "#22d3ee", "#60a5fa", "#fbbf24", "#f87171", "#a78bfa"];
const INTEGRATION_PROVIDERS = [
  { value: "johndeere", label: "John Deere Operations Center" },
  { value: "fendt", label: "FendtONE" },
] as const;

function nextColor(index: number) {
  return ZONE_COLORS[index % ZONE_COLORS.length];
}

function statusBadgeColor(status: string) {
  switch (status) {
    case "active": return { bg: "rgba(74,222,128,0.15)", color: "#4ade80" };
    case "draft": return { bg: "rgba(96,165,250,0.15)", color: "#60a5fa" };
    case "applied": return { bg: "rgba(251,191,36,0.15)", color: "#fbbf24" };
    case "archived": return { bg: "rgba(100,116,139,0.15)", color: "#64748b" };
    default: return { bg: "rgba(100,116,139,0.15)", color: "#64748b" };
  }
}

export default function SeedingPage() {
  const [tab, setTab] = useState<Tab>("maps");
  const { data, reload: load } = useFarmData(SEEDING_ENTITIES);
  const fields = data.fields as CropField[];
  const prescriptionMaps = data.prescriptionMaps as PrescriptionMap[];
  const integrations = data.seedIntegrations as SeedIntegration[];

  const [showAddPrescription, setShowAddPrescription] = useState(false);
  const [showEditMap, setShowEditMap] = useState<PrescriptionMap | null>(null);
  const [showIntegration, setShowIntegration] = useState(false);

  const [prescriptionForm, setPrescriptionForm] = useState<Partial<PrescriptionMap>>({});
  const [integrationForm, setIntegrationForm] = useState<Partial<SeedIntegration>>({});

  const activeMaps = prescriptionMaps.filter((m) => m.status === "active");
  const activeIntegrations = integrations.filter((i) => i.isActive);

  const totalPrescriptionAcres = prescriptionMaps
    .filter((m) => m.status === "active" || m.status === "draft")
    .reduce((sum, m) => {
      const field = fields.find((f) => f.id === m.fieldId);
      return sum + (field?.acres ?? 0);
    }, 0);

  const savePrescription = async () => {
    if (!prescriptionForm.name || !prescriptionForm.fieldId) return;
    const field = fields.find((f) => f.id === prescriptionForm.fieldId);
    const targetRate = prescriptionForm.targetRate ?? 0;
    const zoneCount = Math.min(3, Math.max(2, Math.floor((field?.acres ?? 50) / 15)));
    const baseRate = targetRate;

    const generatedZones: SeedingZone[] = Array.from({ length: zoneCount }, (_, i) => ({
      name: `Zone ${String.fromCharCode(65 + i)}`,
      rate: Math.round(baseRate * (0.7 + i * 0.3)),
      areaAcres: Math.round(((field?.acres ?? 50) / zoneCount) * 10) / 10,
      lat: (field?.lat ?? 53.94) + (i - (zoneCount - 1) / 2) * 0.008,
      lng: (field?.lng ?? -1.07) + (i - (zoneCount - 1) / 2) * 0.008,
      color: nextColor(i),
    }));

    await saveData("prescriptionMaps", {
      id: prescriptionForm.id || generateId(),
      fieldId: prescriptionForm.fieldId,
      fieldName: field?.name ?? "",
      crop: prescriptionForm.crop ?? field?.currentCrop ?? "",
      season: prescriptionForm.season ?? new Date().getFullYear().toString(),
      status: (prescriptionForm.status as PrescriptionMap["status"]) ?? "draft",
      notes: prescriptionForm.notes ?? "",
      zones: generatedZones,
      ...prescriptionForm,
    } as PrescriptionMap);
    await load();
    setShowAddPrescription(false);
    setPrescriptionForm({});
  };

  const saveIntegration = async () => {
    if (!integrationForm.provider || !integrationForm.label) return;
    const existing = integrations.find(
      (i) => i.provider === integrationForm.provider,
    );
    await saveData("seedIntegrations", {
      id: existing?.id || generateId(),
      isActive: true,
      ...integrationForm,
    } as SeedIntegration);
    await load();
    setShowIntegration(false);
    setIntegrationForm({});
  };

  const exportPrescription = async (pm: PrescriptionMap) => {
    await saveData("prescriptionMaps", {
      ...pm,
      status: "active",
      exportedAt: new Date().toISOString(),
      exportFormat: "shapefile",
    } as PrescriptionMap);
    await load();
  };

  return (
    <div style={{ padding: "32px 32px 48px" }}>
      <div style={{ marginBottom: 28 }}>
        <h1
          style={{
            fontSize: "1.6rem",
            fontWeight: 800,
            color: "var(--text-primary)",
            letterSpacing: "-0.02em",
          }}
        >
          Variable-Rate Precision Seeding
        </h1>
        <p
          style={{
            color: "var(--text-muted)",
            fontSize: "0.875rem",
            marginTop: 4,
          }}
        >
          Create prescription seeding maps based on soil fertility zones and sync
          with tractor onboard computers
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 14,
          marginBottom: 24,
        }}
      >
        <StatCard
          label="Prescription Maps"
          value={prescriptionMaps.length}
          sub={`${activeMaps.length} active`}
          icon={Map}
          color="#4ade80"
          delay={0}
        />
        <StatCard
          label="Acres Under Rx"
          value={`${Math.round(totalPrescriptionAcres)}`}
          sub="variable-rate managed"
          icon={Wheat}
          color="#22d3ee"
          delay={60}
        />
        <StatCard
          label="Seeding Zones"
          value={prescriptionMaps.reduce((s, m) => s + m.zones.length, 0)}
          sub="across all prescriptions"
          icon={Settings}
          color="#a78bfa"
          delay={120}
        />
        <StatCard
          label="Connected Machines"
          value={activeIntegrations.length}
          sub={`${integrations.length} total configured`}
          icon={CloudUpload}
          color="#60a5fa"
          delay={180}
        />
      </div>

      <div
        style={{
          display: "flex",
          gap: 4,
          marginBottom: 20,
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          padding: 4,
          borderRadius: 10,
          width: "fit-content",
        }}
      >
        {(
          [
            ["maps", "🗺️ Rx Maps"],
            ["prescriptions", "📋 Prescriptions"],
            ["integrations", "🔗 Integrations"],
          ] as [Tab, string][]
        ).map(([t, label]) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: "8px 20px",
              borderRadius: 7,
              border: "none",
              cursor: "pointer",
              fontSize: "0.85rem",
              fontWeight: tab === t ? 600 : 400,
              background: tab === t ? "rgba(74,222,128,0.15)" : "transparent",
              color: tab === t ? "#4ade80" : "var(--text-secondary)",
              transition: "all 0.15s",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "maps" && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 20 }}>
          <div
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "14px 18px",
                borderBottom: "1px solid var(--border)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span style={{ fontWeight: 600, fontSize: "0.9rem" }}>
                Prescription Map View — Seeding Zones
              </span>
              <button
                className="btn-primary"
                onClick={() => setShowAddPrescription(true)}
              >
                <Plus size={14} /> New Prescription
              </button>
            </div>
            <SeedingMap fields={fields} prescriptionMaps={prescriptionMaps} />
          </div>

          <div
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              padding: "18px",
            }}
          >
            <div
              style={{
                fontWeight: 600,
                fontSize: "0.9rem",
                marginBottom: 14,
                color: "var(--text-primary)",
              }}
            >
              Active Prescriptions
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {prescriptionMaps.filter((m) => m.status === "active" || m.status === "draft").length === 0 && (
                <div
                  style={{
                    color: "var(--text-muted)",
                    fontSize: "0.85rem",
                    padding: "20px 0",
                    textAlign: "center",
                  }}
                >
                  No prescription maps yet. Create one to get started.
                </div>
              )}
              {prescriptionMaps
                .filter((m) => m.status === "active" || m.status === "draft")
                .map((pm) => {
                  const badge = statusBadgeColor(pm.status);
                  return (
                    <div
                      key={pm.id}
                      style={{
                        padding: "12px",
                        borderRadius: 8,
                        background: "rgba(255,255,255,0.02)",
                        border: "1px solid var(--border)",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          marginBottom: 6,
                        }}
                      >
                        <span
                          style={{
                            fontWeight: 600,
                            fontSize: "0.85rem",
                            color: "var(--text-primary)",
                          }}
                        >
                          {pm.name}
                        </span>
                        <span
                          style={{
                            fontSize: "0.7rem",
                            fontWeight: 600,
                            padding: "2px 8px",
                            borderRadius: 6,
                            background: badge.bg,
                            color: badge.color,
                            border: `1px solid ${badge.color}40`,
                          }}
                        >
                          {pm.status}
                        </span>
                      </div>
                      <div
                        style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}
                      >
                        {pm.fieldName} · {pm.crop} · {pm.season}
                      </div>
                      {pm.zones.length > 0 && (
                        <div
                          style={{
                            display: "flex",
                            gap: 4,
                            flexWrap: "wrap",
                            marginTop: 8,
                          }}
                        >
                          <div
                            style={{
                              fontSize: "0.68rem",
                              textTransform: "uppercase",
                              letterSpacing: "0.08em",
                              color: "var(--text-muted)",
                              width: "100%",
                              marginBottom: 2,
                            }}
                          >
                            Seeding Rates
                          </div>
                          {pm.zones.map((z) => (
                            <span
                              key={z.name}
                              style={{
                                fontSize: "0.72rem",
                                background: `${z.color}20`,
                                color: z.color,
                                padding: "2px 8px",
                                borderRadius: 4,
                                fontWeight: 600,
                              }}
                            >
                              {z.name}: {z.rate.toLocaleString()} seeds/ac
                            </span>
                          ))}
                        </div>
                      )}
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "flex-end",
                          gap: 6,
                          marginTop: 10,
                        }}
                      >
                        {pm.status === "draft" && (
                          <button
                            onClick={() => exportPrescription(pm)}
                            className="btn-primary"
                            style={{
                              padding: "4px 10px",
                              fontSize: "0.75rem",
                              display: "flex",
                              alignItems: "center",
                              gap: 4,
                            }}
                          >
                            <CloudUpload size={12} /> Export & Activate
                          </button>
                        )}
                        <button
                          onClick={() => setShowEditMap(pm)}
                          style={{
                            background: "rgba(96,165,250,0.15)",
                            border: "1px solid rgba(96,165,250,0.3)",
                            color: "#60a5fa",
                            borderRadius: 6,
                            padding: "4px 10px",
                            fontSize: "0.8rem",
                            cursor: "pointer",
                          }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={async () => {
                            await deleteData("prescriptionMaps", pm.id);
                            await load();
                          }}
                          style={{
                            background: "rgba(248,113,113,0.15)",
                            border: "1px solid rgba(248,113,113,0.3)",
                            color: "#f87171",
                            borderRadius: 6,
                            padding: "4px 10px",
                            fontSize: "0.8rem",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                          }}
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {tab === "prescriptions" && (
        <div
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: 12,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "14px 18px",
              borderBottom: "1px solid var(--border)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span style={{ fontWeight: 600, fontSize: "0.9rem" }}>
              All Prescription Maps
            </span>
            <button
              className="btn-primary"
              onClick={() => setShowAddPrescription(true)}
            >
              <Plus size={14} /> New Prescription
            </button>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table className="farm-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Field</th>
                  <th>Crop</th>
                  <th>Season</th>
                  <th>Zones</th>
                  <th>Status</th>
                  <th>Exported</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {prescriptionMaps.length === 0 && (
                  <tr>
                    <td colSpan={8} style={{ textAlign: "center", color: "var(--text-muted)", padding: 32 }}>
                      No prescription maps yet
                    </td>
                  </tr>
                )}
                {prescriptionMaps.map((pm) => {
                  const badge = statusBadgeColor(pm.status);
                  return (
                    <tr key={pm.id}>
                      <td
                        style={{ fontWeight: 500, color: "var(--text-primary)" }}
                      >
                        {pm.name}
                      </td>
                      <td>{pm.fieldName}</td>
                      <td>{pm.crop}</td>
                      <td>{pm.season}</td>
                      <td>
                        <span style={{ fontWeight: 600 }}>
                          {pm.zones.length}
                        </span>
                      </td>
                      <td>
                        <span
                          style={{
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            padding: "2px 8px",
                            borderRadius: 6,
                            background: badge.bg,
                            color: badge.color,
                          }}
                        >
                          {pm.status}
                        </span>
                      </td>
                      <td>
                        {pm.exportedAt
                          ? new Date(pm.exportedAt).toLocaleDateString("en-GB")
                          : "—"}
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: 4 }}>
                          {pm.status === "draft" && (
                            <button
                              onClick={() => exportPrescription(pm)}
                              style={{
                                background: "rgba(74,222,128,0.15)",
                                border: "1px solid rgba(74,222,128,0.3)",
                                color: "#4ade80",
                                borderRadius: 6,
                                padding: "4px 8px",
                                fontSize: "0.75rem",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                gap: 3,
                              }}
                              title="Export to tractor"
                            >
                              <CloudUpload size={12} />
                            </button>
                          )}
                          <button
                            onClick={async () => {
                              await deleteData("prescriptionMaps", pm.id);
                              await load();
                            }}
                            style={{
                              background: "rgba(248,113,113,0.15)",
                              border: "1px solid rgba(248,113,113,0.3)",
                              color: "#f87171",
                              borderRadius: 6,
                              padding: "4px 8px",
                              fontSize: "0.8rem",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              gap: 4,
                            }}
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "integrations" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              padding: "20px",
            }}
          >
            <div className="section-header">
              <div className="section-title">
                Tractor Onboard Computer Connections
              </div>
              <button
                className="btn-primary"
                onClick={() => {
                  setIntegrationForm({});
                  setShowIntegration(true);
                }}
              >
                <Plus size={14} /> Add Connection
              </button>
            </div>
            <p
              style={{
                color: "var(--text-muted)",
                fontSize: "0.82rem",
                marginTop: 8,
                marginBottom: 16,
              }}
            >
              Connect to John Deere Operations Center or FendtONE to upload
              prescription seeding maps directly to your tractor fleet.
            </p>

            {integrations.length === 0 && (
              <div
                style={{
                  color: "var(--text-muted)",
                  fontSize: "0.85rem",
                  padding: "32px 0",
                  textAlign: "center",
                }}
              >
                No integrations configured. Add a connection to sync prescription
                maps with your tractor onboard computer.
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {integrations.map((int) => (
                <div
                  key={int.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "14px 16px",
                    borderRadius: 10,
                    background: "rgba(255,255,255,0.02)",
                    border: `1px solid ${int.isActive ? "rgba(74,222,128,0.3)" : "var(--border)"}`,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 10,
                        background: int.provider === "johndeere"
                          ? "rgba(33,150,243,0.15)"
                          : "rgba(76,175,80,0.15)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "1.2rem",
                      }}
                    >
                      {int.provider === "johndeere" ? "JD" : "FT"}
                    </div>
                    <div>
                      <div
                        style={{
                          fontWeight: 600,
                          fontSize: "0.9rem",
                          color: "var(--text-primary)",
                        }}
                      >
                        {int.label}
                      </div>
                      <div
                        style={{
                          fontSize: "0.78rem",
                          color: "var(--text-muted)",
                        }}
                      >
                        {int.provider === "johndeere"
                          ? "John Deere Operations Center"
                          : "FendtONE"}{" "}
                        · {int.machineName ?? "No machine assigned"}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span
                      style={{
                        fontSize: "0.72rem",
                        fontWeight: 600,
                        padding: "3px 10px",
                        borderRadius: 6,
                        background: int.isActive
                          ? "rgba(74,222,128,0.15)"
                          : "rgba(100,116,139,0.15)",
                        color: int.isActive ? "#4ade80" : "#64748b",
                      }}
                    >
                      {int.isActive ? "Connected" : "Disconnected"}
                    </span>
                    {int.lastSyncAt && (
                      <span
                        style={{
                          fontSize: "0.7rem",
                          color: "var(--text-muted)",
                        }}
                      >
                        Last sync:{" "}
                        {new Date(int.lastSyncAt).toLocaleDateString("en-GB")}
                      </span>
                    )}
                    <button
                      onClick={async () => {
                        const updated = { ...int, isActive: !int.isActive };
                        await saveData("seedIntegrations", updated as SeedIntegration);
                        await load();
                      }}
                      style={{
                        background: "rgba(96,165,250,0.15)",
                        border: "1px solid rgba(96,165,250,0.3)",
                        color: "#60a5fa",
                        borderRadius: 6,
                        padding: "4px 10px",
                        fontSize: "0.75rem",
                        cursor: "pointer",
                      }}
                    >
                      {int.isActive ? "Disconnect" : "Connect"}
                    </button>
                    <button
                      onClick={async () => {
                        await deleteData("seedIntegrations", int.id);
                        await load();
                      }}
                      style={{
                        background: "rgba(248,113,113,0.15)",
                        border: "1px solid rgba(248,113,113,0.3)",
                        color: "#f87171",
                        borderRadius: 6,
                        padding: "4px 8px",
                        fontSize: "0.8rem",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                      }}
                      title="Remove integration"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {activeIntegrations.length > 0 && prescriptionMaps.filter((m) => m.status === "active").length > 0 && (
            <div
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
                borderRadius: 12,
                padding: "20px",
              }}
            >
              <div className="section-header">
                <div className="section-title">
                  <CloudUpload size={16} /> Pending Syncs
                </div>
              </div>
              <table className="farm-table">
                <thead>
                  <tr>
                    <th>Prescription Map</th>
                    <th>Field</th>
                    <th>Zones</th>
                    <th>Export Format</th>
                    <th>Target Tractor</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {prescriptionMaps
                    .filter((m) => m.status === "active" && !m.exportedAt)
                    .map((pm) => (
                      <tr key={pm.id}>
                        <td style={{ fontWeight: 500, color: "var(--text-primary)" }}>
                          {pm.name}
                        </td>
                        <td>{pm.fieldName}</td>
                        <td>{pm.zones.length} zones</td>
                        <td>Shapefile (.shp)</td>
                        <td>
                          {activeIntegrations.map((i) => i.machineName).join(", ") || "All connected"}
                        </td>
                        <td>
                          <button
                            onClick={() => exportPrescription(pm)}
                            className="btn-primary"
                            style={{
                              padding: "4px 10px",
                              fontSize: "0.75rem",
                              display: "flex",
                              alignItems: "center",
                              gap: 4,
                            }}
                          >
                            <ExternalLink size={12} /> Sync Now
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {showAddPrescription && (
        <Modal
          title="Create Prescription Map"
          onClose={() => setShowAddPrescription(false)}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label
                style={{
                  fontSize: "0.8rem",
                  color: "var(--text-muted)",
                  display: "block",
                  marginBottom: 6,
                }}
              >
                Prescription Name
              </label>
              <input
                className="farm-input"
                type="text"
                placeholder="e.g. North Field Spring Wheat Rx"
                value={String(prescriptionForm.name ?? "")}
                onChange={(e) =>
                  setPrescriptionForm((f) => ({ ...f, name: e.target.value }))
                }
              />
            </div>
            <div>
              <label
                style={{
                  fontSize: "0.8rem",
                  color: "var(--text-muted)",
                  display: "block",
                  marginBottom: 6,
                }}
              >
                Field
              </label>
              <select
                className="farm-input"
                value={prescriptionForm.fieldId ?? ""}
                onChange={(e) => {
                  const f = fields.find((f) => f.id === e.target.value);
                  setPrescriptionForm((prev) => ({
                    ...prev,
                    fieldId: e.target.value,
                    fieldName: f?.name ?? "",
                    crop: prev.crop || f?.currentCrop || "",
                  }));
                }}
              >
                <option value="">Select field...</option>
                {fields.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name} ({f.acres} ac — {f.currentCrop})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                style={{
                  fontSize: "0.8rem",
                  color: "var(--text-muted)",
                  display: "block",
                  marginBottom: 6,
                }}
              >
                Crop
              </label>
              <input
                className="farm-input"
                type="text"
                placeholder="Winter Wheat"
                value={String(prescriptionForm.crop ?? "")}
                onChange={(e) =>
                  setPrescriptionForm((f) => ({ ...f, crop: e.target.value }))
                }
              />
            </div>
            <div>
              <label
                style={{
                  fontSize: "0.8rem",
                  color: "var(--text-muted)",
                  display: "block",
                  marginBottom: 6,
                }}
              >
                Season / Year
              </label>
              <input
                className="farm-input"
                type="text"
                placeholder={new Date().getFullYear().toString()}
                value={String(prescriptionForm.season ?? "")}
                onChange={(e) =>
                  setPrescriptionForm((f) => ({ ...f, season: e.target.value }))
                }
              />
            </div>
            <div>
              <label
                style={{
                  fontSize: "0.8rem",
                  color: "var(--text-muted)",
                  display: "block",
                  marginBottom: 6,
                }}
              >
                Base Target Rate (seeds/ac)
              </label>
              <input
                className="farm-input"
                type="number"
                placeholder="35000"
                value={String(prescriptionForm.targetRate ?? "")}
                onChange={(e) =>
                  setPrescriptionForm((f) => ({
                    ...f,
                    targetRate: +e.target.value,
                  }))
                }
              />
            </div>
            <div>
              <label
                style={{
                  fontSize: "0.8rem",
                  color: "var(--text-muted)",
                  display: "block",
                  marginBottom: 6,
                }}
              >
                Notes
              </label>
              <input
                className="farm-input"
                type="text"
                placeholder="Soil sample results, fertility notes..."
                value={String(prescriptionForm.notes ?? "")}
                onChange={(e) =>
                  setPrescriptionForm((f) => ({ ...f, notes: e.target.value }))
                }
              />
            </div>
            <div
              style={{
                background: "rgba(34,211,238,0.08)",
                border: "1px solid rgba(34,211,238,0.2)",
                borderRadius: 8,
                padding: "12px",
                fontSize: "0.78rem",
                color: "var(--text-muted)",
              }}
            >
              Zones will be auto-generated based on field size with varying seeding
              rates (±30% of target). You can fine-tune zones after creation.
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
              <button
                className="btn-primary"
                style={{ flex: 1 }}
                onClick={savePrescription}
              >
                Create Prescription
              </button>
              <button
                className="btn-ghost"
                onClick={() => setShowAddPrescription(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </Modal>
      )}

      {showEditMap && (
        <Modal
          title={`Edit Zones — ${showEditMap.name}`}
          onClose={() => setShowEditMap(null)}
          maxWidth={600}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div
              style={{
                fontSize: "0.8rem",
                color: "var(--text-muted)",
                marginBottom: 4,
              }}
            >
              Adjust seeding rates per zone. Each zone targets a soil fertility
              variant within the field.
            </div>
            {showEditMap.zones.map((zone, i) => (
              <div
                key={zone.name}
                style={{
                  padding: "12px",
                  borderRadius: 8,
                  border: `1px solid ${zone.color}40`,
                  background: `${zone.color}08`,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 8,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div
                      style={{
                        width: 12,
                        height: 12,
                        borderRadius: "50%",
                        background: zone.color,
                      }}
                    />
                    <span
                      style={{
                        fontWeight: 600,
                        fontSize: "0.85rem",
                        color: "var(--text-primary)",
                      }}
                    >
                      {zone.name}
                    </span>
                  </div>
                  <span
                    style={{
                      fontSize: "0.78rem",
                      color: "var(--text-muted)",
                    }}
                  >
                    {zone.areaAcres} acres
                  </span>
                </div>
                <div
                  style={{
                    display: "flex",
                    gap: 12,
                    alignItems: "center",
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <label
                      style={{
                        fontSize: "0.72rem",
                        color: "var(--text-muted)",
                        display: "block",
                        marginBottom: 3,
                      }}
                    >
                      Rate (seeds/ac)
                    </label>
                    <input
                      className="farm-input"
                      type="number"
                      value={zone.rate}
                      onChange={async (e) => {
                        const updated = { ...showEditMap };
                        updated.zones = [...updated.zones];
                        updated.zones[i] = {
                          ...zone,
                          rate: +e.target.value,
                        };
                        setShowEditMap(updated);
                      }}
                      style={{ padding: "6px 10px", fontSize: "0.85rem" }}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label
                      style={{
                        fontSize: "0.72rem",
                        color: "var(--text-muted)",
                        display: "block",
                        marginBottom: 3,
                      }}
                    >
                      Zone Color
                    </label>
                    <input
                      type="color"
                      value={zone.color}
                      onChange={async (e) => {
                        const updated = { ...showEditMap };
                        updated.zones = [...updated.zones];
                        updated.zones[i] = {
                          ...zone,
                          color: e.target.value,
                        };
                        setShowEditMap(updated);
                      }}
                      style={{
                        width: "100%",
                        height: 32,
                        borderRadius: 6,
                        border: "1px solid var(--border)",
                        background: "var(--bg-base)",
                        cursor: "pointer",
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
            <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
              <button
                className="btn-primary"
                style={{ flex: 1 }}
                onClick={async () => {
                  await saveData("prescriptionMaps", showEditMap as PrescriptionMap);
                  setShowEditMap(null);
                  await load();
                }}
              >
                Save Zones
              </button>
              <button
                className="btn-ghost"
                onClick={() => setShowEditMap(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        </Modal>
      )}

      {showIntegration && (
        <Modal
          title="Add Tractor Integration"
          onClose={() => setShowIntegration(false)}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label
                style={{
                  fontSize: "0.8rem",
                  color: "var(--text-muted)",
                  display: "block",
                  marginBottom: 6,
                }}
              >
                Provider
              </label>
              <select
                className="farm-input"
                value={integrationForm.provider ?? ""}
                onChange={(e) => {
                  const provider = e.target.value;
                  const p = INTEGRATION_PROVIDERS.find((p) => p.value === provider);
                  setIntegrationForm((f) => ({
                    ...f,
                    provider: provider as "johndeere" | "fendt",
                    label: p?.label ?? provider,
                  }));
                }}
              >
                <option value="">Select provider...</option>
                {INTEGRATION_PROVIDERS.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                style={{
                  fontSize: "0.8rem",
                  color: "var(--text-muted)",
                  display: "block",
                  marginBottom: 6,
                }}
              >
                Connection Label
              </label>
              <input
                className="farm-input"
                type="text"
                placeholder="e.g. Main Tractor (Deere 8R)"
                value={String(integrationForm.label ?? "")}
                onChange={(e) =>
                  setIntegrationForm((f) => ({ ...f, label: e.target.value }))
                }
              />
            </div>
            <div>
              <label
                style={{
                  fontSize: "0.8rem",
                  color: "var(--text-muted)",
                  display: "block",
                  marginBottom: 6,
                }}
              >
                API Endpoint
              </label>
              <input
                className="farm-input"
                type="text"
                placeholder={
                  integrationForm.provider === "johndeere"
                    ? "https://api.deere.com/v2"
                    : "https://api.fendt.com/v1"
                }
                value={String(integrationForm.apiEndpoint ?? "")}
                onChange={(e) =>
                  setIntegrationForm((f) => ({ ...f, apiEndpoint: e.target.value }))
                }
              />
            </div>
            <div>
              <label
                style={{
                  fontSize: "0.8rem",
                  color: "var(--text-muted)",
                  display: "block",
                  marginBottom: 6,
                }}
              >
                API Key
              </label>
              <input
                className="farm-input"
                type="password"
                placeholder="Enter API key"
                value={String(integrationForm.apiKey ?? "")}
                onChange={(e) =>
                  setIntegrationForm((f) => ({ ...f, apiKey: e.target.value }))
                }
              />
            </div>
            <div>
              <label
                style={{
                  fontSize: "0.8rem",
                  color: "var(--text-muted)",
                  display: "block",
                  marginBottom: 6,
                }}
              >
                Username
              </label>
              <input
                className="farm-input"
                type="text"
                placeholder="Operations Center username"
                value={String(integrationForm.username ?? "")}
                onChange={(e) =>
                  setIntegrationForm((f) => ({ ...f, username: e.target.value }))
                }
              />
            </div>
            <div>
              <label
                style={{
                  fontSize: "0.8rem",
                  color: "var(--text-muted)",
                  display: "block",
                  marginBottom: 6,
                }}
              >
                Machine ID
              </label>
              <input
                className="farm-input"
                type="text"
                placeholder="e.g. JD8R-4102"
                value={String(integrationForm.machineId ?? "")}
                onChange={(e) =>
                  setIntegrationForm((f) => ({ ...f, machineId: e.target.value }))
                }
              />
            </div>
            <div>
              <label
                style={{
                  fontSize: "0.8rem",
                  color: "var(--text-muted)",
                  display: "block",
                  marginBottom: 6,
                }}
              >
                Machine Name
              </label>
              <input
                className="farm-input"
                type="text"
                placeholder="e.g. John Deere 8R 410"
                value={String(integrationForm.machineName ?? "")}
                onChange={(e) =>
                  setIntegrationForm((f) => ({ ...f, machineName: e.target.value }))
                }
              />
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
              <button
                className="btn-primary"
                style={{ flex: 1 }}
                onClick={saveIntegration}
              >
                Save Integration
              </button>
              <button
                className="btn-ghost"
                onClick={() => setShowIntegration(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
