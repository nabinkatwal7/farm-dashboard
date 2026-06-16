"use client";

import FormField from "@/app/abstract/ui/FormField";
import ImageUpload from "@/app/components/ImageUpload";
import Modal from "@/app/abstract/ui/Modal";
import StatCard from "@/app/abstract/ui/StatCard";
import TableSkeleton from "@/app/abstract/ui/TableSkeleton";
import { useFarmData } from "@/app/base/hooks/useFarmData";
import {
  deleteData,
  generateId,
  saveData,
  type CropField,
  type DroneFlight,
  type OrthomosaicMap,
  type ScoutingObservation,
} from "@/app/base/services/farm-client";
import { useCurrentUser } from "@/app/lib/user-context";
import { Button, Group } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { validate, hasErrors, type Errors, type Rule } from "@/app/lib/validate";
import {
  BarChart3,
  Eye,
  Map,
  Plus,
  Satellite,
  Scan,
  Trash2,
  TriangleAlert,
} from "lucide-react";
import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const DRONE_ENTITIES = {
  fields: "fields",
  droneFlights: "droneFlights",
  orthomosaicMaps: "orthomosaicMaps",
  scoutingObservations: "scoutingObservations",
} as const;

type Tab = "flights" | "maps" | "observations";

const OBSERVATION_LABELS: Record<string, string> = {
  weed_pressure: "Weed Pressure",
  nitrogen_deficiency: "Nitrogen Deficiency",
  pest: "Pest",
  disease: "Disease",
  water_stress: "Water Stress",
  other: "Other",
};

const OBSERVATION_COLORS: Record<string, string> = {
  weed_pressure: "#4ade80",
  nitrogen_deficiency: "#fbbf24",
  pest: "#f87171",
  disease: "#a78bfa",
  water_stress: "#60a5fa",
  other: "#64748b",
};

const SEVERITY_COLORS: Record<string, string> = {
  low: "#4ade80",
  medium: "#fbbf24",
  high: "#f87171",
};

const MAP_TYPE_COLORS: Record<string, string> = {
  ndvi: "#4ade80",
  truecolor: "#60a5fa",
  thermal: "#f87171",
  multispectral: "#a78bfa",
  other: "#64748b",
};

