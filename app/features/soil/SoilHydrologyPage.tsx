"use client";

import FormField from "@/app/abstract/ui/FormField";
import Modal from "@/app/abstract/ui/Modal";
import StatCard from "@/app/abstract/ui/StatCard";
import TableSkeleton from "@/app/abstract/ui/TableSkeleton";
import HelpHint from "@/app/abstract/ui/HelpHint";
import { useFarmData } from "@/app/base/hooks/useFarmData";
import {
  deleteData,
  generateId,
  saveData,
  type CropField,
  type IrrigationEvent,
  type SoilMoistureRecord,
  type SoilZone,
  type WaterTableReading,
} from "@/app/base/services/farm-client";
import { useCurrentUser } from "@/app/lib/user-context";
import { Button, Group } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
  BarChart3,
  Droplets,
  Gauge,
  Plus,
  Trash2,
  Waves,
} from "lucide-react";
import { useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const SOIL_ENTITIES = {
  fields: "fields",
  soilZones: "soilZones",
  soilMoistureRecords: "soilMoistureRecords",
  waterTableReadings: "waterTableReadings",
  irrigationEvents: "irrigationEvents",
} as const;

type Tab = "water-table" | "moisture" | "irrigation";

const METHOD_COLORS: Record<string, string> = {
  drip: "#60a5fa",
  sprinkler: "#4ade80",
  flood: "#fbbf24",
  pivot: "#a78bfa",
  other: "#64748b",
};

function getMethodColor(method: string) {
  return METHOD_COLORS[method] ?? "#64748b";
}

export default function SoilHydrologyPage() {
  const [tab, setTab] = useState<Tab>("water-table");
  const currentUser = useCurrentUser();
  const { data, reload, loading } = useFarmData(SOIL_ENTITIES);
  const fields = data.fields as CropField[];
  const soilZones = data.soilZones as SoilZone[];
  const moistureRecords = data.soilMoistureRecords as SoilMoistureRecord[];
  const waterTableReadings = data.waterTableReadings as WaterTableReading[];
  const irrigationEvents = data.irrigationEvents as IrrigationEvent[];

  const [showAddZone, setShowAddZone] = useState(false);
  const [showAddReading, setShowAddReading] = useState(false);
  const [showAddIrrigation, setShowAddIrrigation] = useState(false);
  const [zoneForm, setZoneForm] = useState<Partial<SoilZone>>({});
  const [readingForm, setReadingForm] = useState<Partial<WaterTableReading>>({});
  const [irrigationForm, setIrrigationForm] = useState<Partial<IrrigationEvent>>({});
  const [selectedFieldId, setSelectedFieldId] = useState<string>("");
  const [waterBudgets, setWaterBudgets] = useState<Record<string, {
    totalIrrigationMm: number;
    totalPrecipitationMm: number;
    totalInputMm: number;
    estimatedEtMm: number;
    netWaterMm: number;
    deficitSurplusMm: number;
  }>>({});

  const activeFields = fields.filter((f) => f.status !== "fallow");
  const selectedField = fields.find((f) => f.id === selectedFieldId);

  useEffect(() => {
    if (!selectedFieldId && activeFields.length > 0) {
      setSelectedFieldId(activeFields[0].id);
    }
  }, [activeFields.length]);

  useEffect(() => {
    if (!selectedFieldId) return;
    const season = new Date().getFullYear();
    fetch("/api/soil/water-budget", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fieldId: selectedFieldId, season }),
    })
      .then((r) => r.json())
      .then((result) => {
        if (result.totalInputMm !== undefined) {
          setWaterBudgets((prev) => ({ ...prev, [selectedFieldId]: result }));
        }
      })
      .catch(() => {});
  }, [selectedFieldId]);

  const fieldZones = soilZones.filter((z) => z.fieldId === selectedFieldId);
  const fieldReadings = waterTableReadings.filter(
    (r) => !r.fieldId || r.fieldId === selectedFieldId,
  );
  const fieldIrrigation = irrigationEvents.filter(
    (e) => e.fieldId === selectedFieldId,
  );

  const sortedReadings = [...fieldReadings].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
  );

  const waterTableChartData = sortedReadings.map((r) => ({
    date: new Date(r.timestamp).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
    }),
    depth: r.depthToWater,
    label: r.wellName ?? "",
  }));

  const moistureProfileData = fieldZones.map((z) => {
    const zoneRecords = moistureRecords
      .filter((r) => r.zoneId === z.id)
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      );
    const avgMoisture =
      zoneRecords.length > 0
        ? zoneRecords.reduce((s, r) => s + r.moisturePercent, 0) /
          zoneRecords.length
        : 0;
    return {
      name: `${z.name} (${z.depthFrom}-${z.depthTo}cm)`,
      avgMoisture: Math.round(avgMoisture * 10) / 10,
      latestMoisture:
        zoneRecords.length > 0
          ? Math.round(zoneRecords[0].moisturePercent * 10) / 10
          : 0,
      depthFrom: z.depthFrom,
      depthTo: z.depthTo,
    };
  });

  const irrigationByMethod = fieldIrrigation.reduce(
    (acc, e) => {
      acc[e.method] = (acc[e.method] ?? 0) + e.amountMm;
      return acc;
    },
    {} as Record<string, number>,
  );

  const irrigationChartData = Object.entries(irrigationByMethod).map(
    ([method, amount]) => ({
      method: method.charAt(0).toUpperCase() + method.slice(1),
      amount: Math.round(amount * 10) / 10,
    }),
  );

  const irrigationTimeline = [...fieldIrrigation]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map((e) => ({
      date: new Date(e.date).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
      }),
      amount: e.amountMm,
    }));

  const budget = selectedFieldId ? waterBudgets[selectedFieldId] : null;

  const totalZoneRecords = fieldZones.reduce(
    (s, z) => s + moistureRecords.filter((r) => r.zoneId === z.id).length,
    0,
  );

  const totalIrrigationMm = fieldIrrigation.reduce((s, e) => s + e.amountMm, 0);

  const latestReading = sortedReadings[sortedReadings.length - 1];

  if (loading) return <TableSkeleton />;

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 28 }}>
        <h1
          className="text-primary"
          style={{ fontSize: "1.6rem", fontWeight: 800, letterSpacing: "-0.02em" }}
        >
          Soil Hydrology & Moisture Mapping
        </h1>
        <p className="text-muted" style={{ fontSize: "0.875rem", marginTop: 4 }}>
          Water-table trends, moisture retention profiles, and field irrigation efficiency across {activeFields.length} active fields
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
          label="Soil Zones"
          value={soilZones.length}
          sub={`${totalZoneRecords} moisture records`}
          icon={Gauge}
          color="#fbbf24"
          delay={0}
        />
        <StatCard
          label="Water Table Readings"
          value={waterTableReadings.length}
          sub={latestReading ? `${latestReading.depthToWater}cm latest` : "No data"}
          icon={Waves}
          color="#60a5fa"
          delay={60}
        />
        <StatCard
          label="Irrigation Events"
          value={irrigationEvents.length}
          sub={`${totalIrrigationMm.toFixed(0)}mm total applied`}
          icon={Droplets}
          color="#4ade80"
          delay={120}
        />
        <StatCard
          label="Monitored Fields"
          value={fieldZones.length > 0 ? new Set(fieldZones.map((z) => z.fieldId)).size : 0}
          sub="with active soil zones"
          icon={BarChart3}
          color="#a78bfa"
          delay={180}
        />
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 16, alignItems: "center" }}>
        <div
          className="bg-card border border-border"
          style={{
            display: "flex",
            gap: 4,
            padding: 4,
            borderRadius: 10,
            width: "fit-content",
          }}
        >
          {(
            [
              ["water-table", "Water Table"],
              ["moisture", "Moisture Profile"],
              ["irrigation", "Irrigation Efficiency"],
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
                background: tab === t ? "rgba(96,165,250,0.15)" : "transparent",
                color: tab === t ? "#60a5fa" : "var(--text-secondary)",
                transition: "all 0.15s",
              }}
            >
              {label}
            </button>
          ))}
        </div>

        <select
          value={selectedFieldId}
          onChange={(e) => setSelectedFieldId(e.target.value)}
          style={{
            padding: "6px 12px",
            borderRadius: 8,
            border: "1px solid var(--border)",
            background: "var(--bg-card)",
            color: "var(--text-primary)",
            fontSize: "0.8rem",
            fontWeight: 500,
          }}
        >
          <option value="">All fields</option>
          {activeFields.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name}
            </option>
          ))}
        </select>
      </div>

      {tab === "water-table" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div
            className="bg-card border border-border"
            style={{ borderRadius: 12, overflow: "hidden" }}
          >
            <div
              className="border-b border-border"
              style={{
                padding: "14px 18px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span style={{ fontWeight: 600, fontSize: "0.9rem" }}>
                Water Table Depth Trend
              </span>
              <button
                className="btn-primary"
                onClick={() => setShowAddReading(true)}
              >
                <Plus size={14} /> Add Reading
              </button>
            </div>
            <div style={{ padding: 20 }}>
              {waterTableChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={waterTableChartData}>
                    <defs>
                      <linearGradient id="waterTableFill" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="#60a5fa" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="#60a5fa" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="rgba(255,255,255,0.05)"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="date"
                      tick={{ fill: "#64748b", fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                      interval="preserveStartEnd"
                    />
                    <YAxis
                      tick={{ fill: "#64748b", fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                      reversed
                      domain={["auto", "auto"]}
                      label={{
                        value: "Depth (cm)",
                        angle: -90,
                        position: "insideLeft",
                        style: { fill: "#64748b", fontSize: 11 },
                      }}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "var(--bg-card)",
                        border: "1px solid var(--border)",
                        borderRadius: 8,
                        fontSize: "0.8rem",
                      }}
                      formatter={(value) => [`${value} cm`, "Depth"]}
                    />
                    <Area
                      type="monotone"
                      dataKey="depth"
                      stroke="#60a5fa"
                      fill="url(#waterTableFill)"
                      strokeWidth={2.5}
                      name="Water Table Depth"
                      dot={{ r: 3, fill: "#60a5fa" }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div
                  className="text-muted"
                  style={{
                    textAlign: "center",
                    padding: "40px 20px",
                    fontSize: "0.85rem",
                  }}
                >
                  No water table readings recorded. Add readings to track water table depth trends.
                </div>
              )}
            </div>
          </div>

          <div
            className="bg-card border border-border"
            style={{ borderRadius: 12, overflow: "hidden" }}
          >
            <div
              className="border-b border-border"
              style={{
                padding: "14px 18px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span style={{ fontWeight: 600, fontSize: "0.9rem" }}>
                Recent Readings
              </span>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table className="farm-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Depth (cm)</th>
                    <th>Well</th>
                    <th>Field</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {sortedReadings.slice(-20).reverse().map((r) => (
                    <tr key={r.id}>
                      <td>
                        {new Date(r.timestamp).toLocaleDateString("en-GB")}
                      </td>
                      <td style={{ fontWeight: 600 }}>{r.depthToWater} cm</td>
                      <td className="text-muted">{r.wellName ?? "—"}</td>
                      <td className="text-muted">
                        {r.fieldId
                          ? fields.find((f) => f.id === r.fieldId)?.name ?? "—"
                          : "Farm-wide"}
                      </td>
                      <td>
                        <button
                          onClick={async () => {
                            try {
                              await deleteData("waterTableReadings", r.id);
                              notifications.show({ title: "Deleted", message: "Water table reading removed", color: "green" });
                              await reload();
                            } catch (e) {
                              notifications.show({ title: "Error", message: e instanceof Error ? e.message : "Failed to delete", color: "red" });
                            }
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
                          title="Delete reading"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {sortedReadings.length === 0 && (
                    <tr>
                      <td
                        colSpan={5}
                        className="text-muted"
                        style={{
                          textAlign: "center",
                          padding: "40px 20px",
                          fontSize: "0.85rem",
                        }}
                      >
                        No readings yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === "moisture" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div
            className="bg-card border border-border"
            style={{ borderRadius: 12, overflow: "hidden" }}
          >
            <div
              className="border-b border-border"
              style={{
                padding: "14px 18px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span style={{ fontWeight: 600, fontSize: "0.9rem" }}>
                Moisture Retention by Depth
              </span>
              <button
                className="btn-primary"
                onClick={() => setShowAddZone(true)}
              >
                <Plus size={14} /> Add Soil Zone
              </button>
            </div>
            <div style={{ padding: 20 }}>
              {moistureProfileData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={moistureProfileData}
                    layout="vertical"
                    barSize={28}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="rgba(255,255,255,0.05)"
                      horizontal={false}
                    />
                    <XAxis
                      type="number"
                      domain={[0, 100]}
                      tick={{ fill: "#64748b", fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                      label={{
                        value: "Moisture %",
                        position: "insideBottom",
                        offset: -8,
                        style: { fill: "#64748b", fontSize: 11 },
                      }}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      tick={{ fill: "#64748b", fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                      width={160}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "var(--bg-card)",
                        border: "1px solid var(--border)",
                        borderRadius: 8,
                        fontSize: "0.8rem",
                      }}
                    />
                    <Bar
                      dataKey="avgMoisture"
                      name="Avg Moisture %"
                      fill="#60a5fa"
                      radius={[0, 4, 4, 0]}
                    >
                      {moistureProfileData.map((entry, idx) => (
                        <Cell
                          key={idx}
                          fill={
                            entry.avgMoisture > 60
                              ? "#4ade80"
                              : entry.avgMoisture > 30
                                ? "#fbbf24"
                                : "#f87171"
                          }
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div
                  className="text-muted"
                  style={{
                    textAlign: "center",
                    padding: "40px 20px",
                    fontSize: "0.85rem",
                  }}
                >
                  No soil zones configured for this field. Add zones to start monitoring moisture at different depths.
                </div>
              )}
            </div>
          </div>

          <div
            className="bg-card border border-border"
            style={{ borderRadius: 12, overflow: "hidden" }}
          >
            <div
              className="border-b border-border"
              style={{
                padding: "14px 18px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span style={{ fontWeight: 600, fontSize: "0.9rem" }}>
                Soil Zones
              </span>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table className="farm-table">
                <thead>
                  <tr>
                    <th>Zone Name</th>
                    <th>Depth</th>
                    <th>Soil Type</th>
                    <th>Readings</th>
                    <th>Avg Moisture</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {fieldZones.map((z) => {
                    const zoneRecs = moistureRecords.filter(
                      (r) => r.zoneId === z.id,
                    );
                    const avgM =
                      zoneRecs.length > 0
                        ? (
                            zoneRecs.reduce((s, r) => s + r.moisturePercent, 0) /
                            zoneRecs.length
                          ).toFixed(1)
                        : "—";
                    return (
                      <tr key={z.id}>
                        <td className="text-primary" style={{ fontWeight: 500 }}>
                          {z.name}
                        </td>
                        <td>
                          {z.depthFrom}-{z.depthTo} cm
                        </td>
                        <td className="text-muted">{z.soilType ?? "—"}</td>
                        <td>{zoneRecs.length}</td>
                        <td>
                          <span
                            className={
                              +avgM > 60
                                ? "badge-green"
                                : +avgM > 30
                                  ? "badge-yellow"
                                  : "badge-red"
                            }
                          >
                            {avgM}%
                          </span>
                        </td>
                        <td>
                          <button
                            onClick={async () => {
                              try {
                                await deleteData("soilZones", z.id);
                                notifications.show({ title: "Deleted", message: "Soil zone removed", color: "green" });
                                await reload();
                              } catch (e) {
                                notifications.show({ title: "Error", message: e instanceof Error ? e.message : "Failed to delete", color: "red" });
                              }
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
                            title="Delete zone"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {fieldZones.length === 0 && (
                    <tr>
                      <td
                        colSpan={6}
                        className="text-muted"
                        style={{
                          textAlign: "center",
                          padding: "40px 20px",
                          fontSize: "0.85rem",
                        }}
                      >
                        No soil zones for this field.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === "irrigation" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {budget && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: 14,
              }}
            >
              <div
                className="bg-card border border-border"
                style={{ borderRadius: 12, padding: 18, textAlign: "center" }}
              >
                <div className="text-muted" style={{ fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Water Input
                </div>
                <div className="text-primary" style={{ fontSize: "1.5rem", fontWeight: 700, marginTop: 4 }}>
                  {budget.totalInputMm} <span style={{ fontSize: "0.75rem", fontWeight: 400, color: "var(--text-muted)" }}>mm</span>
                </div>
                <div className="text-muted" style={{ fontSize: "0.75rem", marginTop: 2 }}>
                  {budget.totalIrrigationMm}mm irrigation + {budget.totalPrecipitationMm}mm rain
                </div>
              </div>
              <div
                className="bg-card border border-border"
                style={{ borderRadius: 12, padding: 18, textAlign: "center" }}
              >
                <div className="text-muted" style={{ fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Estimated ET
                </div>
                <div className="text-primary" style={{ fontSize: "1.5rem", fontWeight: 700, marginTop: 4 }}>
                  {budget.estimatedEtMm} <span style={{ fontSize: "0.75rem", fontWeight: 400, color: "var(--text-muted)" }}>mm</span>
                </div>
                <div className="text-muted" style={{ fontSize: "0.75rem", marginTop: 2 }}>
                  evapotranspiration
                </div>
              </div>
              <div
                className="bg-card border border-border"
                style={{ borderRadius: 12, padding: 18, textAlign: "center" }}
              >
                <div className="text-muted" style={{ fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Net Water
                </div>
                <div
                  style={{
                    fontSize: "1.5rem",
                    fontWeight: 700,
                    marginTop: 4,
                    color: budget.netWaterMm >= 0 ? "#4ade80" : "#f87171",
                  }}
                >
                  {budget.netWaterMm >= 0 ? "+" : ""}{budget.netWaterMm} <span style={{ fontSize: "0.75rem", fontWeight: 400, color: "var(--text-muted)" }}>mm</span>
                </div>
                <div className="text-muted" style={{ fontSize: "0.75rem", marginTop: 2 }}>
                  input minus ET
                </div>
              </div>
              <div
                className="bg-card border border-border"
                style={{ borderRadius: 12, padding: 18, textAlign: "center" }}
              >
                <div className="text-muted" style={{ fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Deficit / Surplus
                </div>
                <div
                  style={{
                    fontSize: "1.5rem",
                    fontWeight: 700,
                    marginTop: 4,
                    color: budget.deficitSurplusMm >= 0 ? "#4ade80" : "#f87171",
                  }}
                >
                  {budget.deficitSurplusMm >= 0 ? "+" : ""}{budget.deficitSurplusMm} <span style={{ fontSize: "0.75rem", fontWeight: 400, color: "var(--text-muted)" }}>mm</span>
                </div>
                <div className="text-muted" style={{ fontSize: "0.75rem", marginTop: 2 }}>
                  {budget.deficitSurplusMm >= 0 ? "surplus" : "deficit"}
                </div>
              </div>
            </div>
          )}

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 20,
            }}
          >
            <div
              className="bg-card border border-border"
              style={{ borderRadius: 12, overflow: "hidden" }}
            >
              <div
                className="border-b border-border"
                style={{
                  padding: "14px 18px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span style={{ fontWeight: 600, fontSize: "0.9rem" }}>
                  By Method
                </span>
              </div>
              <div style={{ padding: 20 }}>
                {irrigationChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={irrigationChartData} layout="vertical" barSize={32}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="rgba(255,255,255,0.05)"
                        horizontal={false}
                      />
                      <XAxis
                        type="number"
                        tick={{ fill: "#64748b", fontSize: 10 }}
                        axisLine={false}
                        tickLine={false}
                        label={{
                          value: "mm",
                          position: "insideBottom",
                          offset: -6,
                          style: { fill: "#64748b", fontSize: 11 },
                        }}
                      />
                      <YAxis
                        type="category"
                        dataKey="method"
                        tick={{ fill: "#64748b", fontSize: 10 }}
                        axisLine={false}
                        tickLine={false}
                        width={90}
                      />
                      <Tooltip
                        contentStyle={{
                          background: "var(--bg-card)",
                          border: "1px solid var(--border)",
                          borderRadius: 8,
                          fontSize: "0.8rem",
                        }}
                        formatter={(value) => [`${value} mm`, "Applied"]}
                      />
                      <Bar
                        dataKey="amount"
                        name="Amount (mm)"
                        radius={[0, 4, 4, 0]}
                      >
                        {irrigationChartData.map((entry, idx) => (
                          <Cell
                            key={idx}
                            fill={getMethodColor(entry.method.toLowerCase())}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div
                    className="text-muted"
                    style={{
                      textAlign: "center",
                      padding: "40px 20px",
                      fontSize: "0.85rem",
                    }}
                  >
                    No irrigation data.
                  </div>
                )}
              </div>
            </div>

            <div
              className="bg-card border border-border"
              style={{ borderRadius: 12, overflow: "hidden" }}
            >
              <div
                className="border-b border-border"
                style={{
                  padding: "14px 18px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span style={{ fontWeight: 600, fontSize: "0.9rem" }}>
                  Irrigation Timeline
                </span>
              </div>
              <div style={{ padding: 20 }}>
                {irrigationTimeline.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <AreaChart data={irrigationTimeline}>
                      <defs>
                        <linearGradient id="irrigationFill" x1="0" x2="0" y1="0" y2="1">
                          <stop offset="0%" stopColor="#4ade80" stopOpacity={0.3} />
                          <stop offset="100%" stopColor="#4ade80" stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="rgba(255,255,255,0.05)"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="date"
                        tick={{ fill: "#64748b", fontSize: 10 }}
                        axisLine={false}
                        tickLine={false}
                        interval="preserveStartEnd"
                      />
                      <YAxis
                        tick={{ fill: "#64748b", fontSize: 10 }}
                        axisLine={false}
                        tickLine={false}
                        label={{
                          value: "mm",
                          angle: -90,
                          position: "insideLeft",
                          style: { fill: "#64748b", fontSize: 11 },
                        }}
                      />
                      <Tooltip
                        contentStyle={{
                          background: "var(--bg-card)",
                          border: "1px solid var(--border)",
                          borderRadius: 8,
                          fontSize: "0.8rem",
                        }}
                        formatter={(value) => [`${value} mm`, "Irrigation"]}
                      />
                      <Area
                        type="step"
                        dataKey="amount"
                        stroke="#4ade80"
                        fill="url(#irrigationFill)"
                        strokeWidth={2.5}
                        name="Irrigation"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div
                    className="text-muted"
                    style={{
                      textAlign: "center",
                      padding: "40px 20px",
                      fontSize: "0.85rem",
                    }}
                  >
                    No irrigation events recorded.
                  </div>
                )}
              </div>
            </div>
          </div>

          <div
            className="bg-card border border-border"
            style={{ borderRadius: 12, overflow: "hidden" }}
          >
            <div
              className="border-b border-border"
              style={{
                padding: "14px 18px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span style={{ fontWeight: 600, fontSize: "0.9rem" }}>
                Irrigation Events
              </span>
              <button
                className="btn-primary"
                onClick={() => setShowAddIrrigation(true)}
              >
                <Plus size={14} /> Add Event
              </button>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table className="farm-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Amount</th>
                    <th>Method</th>
                    <th>Source</th>
                    <th>Duration</th>
                    <th>Notes</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {[...fieldIrrigation]
                    .sort(
                      (a, b) =>
                        new Date(b.date).getTime() - new Date(a.date).getTime(),
                    )
                    .map((e) => (
                      <tr key={e.id}>
                        <td>
                          {new Date(e.date).toLocaleDateString("en-GB")}
                        </td>
                        <td style={{ fontWeight: 600 }}>{e.amountMm} mm</td>
                        <td>
                          <span
                            style={{
                              color: getMethodColor(e.method),
                              fontWeight: 500,
                              fontSize: "0.85rem",
                            }}
                          >
                            {e.method.charAt(0).toUpperCase() +
                              e.method.slice(1)}
                          </span>
                        </td>
                        <td className="text-muted">{e.source ?? "—"}</td>
                        <td className="text-muted">
                          {e.durationHours ? `${e.durationHours}h` : "—"}
                        </td>
                        <td className="text-muted" style={{ maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis" }}>
                          {e.notes ?? "—"}
                        </td>
                        <td>
                          <button
                            onClick={async () => {
                              try {
                                await deleteData("irrigationEvents", e.id);
                                notifications.show({ title: "Deleted", message: "Irrigation event removed", color: "green" });
                                await reload();
                              } catch (e) {
                                notifications.show({ title: "Error", message: e instanceof Error ? e.message : "Failed to delete", color: "red" });
                              }
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
                            title="Delete event"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  {fieldIrrigation.length === 0 && (
                    <tr>
                      <td
                        colSpan={7}
                        className="text-muted"
                        style={{
                          textAlign: "center",
                          padding: "40px 20px",
                          fontSize: "0.85rem",
                        }}
                      >
                        No irrigation events recorded. Add an event to start tracking irrigation efficiency.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {showAddZone && (
        <Modal
          title="Add Soil Zone"
          onClose={() => {
            setShowAddZone(false);
            setZoneForm({});
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <FormField
              as="select"
              label={<span className="inline-flex items-center gap-1.5">Field <HelpHint label="Add soil zones to the field you want to monitor. Zones split a field into meaningful depth or soil-type areas." /></span>}
              name="fieldId"
              helperText={
                activeFields.length > 0
                  ? "Choose the field this soil zone belongs to."
                  : "No active fields available yet. Create one in Crops & Fields before adding soil zones."
              }
              disabled={activeFields.length === 0}
              value={zoneForm.fieldId ?? ""}
              onChange={(e) =>
                setZoneForm((f) => ({ ...f, fieldId: e.target.value }))
              }
            >
              <option value="">Select field...</option>
              {activeFields.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </FormField>
            <FormField
              label="Zone Name"
              name="name"
              type="text"
              placeholder="e.g. North End, Deep Layer"
              value={String(zoneForm.name ?? "")}
              onChange={(e) =>
                setZoneForm((f) => ({ ...f, name: e.target.value }))
              }
            />
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 12,
              }}
            >
              <FormField
                label="Depth From (cm)"
                name="depthFrom"
                type="number"
                value={String(zoneForm.depthFrom ?? 0)}
                onChange={(e) =>
                  setZoneForm((f) => ({ ...f, depthFrom: +e.target.value }))
                }
              />
              <FormField
                label="Depth To (cm)"
                name="depthTo"
                type="number"
                value={String(zoneForm.depthTo ?? 30)}
                onChange={(e) =>
                  setZoneForm((f) => ({ ...f, depthTo: +e.target.value }))
                }
              />
            </div>
            <FormField
              label="Soil Type (optional)"
              name="soilType"
              type="text"
              placeholder="e.g. Clay Loam, Sandy"
              value={String(zoneForm.soilType ?? "")}
              onChange={(e) =>
                setZoneForm((f) => ({ ...f, soilType: e.target.value }))
              }
            />
            <Group grow mt={4}>
              <Button
                onClick={async () => {
                  try {
                    if (!zoneForm.fieldId || !zoneForm.name?.trim()) {
                      notifications.show({ title: "Validation", message: "Field and name are required", color: "orange" });
                      return;
                    }
                    await saveData("soilZones", {
                      id: generateId(),
                      fieldId: zoneForm.fieldId,
                      name: zoneForm.name.trim(),
                      depthFrom: zoneForm.depthFrom ?? 0,
                      depthTo: zoneForm.depthTo ?? 30,
                      soilType: zoneForm.soilType || undefined,
                      notes: zoneForm.notes,
                    } as SoilZone);
                    notifications.show({ title: "Success", message: "Soil zone created", color: "green" });
                    await reload();
                    setShowAddZone(false);
                    setZoneForm({});
                  } catch (e) {
                    notifications.show({ title: "Error", message: e instanceof Error ? e.message : "Failed to save zone", color: "red" });
                  }
                }}
              >
                Save Zone
              </Button>
              <Button
                variant="default"
                onClick={() => {
                  setShowAddZone(false);
                  setZoneForm({});
                }}
              >
                Cancel
              </Button>
            </Group>
          </div>
        </Modal>
      )}

      {showAddReading && (
        <Modal
          title="Add Water Table Reading"
          onClose={() => {
            setShowAddReading(false);
            setReadingForm({});
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <FormField
              as="select"
              label="Field (optional)"
              name="fieldId"
              value={readingForm.fieldId ?? ""}
              onChange={(e) =>
                setReadingForm((f) => ({ ...f, fieldId: e.target.value }))
              }
            >
              <option value="">Farm-wide</option>
              {activeFields.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </FormField>
            <FormField
              label="Date"
              name="timestamp"
              type="date"
              value={String(readingForm.timestamp ?? new Date().toISOString().slice(0, 10))}
              onChange={(e) =>
                setReadingForm((f) => ({ ...f, timestamp: e.target.value }))
              }
            />
            <FormField
              label="Depth to Water (cm)"
              name="depthToWater"
              type="number"
              value={String(readingForm.depthToWater ?? "")}
              onChange={(e) =>
                setReadingForm((f) => ({ ...f, depthToWater: +e.target.value }))
              }
            />
            <FormField
              label="Well Name (optional)"
              name="wellName"
              type="text"
              placeholder="e.g. Well #1"
              value={String(readingForm.wellName ?? "")}
              onChange={(e) =>
                setReadingForm((f) => ({ ...f, wellName: e.target.value }))
              }
            />
            <Group grow mt={4}>
              <Button
                onClick={async () => {
                  try {
                    if (readingForm.depthToWater === undefined) {
                      notifications.show({ title: "Validation", message: "Depth to water is required", color: "orange" });
                      return;
                    }
                    await saveData("waterTableReadings", {
                      id: generateId(),
                      fieldId: readingForm.fieldId || undefined,
                      timestamp: readingForm.timestamp || new Date().toISOString().slice(0, 10),
                      depthToWater: readingForm.depthToWater,
                      wellName: readingForm.wellName || undefined,
                    } as WaterTableReading);
                    notifications.show({ title: "Success", message: "Water table reading saved", color: "green" });
                    await reload();
                    setShowAddReading(false);
                    setReadingForm({});
                  } catch (e) {
                    notifications.show({ title: "Error", message: e instanceof Error ? e.message : "Failed to save reading", color: "red" });
                  }
                }}
              >
                Save Reading
              </Button>
              <Button
                variant="default"
                onClick={() => {
                  setShowAddReading(false);
                  setReadingForm({});
                }}
              >
                Cancel
              </Button>
            </Group>
          </div>
        </Modal>
      )}

      {showAddIrrigation && (
        <Modal
          title="Add Irrigation Event"
          onClose={() => {
            setShowAddIrrigation(false);
            setIrrigationForm({});
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <FormField
              as="select"
              label={<span className="inline-flex items-center gap-1.5">Field <HelpHint label="Record irrigation against the specific field that received water so budgets and efficiency stay accurate." /></span>}
              name="fieldId"
              helperText={
                activeFields.length > 0
                  ? "Choose the irrigated field."
                  : "No active fields available yet. Create one in Crops & Fields before logging irrigation."
              }
              disabled={activeFields.length === 0}
              value={irrigationForm.fieldId ?? ""}
              onChange={(e) =>
                setIrrigationForm((f) => ({ ...f, fieldId: e.target.value }))
              }
            >
              <option value="">Select field...</option>
              {activeFields.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </FormField>
            <FormField
              label="Date"
              name="date"
              type="date"
              value={String(irrigationForm.date ?? new Date().toISOString().slice(0, 10))}
              onChange={(e) =>
                setIrrigationForm((f) => ({ ...f, date: e.target.value }))
              }
            />
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 12,
              }}
            >
              <FormField
                label="Amount (mm)"
                name="amountMm"
                type="number"
                value={String(irrigationForm.amountMm ?? "")}
                onChange={(e) =>
                  setIrrigationForm((f) => ({ ...f, amountMm: +e.target.value }))
                }
              />
              <FormField
                as="select"
                label="Method"
                name="method"
                value={irrigationForm.method ?? "sprinkler"}
                onChange={(e) =>
                  setIrrigationForm((f) => ({ ...f, method: e.target.value as IrrigationEvent["method"] }))
                }
              >
                <option value="drip">Drip</option>
                <option value="sprinkler">Sprinkler</option>
                <option value="flood">Flood</option>
                <option value="pivot">Pivot</option>
                <option value="other">Other</option>
              </FormField>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 12,
              }}
            >
              <FormField
                label="Source (optional)"
                name="source"
                type="text"
                placeholder="e.g. Borehole, River"
                value={String(irrigationForm.source ?? "")}
                onChange={(e) =>
                  setIrrigationForm((f) => ({ ...f, source: e.target.value }))
                }
              />
              <FormField
                label="Duration (hours)"
                name="durationHours"
                type="number"
                value={String(irrigationForm.durationHours ?? "")}
                onChange={(e) =>
                  setIrrigationForm((f) => ({
                    ...f,
                    durationHours: +e.target.value,
                  }))
                }
              />
            </div>
            <Group grow mt={4}>
              <Button
                onClick={async () => {
                  try {
                    if (!irrigationForm.fieldId || irrigationForm.amountMm === undefined) {
                      notifications.show({ title: "Validation", message: "Field and amount are required", color: "orange" });
                      return;
                    }
                    await saveData("irrigationEvents", {
                      id: generateId(),
                      fieldId: irrigationForm.fieldId,
                      date: irrigationForm.date || new Date().toISOString().slice(0, 10),
                      amountMm: irrigationForm.amountMm,
                      method: irrigationForm.method || "sprinkler",
                      source: irrigationForm.source || undefined,
                      durationHours: irrigationForm.durationHours || undefined,
                      notes: irrigationForm.notes,
                    } as IrrigationEvent);
                    notifications.show({ title: "Success", message: "Irrigation event saved", color: "green" });
                    await reload();
                    setShowAddIrrigation(false);
                    setIrrigationForm({});
                  } catch (e) {
                    notifications.show({ title: "Error", message: e instanceof Error ? e.message : "Failed to save event", color: "red" });
                  }
                }}
              >
                Save Event
              </Button>
              <Button
                variant="default"
                onClick={() => {
                  setShowAddIrrigation(false);
                  setIrrigationForm({});
                }}
              >
                Cancel
              </Button>
            </Group>
          </div>
        </Modal>
      )}
    </div>
  );
}
