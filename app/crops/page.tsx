"use client";

import { FileText, Map, Plus, Trash2, TrendingUp, Wheat } from "lucide-react";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import Modal from "../components/Modal";
import StatCard from "../components/StatCard";
import {
  deleteData,
  generateId,
  getData,
  saveData,
  type CropField,
  type InputLog,
  type YieldRecord,
} from "../lib/store";

// Leaflet must be loaded client-side only
const FieldMap = dynamic(() => import("../components/FieldMap"), {
  ssr: false,
  loading: () => (
    <div
      style={{
        height: 360,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--bg-base)",
        borderRadius: 10,
        color: "var(--text-muted)",
        fontSize: "0.875rem",
      }}
    >
      Loading map…
    </div>
  ),
});

type Tab = "map" | "inputs" | "yields";

const STATUS_COLORS: Record<string, string> = {
  growing: "#4ade80",
  planted: "#60a5fa",
  harvested: "#fbbf24",
  fallow: "#64748b",
};

export default function CropsPage() {
  const [tab, setTab] = useState<Tab>("map");
  const [fields, setFields] = useState<CropField[]>([]);
  const [inputs, setInputs] = useState<InputLog[]>([]);
  const [yields, setYields] = useState<YieldRecord[]>([]);
  const [mounted, setMounted] = useState(false);
  const [showAddField, setShowAddField] = useState(false);
  const [showAddInput, setShowAddInput] = useState(false);
  const [showAddYield, setShowAddYield] = useState(false);
  const [fieldForm, setFieldForm] = useState<Partial<CropField>>({});
  const [inputForm, setInputForm] = useState<Partial<InputLog>>({});
  const [yieldForm, setYieldForm] = useState<Partial<YieldRecord>>({});

  const load = useCallback(() => {
    setFields(getData<CropField>("fields"));
    setInputs(getData<InputLog>("inputLogs"));
    setYields(getData<YieldRecord>("yieldRecords"));
  }, []);

  useEffect(() => {
    load();
    setMounted(true);
  }, [load]);

  const saveField = () => {
    if (!fieldForm.name) return;
    saveData("fields", {
      id: fieldForm.id || generateId(),
      lat: 53.94,
      lng: -1.07,
      rotation: [],
      ...fieldForm,
    } as CropField);
    load();
    setShowAddField(false);
    setFieldForm({});
  };

  const saveInput = () => {
    if (!inputForm.product) return;
    saveData("inputLogs", {
      id: generateId(),
      date: new Date().toISOString().slice(0, 10),
      ...inputForm,
    } as InputLog);
    load();
    setShowAddInput(false);
    setInputForm({});
  };

  const saveYield = () => {
    if (!yieldForm.fieldName) return;
    saveData("yieldRecords", {
      id: generateId(),
      year: new Date().getFullYear(),
      ...yieldForm,
    } as YieldRecord);
    load();
    setShowAddYield(false);
    setYieldForm({});
  };

  const yieldChartData = yields.map((y) => ({
    name: `${y.fieldName.split(" ")[0]} ${y.year}`,
    projected: y.projected,
    actual: y.actual,
    variance: +(((y.actual - y.projected) / y.projected) * 100).toFixed(1),
  }));

  const totalAcres = fields.reduce((s, f) => s + f.acres, 0);

  if (!mounted) return null;

  return (
    <div style={{ padding: "32px 32px 48px" }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1
          style={{
            fontSize: "1.6rem",
            fontWeight: 800,
            color: "var(--text-primary)",
            letterSpacing: "-0.02em",
          }}
        >
          🌾 Arable & Crop Management
        </h1>
        <p
          style={{
            color: "var(--text-muted)",
            fontSize: "0.875rem",
            marginTop: 4,
          }}
        >
          Field mapping, input logs, and yield tracking across {totalAcres}{" "}
          acres
        </p>
      </div>

      {/* Stats */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 14,
          marginBottom: 24,
        }}
      >
        <StatCard
          label="Total Fields"
          value={fields.length}
          sub={`${totalAcres} acres managed`}
          icon={Map}
          color="#4ade80"
          delay={0}
        />
        <StatCard
          label="Active Crops"
          value={
            fields.filter(
              (f) => f.status === "growing" || f.status === "planted",
            ).length
          }
          icon={Wheat}
          color="#60a5fa"
          delay={60}
        />
        <StatCard
          label="Input Records"
          value={inputs.length}
          sub="seeds · sprays · fertiliser"
          icon={FileText}
          color="#fbbf24"
          delay={120}
        />
        <StatCard
          label="Yield Records"
          value={yields.length}
          sub="harvests logged"
          icon={TrendingUp}
          color="#a78bfa"
          delay={180}
        />
      </div>

      {/* Tab bar */}
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
            ["map", "🗺️ Field Map"],
            ["inputs", "📋 Input Logs"],
            ["yields", "📊 Yield Tracking"],
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

      {/* Field Map Tab */}
      {tab === "map" && (
        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 20 }}
        >
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
                Field Boundaries — Yorkshire, UK
              </span>
              <button
                className="btn-primary"
                onClick={() => setShowAddField(true)}
              >
                <Plus size={14} /> Add Field
              </button>
            </div>
            <FieldMap fields={fields} />
          </div>

          <div
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              padding: "18px",
              overflow: "hidden",
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
              Field Registry
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {fields.map((field) => (
                <div
                  key={field.id}
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
                      {field.name}
                    </span>
                    <span
                      style={{
                        fontSize: "0.7rem",
                        fontWeight: 600,
                        padding: "2px 8px",
                        borderRadius: 6,
                        background: `${STATUS_COLORS[field.status]}18`,
                        color: STATUS_COLORS[field.status],
                        border: `1px solid ${STATUS_COLORS[field.status]}40`,
                      }}
                    >
                      {field.status}
                    </span>
                  </div>
                  <div
                    style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}
                  >
                    {field.currentCrop} · {field.acres} acres
                  </div>
                  <div
                    style={{
                      fontSize: "0.75rem",
                      color: "var(--text-muted)",
                      marginTop: 3,
                    }}
                  >
                    Sown: {field.sowDate}
                  </div>
                  <div style={{ marginTop: 8 }}>
                    <div
                      style={{
                        fontSize: "0.68rem",
                        textTransform: "uppercase",
                        letterSpacing: "0.08em",
                        color: "var(--text-muted)",
                        marginBottom: 4,
                      }}
                    >
                      Rotation History
                    </div>
                    <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                      {field.rotation.slice(-3).map((r) => (
                        <span
                          key={r.year}
                          style={{
                            fontSize: "0.68rem",
                            background: "var(--bg-base)",
                            padding: "2px 6px",
                            borderRadius: 4,
                            color: "var(--text-secondary)",
                            border: "1px solid var(--border)",
                          }}
                        >
                          {r.year}: {r.crop}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "flex-end",
                      marginTop: 8,
                    }}
                  >
                    <button
                      onClick={() => {
                        deleteData("fields", field.id);
                        load();
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
                      title="Delete field"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Input Logs Tab */}
      {tab === "inputs" && (
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
              Chemical & Input Records
            </span>
            <button
              className="btn-primary"
              onClick={() => setShowAddInput(true)}
            >
              <Plus size={14} /> Log Application
            </button>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table className="farm-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Field</th>
                  <th>Type</th>
                  <th>Product</th>
                  <th>Quantity</th>
                  <th>Operator</th>
                  <th>Notes</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {inputs.map((log) => (
                  <tr key={log.id}>
                    <td>{new Date(log.date).toLocaleDateString("en-GB")}</td>
                    <td
                      style={{ color: "var(--text-primary)", fontWeight: 500 }}
                    >
                      {log.fieldName}
                    </td>
                    <td>
                      <span
                        className={
                          log.type === "spray"
                            ? "badge-red"
                            : log.type === "fertiliser"
                              ? "badge-amber"
                              : "badge-green"
                        }
                      >
                        {log.type}
                      </span>
                    </td>
                    <td style={{ color: "var(--text-primary)" }}>
                      {log.product}
                    </td>
                    <td>
                      {log.quantity} {log.unit}
                    </td>
                    <td>{log.operator}</td>
                    <td
                      style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}
                    >
                      {log.notes || "—"}
                    </td>
                    <td>
                      <button
                        onClick={() => {
                          deleteData("inputLogs", log.id);
                          load();
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
                        title="Delete record"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Yield Tracking Tab */}
      {tab === "yields" && (
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
                Yield: Actual vs Projected (t/ha)
              </div>
              <button
                className="btn-primary"
                onClick={() => setShowAddYield(true)}
              >
                <Plus size={14} /> Add Record
              </button>
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={yieldChartData} barGap={4}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(255,255,255,0.05)"
                  vertical={false}
                />
                <XAxis
                  dataKey="name"
                  tick={{ fill: "#64748b", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "#64748b", fontSize: 11 }}
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
                <Legend
                  wrapperStyle={{ fontSize: "0.75rem", color: "#94a3b8" }}
                />
                <Bar
                  dataKey="projected"
                  name="Projected"
                  fill="#334155"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="actual"
                  name="Actual"
                  fill="#4ade80"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
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
                  <th>Field</th>
                  <th>Crop</th>
                  <th>Year</th>
                  <th>Projected</th>
                  <th>Actual</th>
                  <th>Variance</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {yields.map((y) => {
                  const variance = (
                    ((y.actual - y.projected) / y.projected) *
                    100
                  ).toFixed(1);
                  const isPositive = y.actual >= y.projected;
                  return (
                    <tr key={y.id}>
                      <td
                        style={{
                          fontWeight: 500,
                          color: "var(--text-primary)",
                        }}
                      >
                        {y.fieldName}
                      </td>
                      <td>{y.crop}</td>
                      <td>{y.year}</td>
                      <td>
                        {y.projected} {y.unit}
                      </td>
                      <td
                        style={{
                          color: "var(--text-primary)",
                          fontWeight: 600,
                        }}
                      >
                        {y.actual} {y.unit}
                      </td>
                      <td>
                        <span
                          style={{
                            color: isPositive ? "#4ade80" : "#f87171",
                            fontWeight: 600,
                          }}
                        >
                          {isPositive ? "+" : ""}
                          {variance}%
                        </span>
                      </td>
                      <td>
                        <button
                          onClick={() => {
                            deleteData("yieldRecords", y.id);
                            load();
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
                          title="Delete record"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Field Modal */}
      {showAddField && (
        <Modal title="Add New Field" onClose={() => setShowAddField(false)}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {[
              ["Field Name", "name", "text", "e.g. North Meadow"],
              ["Acres", "acres", "number", "42"],
              ["Current Crop", "currentCrop", "text", "Winter Wheat"],
              ["Sow Date", "sowDate", "date", ""],
            ].map(([label, key, type, placeholder]) => (
              <div key={key}>
                <label
                  style={{
                    fontSize: "0.8rem",
                    color: "var(--text-muted)",
                    display: "block",
                    marginBottom: 6,
                  }}
                >
                  {label}
                </label>
                <input
                  className="farm-input"
                  type={type}
                  placeholder={placeholder}
                  value={(fieldForm as any)[key] ?? ""}
                  onChange={(e) =>
                    setFieldForm((f) => ({
                      ...f,
                      [key]:
                        type === "number" ? +e.target.value : e.target.value,
                    }))
                  }
                />
              </div>
            ))}
            <div>
              <label
                style={{
                  fontSize: "0.8rem",
                  color: "var(--text-muted)",
                  display: "block",
                  marginBottom: 6,
                }}
              >
                Status
              </label>
              <select
                className="farm-input"
                value={fieldForm.status ?? "planted"}
                onChange={(e) =>
                  setFieldForm((f) => ({
                    ...f,
                    status: e.target.value as CropField["status"],
                  }))
                }
              >
                {["planted", "growing", "harvested", "fallow"].map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
              <button
                className="btn-primary"
                style={{ flex: 1 }}
                onClick={saveField}
              >
                Save Field
              </button>
              <button
                className="btn-ghost"
                onClick={() => setShowAddField(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Add Input Modal */}
      {showAddInput && (
        <Modal
          title="Log Input Application"
          onClose={() => setShowAddInput(false)}
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
                Date
              </label>
              <input
                className="farm-input"
                type="date"
                value={inputForm.date ?? new Date().toISOString().slice(0, 10)}
                onChange={(e) =>
                  setInputForm((f) => ({ ...f, date: e.target.value }))
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
                value={inputForm.fieldId ?? ""}
                onChange={(e) => {
                  const f = fields.find((f) => f.id === e.target.value);
                  setInputForm((prev) => ({
                    ...prev,
                    fieldId: e.target.value,
                    fieldName: f?.name ?? "",
                  }));
                }}
              >
                <option value="">Select field…</option>
                {fields.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
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
                Type
              </label>
              <select
                className="farm-input"
                value={inputForm.type ?? "seed"}
                onChange={(e) =>
                  setInputForm((f) => ({
                    ...f,
                    type: e.target.value as InputLog["type"],
                  }))
                }
              >
                {["seed", "fertiliser", "spray", "other"].map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            {[
              ["Product", "product", "text", "e.g. KWS Zyatt Winter Wheat"],
              ["Quantity", "quantity", "text", "180"],
              ["Unit", "unit", "text", "kg/ha"],
              ["Operator", "operator", "text", "Tom Greene"],
              ["Notes", "notes", "text", "Optional"],
            ].map(([label, key, type, placeholder]) => (
              <div key={key}>
                <label
                  style={{
                    fontSize: "0.8rem",
                    color: "var(--text-muted)",
                    display: "block",
                    marginBottom: 6,
                  }}
                >
                  {label}
                </label>
                <input
                  className="farm-input"
                  type={type}
                  placeholder={placeholder}
                  value={(inputForm as any)[key] ?? ""}
                  onChange={(e) =>
                    setInputForm((f) => ({ ...f, [key]: e.target.value }))
                  }
                />
              </div>
            ))}
            <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
              <button
                className="btn-primary"
                style={{ flex: 1 }}
                onClick={saveInput}
              >
                Save Log
              </button>
              <button
                className="btn-ghost"
                onClick={() => setShowAddInput(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Add Yield Modal */}
      {showAddYield && (
        <Modal title="Add Yield Record" onClose={() => setShowAddYield(false)}>
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
                Field
              </label>
              <select
                className="farm-input"
                value={yieldForm.fieldId ?? ""}
                onChange={(e) => {
                  const f = fields.find((f) => f.id === e.target.value);
                  setYieldForm((prev) => ({
                    ...prev,
                    fieldId: e.target.value,
                    fieldName: f?.name ?? "",
                  }));
                }}
              >
                <option value="">Select field…</option>
                {fields.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>
            {[
              ["Crop", "crop", "text", "Winter Wheat"],
              ["Year", "year", "number", "2025"],
              ["Projected (t/ha)", "projected", "number", "8.5"],
              ["Actual (t/ha)", "actual", "number", "9.2"],
              ["Unit", "unit", "text", "t/ha"],
            ].map(([label, key, type, placeholder]) => (
              <div key={key}>
                <label
                  style={{
                    fontSize: "0.8rem",
                    color: "var(--text-muted)",
                    display: "block",
                    marginBottom: 6,
                  }}
                >
                  {label}
                </label>
                <input
                  className="farm-input"
                  type={type}
                  placeholder={placeholder}
                  value={(yieldForm as any)[key] ?? ""}
                  onChange={(e) =>
                    setYieldForm((f) => ({
                      ...f,
                      [key]:
                        type === "number" ? +e.target.value : e.target.value,
                    }))
                  }
                />
              </div>
            ))}
            <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
              <button
                className="btn-primary"
                style={{ flex: 1 }}
                onClick={saveYield}
              >
                Save Record
              </button>
              <button
                className="btn-ghost"
                onClick={() => setShowAddYield(false)}
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