export default function DroneScoutingPage() {
  const [tab, setTab] = useState<Tab>("flights");
  const currentUser = useCurrentUser();
  const { data, reload, loading } = useFarmData(DRONE_ENTITIES);
  const fields = data.fields as CropField[];
  const flights = data.droneFlights as DroneFlight[];
  const maps = data.orthomosaicMaps as OrthomosaicMap[];
  const observations = data.scoutingObservations as ScoutingObservation[];

  const [showAddFlight, setShowAddFlight] = useState(false);
  const [showAddMap, setShowAddMap] = useState(false);
  const [showAddObservation, setShowAddObservation] = useState(false);
  const [flightForm, setFlightForm] = useState<Partial<DroneFlight>>({});
  const [mapForm, setMapForm] = useState<Partial<OrthomosaicMap>>({ fileType: "ndvi" });
  const [observationForm, setObservationForm] = useState<Partial<ScoutingObservation>>({});
  const [observationErrors, setObservationErrors] = useState<Errors>({});

  const OBSERVATION_RULES: Rule[] = [
    { key: "observationType", label: "Observation type", required: true },
  ];

  const activeFields = fields.filter((f) => f.status !== "fallow");

  const obsByType = observations.reduce(
    (acc, o) => {
      acc[o.observationType] = (acc[o.observationType] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  const obsPieData = Object.entries(obsByType).map(([type, count]) => ({
    name: OBSERVATION_LABELS[type] ?? type,
    value: count,
    color: OBSERVATION_COLORS[type] ?? "#64748b",
  }));

  const obsBySeverity = observations.reduce(
    (acc, o) => {
      acc[o.severity] = (acc[o.severity] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  const severityData = Object.entries(obsBySeverity).map(([sev, count]) => ({
    severity: sev.charAt(0).toUpperCase() + sev.slice(1),
    count,
    color: SEVERITY_COLORS[sev] ?? "#64748b",
  }));

  const mapsByType = maps.reduce(
    (acc, m) => {
      acc[m.fileType] = (acc[m.fileType] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  const totalAcresFlown = flights.reduce((s, f) => s + (f.coverageAcres ?? 0), 0);
  const highSeverityObs = observations.filter((o) => o.severity === "high").length;

  if (loading) return <TableSkeleton />;

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 28 }}>
        <h1
          className="text-primary"
          style={{ fontSize: "1.6rem", fontWeight: 800, letterSpacing: "-0.02em" }}
        >
          Drone Scouting & Orthomosaic Map Ingestion
        </h1>
        <p className="text-muted" style={{ fontSize: "0.875rem", marginTop: 4 }}>
          Multi-spectral drone imagery pipeline —{/* */} tag weed pressure, nitrogen deficiencies, and track field health across {flights.length} flights
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
          label="Drone Flights"
          value={flights.length}
          sub={`${totalAcresFlown.toFixed(0)} acres covered`}
          icon={Satellite}
          color="#60a5fa"
          delay={0}
        />
        <StatCard
          label="Orthomosaic Maps"
          value={maps.length}
          sub={`${Object.keys(mapsByType).length} map types`}
          icon={Map}
          color="#4ade80"
          delay={60}
        />
        <StatCard
          label="Observations"
          value={observations.length}
          sub={`${Object.keys(obsByType).length} issue types`}
          icon={Scan}
          color="#a78bfa"
          delay={120}
        />
        <StatCard
          label="High Severity"
          value={highSeverityObs}
          sub="requires attention"
          icon={TriangleAlert}
          color={highSeverityObs > 0 ? "#f87171" : "#4ade80"}
          delay={180}
        />
      </div>

      <div
        className="bg-card border border-border"
        style={{
          display: "flex",
          gap: 4,
          marginBottom: 20,
          padding: 4,
          borderRadius: 10,
          width: "fit-content",
        }}
      >
        {(
          [
            ["flights", "Flights"],
            ["maps", "Orthomosaic Maps"],
            ["observations", "Observations"],
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

      {tab === "flights" && (
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
                Scouting Flights
              </span>
              <button
                className="btn-primary"
                onClick={() => setShowAddFlight(true)}
              >
                <Plus size={14} /> Add Flight
              </button>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table className="farm-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Field</th>
                    <th>Drone Type</th>
                    <th>Altitude</th>
                    <th>Resolution</th>
                    <th>Coverage</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {[...flights]
                    .sort(
                      (a, b) =>
                        new Date(b.flightDate).getTime() -
                        new Date(a.flightDate).getTime(),
                    )
                    .map((f) => {
                      const field = fields.find((ff) => ff.id === f.fieldId);
                      return (
                        <tr key={f.id}>
                          <td>
                            {new Date(f.flightDate).toLocaleDateString("en-GB")}
                          </td>
                          <td className="text-primary" style={{ fontWeight: 500 }}>
                            {field?.name ?? f.fieldId ?? "Farm-wide"}
                          </td>
                          <td className="text-muted">{f.droneType ?? "—"}</td>
                          <td className="text-muted">
                            {f.altitude ? `${f.altitude}m` : "—"}
                          </td>
                          <td className="text-muted">
                            {f.groundResolution
                              ? `${f.groundResolution} cm/px`
                              : "—"}
                          </td>
                          <td>
                            {f.coverageAcres
                              ? `${f.coverageAcres.toFixed(1)} ac`
                              : "—"}
                          </td>
                          <td>
                            <span
                              className={
                                f.status === "completed"
                                  ? "badge-green"
                                  : f.status === "in-progress"
                                    ? "badge-yellow"
                                    : f.status === "planned"
                                      ? "badge-blue"
                                      : "badge-red"
                              }
                            >
                              {f.status}
                            </span>
                          </td>
                          <td>
                            <button
                              onClick={async () => {
                                try {
                                  await deleteData("droneFlights", f.id);
                                  notifications.show({ title: "Deleted", message: "Flight removed", color: "green" });
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
                              title="Delete flight"
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  {flights.length === 0 && (
                    <tr>
                      <td colSpan={8} className="text-muted" style={{ textAlign: "center", padding: "40px 20px", fontSize: "0.85rem" }}>
                        No flights recorded. Add a drone flight to start scouting.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === "maps" && (
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
                Orthomosaic Maps
              </span>
              <button
                className="btn-primary"
                onClick={() => setShowAddMap(true)}
              >
                <Plus size={14} /> Add Map
              </button>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table className="farm-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Type</th>
                    <th>Field</th>
                    <th>Resolution</th>
                    <th>Coverage</th>
                    <th>Size</th>
                    <th>Flight Date</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {[...maps]
                    .sort(
                      (a, b) =>
                        new Date(b.createdAt ?? 0).getTime() -
                        new Date(a.createdAt ?? 0).getTime(),
                    )
                    .map((m) => {
                      const field = fields.find((ff) => ff.id === m.fieldId);
                      const flight = flights.find((ff) => ff.id === m.flightId);
                      return (
                        <tr key={m.id}>
                          <td className="text-primary" style={{ fontWeight: 500 }}>
                            {m.name}
                          </td>
                          <td>
                            <span
                              style={{
                                color: MAP_TYPE_COLORS[m.fileType] ?? "#64748b",
                                fontWeight: 500,
                                fontSize: "0.85rem",
                              }}
                            >
                              {m.fileType.toUpperCase()}
                            </span>
                          </td>
                          <td className="text-muted">
                            {field?.name ?? m.fieldId ?? "—"}
                          </td>
                          <td className="text-muted">
                            {m.resolution ? `${m.resolution} cm/px` : "—"}
                          </td>
                          <td className="text-muted">
                            {m.coverageAcres ? `${m.coverageAcres.toFixed(1)} ac` : "—"}
                          </td>
                          <td className="text-muted">
                            {m.fileSize
                              ? m.fileSize > 1000000
                                ? `${(m.fileSize / 1000000).toFixed(1)} MB`
                                : `${(m.fileSize / 1000).toFixed(0)} KB`
                              : "—"}
                          </td>
                          <td className="text-muted">
                            {flight
                              ? new Date(flight.flightDate).toLocaleDateString("en-GB")
                              : "—"}
                          </td>
                          <td>
                            <button
                              onClick={async () => {
                                try {
                                  await deleteData("orthomosaicMaps", m.id);
                                  notifications.show({ title: "Deleted", message: "Map removed", color: "green" });
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
                              title="Delete map"
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  {maps.length === 0 && (
                    <tr>
                      <td colSpan={8} className="text-muted" style={{ textAlign: "center", padding: "40px 20px", fontSize: "0.85rem" }}>
                        No orthomosaic maps indexed. Add a map to start the imagery pipeline.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {maps.length > 0 && (
            <div
              style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}
            >
              <div
                className="bg-card border border-border"
                style={{ borderRadius: 12, padding: 20 }}
              >
                <div style={{ fontWeight: 600, fontSize: "0.9rem", marginBottom: 16 }}>
                  Maps by Type
                </div>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={Object.entries(mapsByType).map(([type, count]) => ({
                        name: type.toUpperCase(),
                        value: count,
                        color: MAP_TYPE_COLORS[type] ?? "#64748b",
                      }))}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={70}
                      innerRadius={40}
                    >
                      {Object.entries(mapsByType).map(([type], idx) => (
                        <Cell
                          key={idx}
                          fill={MAP_TYPE_COLORS[type] ?? "#64748b"}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: "var(--bg-card)",
                        border: "1px solid var(--border)",
                        borderRadius: 8,
                        fontSize: "0.8rem",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div
                  style={{
                    display: "flex",
                    gap: 12,
                    justifyContent: "center",
                    flexWrap: "wrap",
                    marginTop: 8,
                  }}
                >
                  {Object.entries(mapsByType).map(([type, count]) => (
                    <div key={type} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.75rem" }}>
                      <div
                        style={{
                          width: 10,
                          height: 10,
                          borderRadius: 3,
                          background: MAP_TYPE_COLORS[type] ?? "#64748b",
                        }}
                      />
                      <span className="text-muted">{type.toUpperCase()} ({count})</span>
                    </div>
                  ))}
                </div>
              </div>

              <div
                className="bg-card border border-border"
                style={{ borderRadius: 12, padding: 20 }}
              >
                <div style={{ fontWeight: 600, fontSize: "0.9rem", marginBottom: 16 }}>
                  Observations by Type
                </div>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={obsPieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={70}
                      innerRadius={40}
                    >
                      {obsPieData.map((entry, idx) => (
                        <Cell key={idx} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: "var(--bg-card)",
                        border: "1px solid var(--border)",
                        borderRadius: 8,
                        fontSize: "0.8rem",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div
                  style={{
                    display: "flex",
                    gap: 12,
                    justifyContent: "center",
                    flexWrap: "wrap",
                    marginTop: 8,
                  }}
                >
                  {obsPieData.map((entry) => (
                    <div key={entry.name} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.75rem" }}>
                      <div style={{ width: 10, height: 10, borderRadius: 3, background: entry.color }} />
                      <span className="text-muted">{entry.name} ({entry.value})</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === "observations" && (
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
                Observation Severity
              </span>
            </div>
            <div style={{ padding: 20 }}>
              {severityData.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={severityData} barSize={60}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="rgba(255,255,255,0.05)"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="severity"
                      tick={{ fill: "#64748b", fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: "#64748b", fontSize: 10 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "var(--bg-card)",
                        border: "1px solid var(--border)",
                        borderRadius: 8,
                        fontSize: "0.8rem",
                      }}
                    />
                    <Bar dataKey="count" name="Observations" radius={[4, 4, 0, 0]}>
                      {severityData.map((entry, idx) => (
                        <Cell key={idx} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-muted" style={{ textAlign: "center", padding: "30px 20px", fontSize: "0.85rem" }}>
                  No observations recorded yet.
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
                Scouting Observations
              </span>
              <button
                className="btn-primary"
                onClick={() => setShowAddObservation(true)}
              >
                <Plus size={14} /> Add Observation
              </button>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table className="farm-table">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Severity</th>
                    <th>Field</th>
                    <th>Area</th>
                    <th>Coordinates</th>
                    <th>Notes</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {[...observations]
                    .sort(
                      (a, b) =>
                        new Date(b.createdAt ?? 0).getTime() -
                        new Date(a.createdAt ?? 0).getTime(),
                    )
                    .map((o) => {
                      const field = fields.find((ff) => ff.id === o.fieldId);
                      return (
                        <tr key={o.id}>
                          <td>
                            <span
                              style={{
                                color: OBSERVATION_COLORS[o.observationType] ?? "#64748b",
                                fontWeight: 500,
                                fontSize: "0.85rem",
                              }}
                            >
                              {OBSERVATION_LABELS[o.observationType] ?? o.observationType}
                            </span>
                          </td>
                          <td>
                            <span
                              className={
                                o.severity === "high"
                                  ? "badge-red"
                                  : o.severity === "medium"
                                    ? "badge-yellow"
                                    : "badge-green"
                              }
                            >
                              {o.severity}
                            </span>
                          </td>
                          <td className="text-muted">
                            {field?.name ?? o.fieldId ?? "Farm-wide"}
                          </td>
                          <td className="text-muted">
                            {o.areaAcres ? `${o.areaAcres.toFixed(1)} ac` : "—"}
                          </td>
                          <td className="text-muted" style={{ fontSize: "0.8rem" }}>
                            {o.lat && o.lng
                              ? `${o.lat.toFixed(4)}, ${o.lng.toFixed(4)}`
                              : "—"}
                          </td>
                          <td className="text-muted" style={{ maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis" }}>
                            {o.notes ?? "—"}
                          </td>
                          <td>
                            <button
                              onClick={async () => {
                                try {
                                  await deleteData("scoutingObservations", o.id);
                                  notifications.show({ title: "Deleted", message: "Observation removed", color: "green" });
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
                              title="Delete observation"
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  {observations.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-muted" style={{ textAlign: "center", padding: "40px 20px", fontSize: "0.85rem" }}>
                        No observations. Add observations to tag weed pressure, nitrogen deficiency, etc.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {showAddFlight && (
        <Modal title="Add Drone Flight" onClose={() => { setShowAddFlight(false); setFlightForm({}); }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <FormField
                as="select" label="Field" name="fieldId"
                value={flightForm.fieldId ?? ""}
                onChange={(e) => setFlightForm((f) => ({ ...f, fieldId: e.target.value }))}
              >
                <option value="">Farm-wide</option>
                {activeFields.map((f) => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </FormField>
              <FormField
                label="Flight Date" name="flightDate" type="date"
                value={String(flightForm.flightDate ?? new Date().toISOString().slice(0, 10))}
                onChange={(e) => setFlightForm((f) => ({ ...f, flightDate: e.target.value }))}
              />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
              <FormField
                label="Drone Type" name="droneType" type="text" placeholder="e.g. DJI Mavic 3M"
                value={String(flightForm.droneType ?? "")}
                onChange={(e) => setFlightForm((f) => ({ ...f, droneType: e.target.value }))}
              />
              <FormField
                label="Altitude (m)" name="altitude" type="number"
                value={String(flightForm.altitude ?? "")}
                onChange={(e) => setFlightForm((f) => ({ ...f, altitude: +e.target.value }))}
              />
              <FormField
                label="Coverage (acres)" name="coverageAcres" type="number"
                value={String(flightForm.coverageAcres ?? "")}
                onChange={(e) => setFlightForm((f) => ({ ...f, coverageAcres: +e.target.value }))}
              />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <FormField
                label="Ground Resolution (cm/px)" name="groundResolution" type="number" placeholder="e.g. 2.5"
                value={String(flightForm.groundResolution ?? "")}
                onChange={(e) => setFlightForm((f) => ({ ...f, groundResolution: +e.target.value }))}
              />
              <FormField
                as="select" label="Status" name="status"
                value={flightForm.status ?? "completed"}
                onChange={(e) => setFlightForm((f) => ({ ...f, status: e.target.value as DroneFlight["status"] }))}
              >
                <option value="planned">Planned</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="failed">Failed</option>
              </FormField>
            </div>
            <FormField
              as="textarea" label="Notes" name="notes" placeholder="Observations, weather conditions, notes..."
              value={String(flightForm.notes ?? "")}
              onChange={(e) => setFlightForm((f) => ({ ...f, notes: e.target.value }))}
              rows={2}
            />
            <Group grow mt={4}>
              <Button onClick={async () => {
                try {
                  if (!flightForm.flightDate) {
                    notifications.show({ title: "Validation", message: "Flight date is required", color: "orange" });
                    return;
                  }
                  await saveData("droneFlights", {
                    id: generateId(),
                    fieldId: flightForm.fieldId || undefined,
                    flightDate: flightForm.flightDate,
                    droneType: flightForm.droneType?.trim() || undefined,
                    altitude: flightForm.altitude || undefined,
                    groundResolution: flightForm.groundResolution || undefined,
                    coverageAcres: flightForm.coverageAcres || undefined,
                    status: flightForm.status || "completed",
                    notes: flightForm.notes,
                  } as DroneFlight);
                  notifications.show({ title: "Success", message: "Flight added", color: "green" });
                  await reload(); setShowAddFlight(false); setFlightForm({});
                } catch (e) {
                  notifications.show({ title: "Error", message: e instanceof Error ? e.message : "Failed to save", color: "red" });
                }
              }}>Save Flight</Button>
              <Button variant="default" onClick={() => { setShowAddFlight(false); setFlightForm({}); }}>Cancel</Button>
            </Group>
          </div>
        </Modal>
      )}

      {showAddMap && (
        <Modal title="Index Orthomosaic Map" onClose={() => { setShowAddMap(false); setMapForm({}); }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <FormField
              label="Map Name" name="name" type="text" placeholder="e.g. North Field NDVI 2025-06-12"
              value={String(mapForm.name ?? "")}
              onChange={(e) => setMapForm((f) => ({ ...f, name: e.target.value }))}
            />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <FormField
                as="select" label="Type" name="fileType"
                value={mapForm.fileType ?? "ndvi"}
                onChange={(e) => setMapForm((f) => ({ ...f, fileType: e.target.value as OrthomosaicMap["fileType"] }))}
              >
                <option value="ndvi">NDVI</option>
                <option value="truecolor">True Color</option>
                <option value="thermal">Thermal</option>
                <option value="multispectral">Multi-Spectral</option>
                <option value="other">Other</option>
              </FormField>
              <FormField
                as="select" label="Field" name="fieldId"
                value={mapForm.fieldId ?? ""}
                onChange={(e) => setMapForm((f) => ({ ...f, fieldId: e.target.value }))}
              >
                <option value="">Farm-wide</option>
                {activeFields.map((f) => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </FormField>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
              <FormField
                label="Resolution (cm/px)" name="resolution" type="number"
                value={String(mapForm.resolution ?? "")}
                onChange={(e) => setMapForm((f) => ({ ...f, resolution: +e.target.value }))}
              />
              <FormField
                label="Coverage (acres)" name="coverageAcres" type="number"
                value={String(mapForm.coverageAcres ?? "")}
                onChange={(e) => setMapForm((f) => ({ ...f, coverageAcres: +e.target.value }))}
              />
              <FormField
                label="File Size (bytes)" name="fileSize" type="number"
                value={String(mapForm.fileSize ?? "")}
                onChange={(e) => setMapForm((f) => ({ ...f, fileSize: +e.target.value }))}
              />
            </div>
            <FormField
              as="select" label="Source Flight (optional)" name="flightId"
              value={mapForm.flightId ?? ""}
              onChange={(e) => setMapForm((f) => ({ ...f, flightId: e.target.value }))}
            >
              <option value="">None</option>
              {flights.map((f) => (
                <option key={f.id} value={f.id}>
                  {new Date(f.flightDate).toLocaleDateString("en-GB")} — {f.droneType ?? "Unknown"}
                </option>
              ))}
            </FormField>
            <FormField
              as="textarea" label="Notes" name="notes" placeholder="Processing notes, quality observations..."
              value={String(mapForm.notes ?? "")}
              onChange={(e) => setMapForm((f) => ({ ...f, notes: e.target.value }))}
              rows={2}
            />
            <Group grow mt={4}>
              <Button onClick={async () => {
                try {
                  if (!mapForm.name?.trim() || !mapForm.fileType) {
                    notifications.show({ title: "Validation", message: "Name and type are required", color: "orange" });
                    return;
                  }
                  await saveData("orthomosaicMaps", {
                    id: generateId(),
                    name: mapForm.name.trim(),
                    fileType: mapForm.fileType,
                    fieldId: mapForm.fieldId || undefined,
                    flightId: mapForm.flightId || undefined,
                    resolution: mapForm.resolution || undefined,
                    coverageAcres: mapForm.coverageAcres || undefined,
                    fileSize: mapForm.fileSize || undefined,
                    filePath: mapForm.filePath || undefined,
                    notes: mapForm.notes,
                  } as OrthomosaicMap);
                  notifications.show({ title: "Success", message: "Map indexed", color: "green" });
                  await reload(); setShowAddMap(false); setMapForm({});
                } catch (e) {
                  notifications.show({ title: "Error", message: e instanceof Error ? e.message : "Failed to save", color: "red" });
                }
              }}>Index Map</Button>
              <Button variant="default" onClick={() => { setShowAddMap(false); setMapForm({}); }}>Cancel</Button>
            </Group>
          </div>
        </Modal>
      )}

      {showAddObservation && (
        <Modal title="Add Scouting Observation" onClose={() => { setShowAddObservation(false); setObservationForm({}); setObservationErrors({}); }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <FormField
                as="select" label="Type" name="observationType"
                required
                error={observationErrors.observationType}
                value={observationForm.observationType ?? "weed_pressure"}
                onChange={(e) => setObservationForm((f) => ({ ...f, observationType: e.target.value as ScoutingObservation["observationType"] }))}
              >
                <option value="weed_pressure">Weed Pressure</option>
                <option value="nitrogen_deficiency">Nitrogen Deficiency</option>
                <option value="pest">Pest</option>
                <option value="disease">Disease</option>
                <option value="water_stress">Water Stress</option>
                <option value="other">Other</option>
              </FormField>
              <FormField
                as="select" label="Severity" name="severity"
                value={observationForm.severity ?? "medium"}
                onChange={(e) => setObservationForm((f) => ({ ...f, severity: e.target.value as ScoutingObservation["severity"] }))}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </FormField>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <FormField
                as="select" label="Field" name="fieldId"
                value={observationForm.fieldId ?? ""}
                onChange={(e) => setObservationForm((f) => ({ ...f, fieldId: e.target.value }))}
              >
                <option value="">Farm-wide</option>
                {activeFields.map((f) => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </FormField>
              <FormField
                label="Area (acres)" name="areaAcres" type="number"
                value={String(observationForm.areaAcres ?? "")}
                onChange={(e) => setObservationForm((f) => ({ ...f, areaAcres: +e.target.value }))}
              />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <FormField
                label="Latitude" name="lat" type="number"
                value={String(observationForm.lat ?? "")}
                onChange={(e) => setObservationForm((f) => ({ ...f, lat: +e.target.value }))}
              />
              <FormField
                label="Longitude" name="lng" type="number"
                value={String(observationForm.lng ?? "")}
                onChange={(e) => setObservationForm((f) => ({ ...f, lng: +e.target.value }))}
              />
            </div>
            <FormField
              as="select" label="Source Map (optional)" name="mapId"
              value={observationForm.mapId ?? ""}
              onChange={(e) => setObservationForm((f) => ({ ...f, mapId: e.target.value }))}
            >
              <option value="">None</option>
              {maps.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </FormField>
            <FormField
              as="textarea" label="Notes" name="notes" placeholder="Description of what was observed..."
              value={String(observationForm.notes ?? "")}
              onChange={(e) => setObservationForm((f) => ({ ...f, notes: e.target.value }))}
              rows={2}
            />
            <ImageUpload
              currentUrl={observationForm.imageUrl}
              folder="observations"
              onUpload={(url) => setObservationForm((f) => ({ ...f, imageUrl: url }))}
              onRemove={() => setObservationForm((f) => ({ ...f, imageUrl: "" }))}
              label="Observation image"
            />
            <Group grow mt={4}>
              <Button onClick={async () => {
                const errors = validate(observationForm, OBSERVATION_RULES);
                if (hasErrors(errors)) {
                  setObservationErrors(errors);
                  return;
                }
                try {
                  await saveData("scoutingObservations", {
                    id: generateId(),
                    observationType: observationForm.observationType,
                    severity: observationForm.severity || "medium",
                    fieldId: observationForm.fieldId || undefined,
                    mapId: observationForm.mapId || undefined,
                    areaAcres: observationForm.areaAcres || undefined,
                    lat: observationForm.lat || undefined,
                    lng: observationForm.lng || undefined,
                    notes: observationForm.notes,
                    imageUrl: observationForm.imageUrl || undefined,
                  } as ScoutingObservation);
                  notifications.show({ title: "Success", message: "Observation recorded", color: "green" });
                  await reload(); setShowAddObservation(false); setObservationForm({}); setObservationErrors({});
                } catch (e) {
                  notifications.show({ title: "Error", message: e instanceof Error ? e.message : "Failed to save", color: "red" });
                }
              }}>Save Observation</Button>
              <Button variant="default" onClick={() => { setShowAddObservation(false); setObservationForm({}); setObservationErrors({}); }}>Cancel</Button>
            </Group>
          </div>
        </Modal>
      )}
    </div>
  );
}
