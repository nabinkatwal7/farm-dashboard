"use client";

import FormField from "@/app/abstract/ui/FormField";
import Modal from "@/app/abstract/ui/Modal";
import StatCard from "@/app/abstract/ui/StatCard";
import { useFarmData } from "@/app/base/hooks/useFarmData";
import {
  deleteData,
  generateId,
  saveData,
  type CropField,
  type CropModel,
  type FieldBoundaryPoint,
  type InputLog,
  type YieldRecord,
} from "@/app/base/services/farm-client";
import { useCurrentUser } from "@/app/lib/user-context";
import { Alert, Button, Group } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
  FileText,
  Map,
  Pencil,
  Plus,
  Trash2,
  TrendingUp,
  Wheat,
} from "lucide-react";
import dynamic from "next/dynamic";
import { useState } from "react";
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

const CROP_ENTITIES = {
  fields: "fields",
  inputs: "inputLogs",
  yields: "yieldRecords",
  cropModels: "cropModels",
} as const;

// Leaflet must be loaded client-side only
const FieldMap = dynamic(() => import("@/app/components/FieldMap"), {
  ssr: false,
  loading: () => (
    <div
      className="bg-background text-muted"
      style={{
        height: 360,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 10,
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

function boundaryCenter(points: FieldBoundaryPoint[]) {
  return points.reduce(
    (center, point) => ({
      lat: center.lat + point.lat / points.length,
      lng: center.lng + point.lng / points.length,
    }),
    { lat: 0, lng: 0 },
  );
}

function boundaryAcres(points: FieldBoundaryPoint[]) {
  if (points.length < 3) return null;

  const centerLat =
    points.reduce((sum, point) => sum + point.lat, 0) / points.length;
  const metersPerDegreeLat = 111_320;
  const metersPerDegreeLng =
    metersPerDegreeLat * Math.cos((centerLat * Math.PI) / 180);
  const projected = points.map((point) => ({
    x: point.lng * metersPerDegreeLng,
    y: point.lat * metersPerDegreeLat,
  }));

  let areaSquareMeters = 0;
  for (let index = 0; index < projected.length; index += 1) {
    const current = projected[index];
    const next = projected[(index + 1) % projected.length];
    areaSquareMeters += current.x * next.y - next.x * current.y;
  }

  return Math.round((Math.abs(areaSquareMeters) / 2 / 4046.8564224) * 10) / 10;
}

export default function CropsPage() {
  const [tab, setTab] = useState<Tab>("map");
  const currentUser = useCurrentUser();
  const farmCoordinates =
    typeof currentUser?.farm.lat === "number" &&
    typeof currentUser?.farm.lng === "number"
      ? { lat: currentUser.farm.lat, lng: currentUser.farm.lng }
      : null;
  const { data, reload: load } = useFarmData(CROP_ENTITIES);
  const fields = data.fields as CropField[];
  const inputs = data.inputs as InputLog[];
  const yields = data.yields as YieldRecord[];
  const cropModels = data.cropModels as CropModel[];
  const [showAddField, setShowAddField] = useState(false);
  const [editingField, setEditingField] = useState<CropField | null>(null);
  const [showAddInput, setShowAddInput] = useState(false);
  const [editingInput, setEditingInput] = useState<InputLog | null>(null);
  const [showAddYield, setShowAddYield] = useState(false);
  const [editingYield, setEditingYield] = useState<YieldRecord | null>(null);
  const [fieldForm, setFieldForm] = useState<Partial<CropField>>({});
  const [inputForm, setInputForm] = useState<Partial<InputLog>>({});
  const [yieldForm, setYieldForm] = useState<Partial<YieldRecord>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [inputErrors, setInputErrors] = useState<Record<string, string>>({});
  const [yieldErrors, setYieldErrors] = useState<Record<string, string>>({});
  const [fieldSaveError, setFieldSaveError] = useState<string | null>(null);

  const validateField = () => {
    const errors: Record<string, string> = {};
    if (!fieldForm.name?.trim()) errors.name = "Field name is required";
    if (!fieldForm.sowDate) errors.sowDate = "Sow date is required";
    if (!fieldForm.currentCrop?.trim())
      errors.currentCrop = "Current crop is required";
    if (!fieldForm.boundary || fieldForm.boundary.length < 3)
      errors.boundary = "Mark at least 3 boundary points on the map";
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const saveField = async () => {
    setFieldSaveError(null);
    if (!validateField()) return;
    const boundary = fieldForm.boundary ?? [];
    const acres = boundaryAcres(boundary);
    if (!acres || acres <= 0) {
      setFieldErrors((current) => ({
        ...current,
        boundary: "Select a larger valid field boundary",
      }));
      return;
    }
    const center = boundaryCenter(boundary);
    try {
      await saveData("fields", {
        id: editingField?.id || fieldForm.id || generateId(),
        name: fieldForm.name?.trim() ?? "",
        acres,
        currentCrop: fieldForm.currentCrop?.trim() ?? "",
        status: fieldForm.status ?? "planted",
        sowDate: fieldForm.sowDate ?? "",
        harvestDate: fieldForm.harvestDate,
        lat: center.lat,
        lng: center.lng,
        rotation: fieldForm.rotation ?? [],
        boundary,
      } as CropField);
      await load();
      setShowAddField(false);
      setEditingField(null);
      setFieldForm({});
      setFieldErrors({});
    } catch (error) {
      setFieldSaveError(
        error instanceof Error ? error.message : "Unable to save field",
      );
    }
  };

  const validateInput = () => {
    const errors: Record<string, string> = {};
    if (!inputForm.product?.trim()) errors.product = "Product is required";
    if (!inputForm.fieldId) errors.fieldId = "Field is required";
    if (!inputForm.quantity) errors.quantity = "Quantity is required";
    setInputErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const saveInput = async () => {
    if (!validateInput()) return;
    try {
      await saveData("inputLogs", {
        id: editingInput?.id || generateId(),
        date: new Date().toISOString().slice(0, 10),
        ...inputForm,
      } as InputLog);
      await load();
      setShowAddInput(false);
      setEditingInput(null);
      setInputForm({});
      setInputErrors({});
    } catch (error) {
      notifications.show({
        title: "Error",
        message:
          error instanceof Error ? error.message : "Failed to save input log",
        color: "red",
      });
    }
  };

  const validateYield = () => {
    const errors: Record<string, string> = {};
    if (!yieldForm.fieldId) errors.fieldId = "Field is required";
    if (yieldForm.actual === undefined || yieldForm.actual < 0)
      errors.actual = "Valid actual yield is required";
    if (yieldForm.projected === undefined || yieldForm.projected < 0)
      errors.projected = "Valid projected yield is required";
    setYieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const saveYield = async () => {
    if (!validateYield()) return;
    try {
      await saveData("yieldRecords", {
        id: editingYield?.id || generateId(),
        year: new Date().getFullYear(),
        ...yieldForm,
      } as YieldRecord);
      await load();
      setShowAddYield(false);
      setEditingYield(null);
      setYieldForm({});
      setYieldErrors({});
    } catch (error) {
      notifications.show({
        title: "Error",
        message:
          error instanceof Error
            ? error.message
            : "Failed to save yield record",
        color: "red",
      });
    }
  };

  const yieldChartData = yields.map((y) => ({
    name: `${y.fieldName.split(" ")[0]} ${y.year}`,
    projected: y.projected,
    actual: y.actual,
    variance: +(((y.actual - y.projected) / y.projected) * 100).toFixed(1),
  }));

  const totalAcres = fields.reduce((s, f) => s + f.acres, 0);
  const computedFieldAcres = boundaryAcres(fieldForm.boundary ?? []);
  const boundaryPointCount = fieldForm.boundary?.length ?? 0;

  return (
    <div className="px-4 py-5 sm:px-6 lg:px-6">
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1
          className="text-primary"
          style={{
            fontSize: "1.6rem",
            fontWeight: 800,
          }}
        >
          Crop and field management
        </h1>
        <p
          className="text-muted"
          style={{
            fontSize: "0.875rem",
            marginTop: 4,
          }}
        >
          Map fields, log inputs, and track yields across {totalAcres} acres.
        </p>
      </div>

      {/* Stats */}
      <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
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
            ["map", "Field map"],
            ["inputs", "Input logs"],
            ["yields", "Yield tracking"],
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
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
          <div
            className="bg-card border border-border"
            style={{
              borderRadius: 12,
              overflow: "hidden",
            }}
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
                Field Boundaries
                {currentUser?.farm.location
                  ? ` - ${currentUser.farm.location}`
                  : ""}
              </span>
              <button
                className="btn-primary"
                onClick={() => setShowAddField(true)}
              >
                <Plus size={14} /> Add Field
              </button>
            </div>
            <FieldMap
              fields={fields}
              farmLocation={currentUser?.farm.location}
              farmCoordinates={farmCoordinates}
            />
          </div>

          <div
            className="bg-card border border-border"
            style={{
              borderRadius: 12,
              padding: "18px",
              overflow: "hidden",
            }}
          >
            <div
              className="text-primary"
              style={{
                fontWeight: 600,
                fontSize: "0.9rem",
                marginBottom: 14,
              }}
            >
              Field Registry
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {fields.map((field) => (
                <div
                  key={field.id}
                  className="border border-border"
                  style={{
                    padding: "12px",
                    borderRadius: 8,
                    background: "rgba(255,255,255,0.02)",
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
                      className="text-primary"
                      style={{
                        fontWeight: 600,
                        fontSize: "0.85rem",
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
                  <div className="text-muted" style={{ fontSize: "0.78rem" }}>
                    {field.currentCrop} · {field.acres} acres
                  </div>
                  <div
                    className="text-muted"
                    style={{
                      fontSize: "0.75rem",
                      marginTop: 3,
                    }}
                  >
                    Sown: {field.sowDate}
                  </div>
                  <div style={{ marginTop: 8 }}>
                    <div
                      className="text-muted"
                      style={{
                        fontSize: "0.68rem",
                        textTransform: "uppercase",
                        letterSpacing: "0.08em",
                        marginBottom: 4,
                      }}
                    >
                      Rotation History
                    </div>
                    <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                      {field.rotation.slice(-3).map((r) => (
                        <span
                          key={r.year}
                          className="bg-background text-secondary border border-border"
                          style={{
                            fontSize: "0.68rem",
                            padding: "2px 6px",
                            borderRadius: 4,
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
                      gap: 6,
                      justifyContent: "flex-end",
                      marginTop: 8,
                    }}
                  >
                    <button
                      onClick={() => {
                        setEditingField(field);
                        setFieldForm({
                          name: field.name,
                          currentCrop: field.currentCrop,
                          status: field.status,
                          sowDate: field.sowDate,
                          harvestDate: field.harvestDate,
                          rotation: field.rotation,
                          boundary: field.boundary,
                        });
                        setFieldErrors({});
                        setFieldSaveError(null);
                        setShowAddField(true);
                      }}
                      style={{
                        background: "rgba(96,165,250,0.15)",
                        border: "1px solid rgba(96,165,250,0.3)",
                        color: "#60a5fa",
                        borderRadius: 6,
                        padding: "4px 10px",
                        fontSize: "0.8rem",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                      }}
                      title="Edit field"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={async () => {
                        try {
                          await deleteData("fields", field.id);
                          await load();
                        } catch (error) {
                          notifications.show({
                            title: "Error",
                            message:
                              error instanceof Error
                                ? error.message
                                : "Failed to delete field",
                            color: "red",
                          });
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
          className="bg-card border border-border"
          style={{
            borderRadius: 12,
            overflow: "hidden",
          }}
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
                    <td className="text-primary" style={{ fontWeight: 500 }}>
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
                    <td className="text-primary">{log.product}</td>
                    <td>
                      {log.quantity} {log.unit}
                    </td>
                    <td>{log.operator}</td>
                    <td className="text-muted" style={{ fontSize: "0.8rem" }}>
                      {log.notes || "—"}
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 4 }}>
                        <button
                          onClick={() => {
                            setEditingInput(log);
                            setInputForm({
                              date: log.date,
                              fieldId: log.fieldId,
                              fieldName: log.fieldName,
                              type: log.type,
                              product: log.product,
                              quantity: log.quantity,
                              unit: log.unit,
                              operator: log.operator,
                              notes: log.notes,
                            });
                            setInputErrors({});
                            setShowAddInput(true);
                          }}
                          style={{
                            background: "rgba(96,165,250,0.15)",
                            border: "1px solid rgba(96,165,250,0.3)",
                            color: "#60a5fa",
                            borderRadius: 6,
                            padding: "4px 8px",
                            fontSize: "0.72rem",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: 3,
                          }}
                          title="Edit log"
                        >
                          <Pencil size={12} />
                        </button>
                        <button
                          onClick={async () => {
                            try {
                              await deleteData("inputLogs", log.id);
                              await load();
                            } catch (error) {
                              notifications.show({
                                title: "Error",
                                message:
                                  error instanceof Error
                                    ? error.message
                                    : "Failed to delete input log",
                                color: "red",
                              });
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
                          title="Delete record"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
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
            className="bg-card border border-border"
            style={{
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
            className="bg-card border border-border"
            style={{
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
                        className="text-primary"
                        style={{
                          fontWeight: 500,
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
                        className="text-primary"
                        style={{
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
                        <div style={{ display: "flex", gap: 4 }}>
                          <button
                            onClick={() => {
                              setEditingYield(y);
                              setYieldForm({
                                fieldId: y.fieldId,
                                fieldName: y.fieldName,
                                crop: y.crop,
                                year: y.year,
                                projected: y.projected,
                                actual: y.actual,
                                unit: y.unit,
                              });
                              setYieldErrors({});
                              setShowAddYield(true);
                            }}
                            style={{
                              background: "rgba(96,165,250,0.15)",
                              border: "1px solid rgba(96,165,250,0.3)",
                              color: "#60a5fa",
                              borderRadius: 6,
                              padding: "4px 8px",
                              fontSize: "0.72rem",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              gap: 3,
                            }}
                            title="Edit record"
                          >
                            <Pencil size={12} />
                          </button>
                          <button
                            onClick={async () => {
                              try {
                                await deleteData("yieldRecords", y.id);
                                await load();
                              } catch (error) {
                                notifications.show({
                                  title: "Error",
                                  message:
                                    error instanceof Error
                                      ? error.message
                                      : "Failed to delete yield record",
                                  color: "red",
                                });
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
                            title="Delete record"
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

      {/* Add Field Modal */}
      {showAddField && (
        <Modal
          title={
            editingField
              ? `Update field details: ${editingField.name}`
              : "Map a new field"
          }
          onClose={() => {
            setShowAddField(false);
            setEditingField(null);
            setFieldForm({});
            setFieldErrors({});
            setFieldSaveError(null);
          }}
          maxWidth={760}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div className="rounded-xl border border-border bg-surface p-4">
              <div className="text-sm font-semibold text-primary">
                {editingField
                  ? "Refine the field record"
                  : "Start with the essentials"}
              </div>
              <p className="mt-1 text-sm leading-6 text-secondary">
                Give the field a clear name, confirm the crop, then trace the
                boundary on the map. Acreage updates automatically as you draw.
              </p>
            </div>
            {fieldSaveError && (
              <Alert color="red" variant="light" p="xs">
                {fieldSaveError}
              </Alert>
            )}
            <FormField
              label="Field Name"
              name="name"
              type="text"
              placeholder="e.g. North Meadow"
              required
              error={fieldErrors.name}
              value={String(fieldForm.name ?? "")}
              onChange={(e) =>
                setFieldForm((f) => ({ ...f, name: e.target.value }))
              }
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <FormField
                label="Acres"
                name="acres"
                type="number"
                placeholder="Calculated from boundary"
                helperText="Calculated automatically from selected map points"
                value={computedFieldAcres ?? ""}
                readOnly
              />
              <FormField
                label="Sow Date"
                name="sowDate"
                type="date"
                required
                error={fieldErrors.sowDate}
                value={String(fieldForm.sowDate ?? "")}
                onChange={(e) =>
                  setFieldForm((f) => ({ ...f, sowDate: e.target.value }))
                }
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <FormField
                as="select"
                label="Current Crop"
                name="currentCrop"
                required
                error={fieldErrors.currentCrop}
                value={fieldForm.currentCrop ?? ""}
                onChange={(e) =>
                  setFieldForm((f) => ({ ...f, currentCrop: e.target.value }))
                }
              >
                <option value="">Select crop...</option>
                {cropModels.map((cm) => (
                  <option key={cm.id} value={cm.crop}>
                    {cm.crop}
                  </option>
                ))}
              </FormField>
              <FormField
                as="select"
                label="Field status"
                name="status"
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
              </FormField>
            </div>
            <div className="grid gap-3 rounded-xl border border-border bg-surface p-4 sm:grid-cols-3">
              <div>
                <div className="text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-muted">
                  Boundary points
                </div>
                <div className="mt-1 text-lg font-bold text-primary">
                  {boundaryPointCount}
                </div>
              </div>
              <div>
                <div className="text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-muted">
                  Estimated acres
                </div>
                <div className="mt-1 text-lg font-bold text-primary">
                  {computedFieldAcres ?? "--"}
                </div>
              </div>
              <div>
                <div className="text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-muted">
                  Crop status
                </div>
                <div className="mt-1 text-lg font-bold capitalize text-primary">
                  {fieldForm.status ?? "planted"}
                </div>
              </div>
            </div>
            <div>
              <div className="mb-2 flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-medium text-primary">
                    Field boundary
                  </div>
                  <div className="text-xs text-muted">
                    Tap or click around the field edge. Use at least three
                    points for a complete outline.
                  </div>
                </div>
                <Group gap="xs">
                  <Button
                    size="xs"
                    variant="default"
                    onClick={() =>
                      setFieldForm((current) => {
                        const boundary = current.boundary?.slice(0, -1) ?? [];
                        return {
                          ...current,
                          acres: boundaryAcres(boundary) ?? undefined,
                          boundary,
                        };
                      })
                    }
                    disabled={!fieldForm.boundary?.length}
                  >
                    Undo
                  </Button>
                  <Button
                    size="xs"
                    variant="default"
                    onClick={() =>
                      setFieldForm((current) => ({
                        ...current,
                        acres: undefined,
                        boundary: [],
                      }))
                    }
                    disabled={!fieldForm.boundary?.length}
                  >
                    Clear
                  </Button>
                </Group>
              </div>
              <div
                className={`overflow-hidden rounded-xl border ${
                  fieldErrors.boundary ? "border-red" : "border-border"
                }`}
              >
                <FieldMap
                  fields={fields}
                  farmLocation={currentUser?.farm.location}
                  farmCoordinates={farmCoordinates}
                  drawingBoundary
                  draftBoundary={fieldForm.boundary ?? []}
                  onBoundaryChange={(boundary) => {
                    setFieldForm((current) => ({
                      ...current,
                      acres: boundaryAcres(boundary) ?? undefined,
                      boundary,
                    }));
                    if (fieldErrors.boundary) {
                      setFieldErrors((current) => {
                        const next = { ...current };
                        delete next.boundary;
                        return next;
                      });
                    }
                  }}
                  height={300}
                />
              </div>
              <div
                className={`mt-1 text-xs ${
                  fieldErrors.boundary ? "text-red" : "text-muted"
                }`}
              >
                {fieldErrors.boundary ??
                  `${boundaryPointCount} boundary points marked`}
              </div>
            </div>
            <Group grow mt={4}>
              <Button onClick={saveField}>
                {editingField ? "Update Field" : "Save Field"}
              </Button>
              <Button
                variant="default"
                onClick={() => {
                  setShowAddField(false);
                  setEditingField(null);
                  setFieldForm({});
                  setFieldErrors({});
                  setFieldSaveError(null);
                }}
              >
                Cancel
              </Button>
            </Group>
          </div>
        </Modal>
      )}

      {/* Add Input Modal */}
      {showAddInput && (
        <Modal
          title={
            editingInput
              ? `Edit Input Log — ${editingInput.product}`
              : "Log Input Application"
          }
          onClose={() => {
            setShowAddInput(false);
            setEditingInput(null);
            setInputErrors({});
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <FormField
              label="Date"
              name="date"
              type="date"
              value={inputForm.date ?? new Date().toISOString().slice(0, 10)}
              onChange={(e) =>
                setInputForm((f) => ({ ...f, date: e.target.value }))
              }
            />
            <FormField
              as="select"
              label="Field"
              name="fieldId"
              required
              error={inputErrors.fieldId}
              value={inputForm.fieldId ?? ""}
              onChange={(e) => {
                const f = fields.find((f) => f.id === e.target.value);
                setInputForm((prev) => ({
                  ...prev,
                  fieldId: e.target.value,
                  fieldName: f?.name ?? "",
                }));
                if (inputErrors.fieldId)
                  setInputErrors((e) => {
                    const n = { ...e };
                    delete n.fieldId;
                    return n;
                  });
              }}
            >
              <option value="">Select field...</option>
              {fields.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </FormField>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 12,
              }}
            >
              <FormField
                as="select"
                label="Input type"
                name="type"
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
              </FormField>
              <FormField
                as="select"
                label="Product"
                name="product"
                required
                error={inputErrors.product}
                value={inputForm.product ?? ""}
                onChange={(e) =>
                  setInputForm((f) => ({ ...f, product: e.target.value }))
                }
              >
                <option value="">Select product...</option>
                {[...new Set(inputs.map((i) => i.product).filter(Boolean))].map(
                  (p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ),
                )}
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
                label="Quantity"
                name="quantity"
                type="text"
                placeholder="180"
                required
                error={inputErrors.quantity}
                value={String(inputForm.quantity ?? "")}
                onChange={(e) =>
                  setInputForm((f) => ({ ...f, quantity: e.target.value }))
                }
              />
              <FormField
                as="select"
                label="Unit"
                name="unit"
                value={inputForm.unit ?? ""}
                onChange={(e) =>
                  setInputForm((f) => ({ ...f, unit: e.target.value }))
                }
              >
                <option value="">Select unit...</option>
                {[
                  "kg/ha",
                  "l/ha",
                  "kg",
                  "litres",
                  "tonnes",
                  "bags",
                  "g",
                  "ml",
                ].map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </FormField>
            </div>
            <FormField
              as="select"
              label="Operator"
              name="operator"
              value={inputForm.operator ?? ""}
              onChange={(e) =>
                setInputForm((f) => ({ ...f, operator: e.target.value }))
              }
            >
              <option value="">Select operator...</option>
              {[...new Set(inputs.map((i) => i.operator).filter(Boolean))].map(
                (o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ),
              )}
            </FormField>
            <FormField
              label="Notes"
              name="notes"
              type="text"
              placeholder="Optional"
              value={String(inputForm.notes ?? "")}
              onChange={(e) =>
                setInputForm((f) => ({ ...f, notes: e.target.value }))
              }
            />
            <Group grow mt={4}>
              <Button onClick={saveInput}>Save Log</Button>
              <Button variant="default" onClick={() => setShowAddInput(false)}>
                Cancel
              </Button>
            </Group>
          </div>
        </Modal>
      )}

      {/* Add Yield Modal */}
      {showAddYield && (
        <Modal
          title={
            editingYield
              ? `Edit Yield Record — ${editingYield.fieldName}`
              : "Add Yield Record"
          }
          onClose={() => {
            setShowAddYield(false);
            setEditingYield(null);
            setYieldErrors({});
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <FormField
              as="select"
              label="Field"
              name="yieldFieldId"
              required
              error={yieldErrors.fieldId}
              value={yieldForm.fieldId ?? ""}
              onChange={(e) => {
                const f = fields.find((f) => f.id === e.target.value);
                setYieldForm((prev) => ({
                  ...prev,
                  fieldId: e.target.value,
                  fieldName: f?.name ?? "",
                }));
                if (yieldErrors.fieldId)
                  setYieldErrors((e) => {
                    const n = { ...e };
                    delete n.fieldId;
                    return n;
                  });
              }}
            >
              <option value="">Select field...</option>
              {fields.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </FormField>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 12,
              }}
            >
              <FormField
                as="select"
                label="Crop"
                name="crop"
                value={yieldForm.crop ?? ""}
                onChange={(e) =>
                  setYieldForm((f) => ({ ...f, crop: e.target.value }))
                }
              >
                <option value="">Select crop...</option>
                {cropModels.map((cm) => (
                  <option key={cm.id} value={cm.crop}>
                    {cm.crop}
                  </option>
                ))}
              </FormField>
              <FormField
                label="Year"
                name="year"
                type="number"
                placeholder="2025"
                value={String(yieldForm.year ?? "")}
                onChange={(e) =>
                  setYieldForm((f) => ({ ...f, year: +e.target.value }))
                }
              />
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 12,
              }}
            >
              <FormField
                label="Projected (t/ha)"
                name="projected"
                type="number"
                placeholder="8.5"
                required
                error={yieldErrors.projected}
                value={String(yieldForm.projected ?? "")}
                onChange={(e) =>
                  setYieldForm((f) => ({ ...f, projected: +e.target.value }))
                }
              />
              <FormField
                label="Actual (t/ha)"
                name="actual"
                type="number"
                placeholder="9.2"
                required
                error={yieldErrors.actual}
                value={String(yieldForm.actual ?? "")}
                onChange={(e) =>
                  setYieldForm((f) => ({ ...f, actual: +e.target.value }))
                }
              />
            </div>
            <FormField
              as="select"
              label="Unit"
              name="unit"
              value={yieldForm.unit ?? ""}
              onChange={(e) =>
                setYieldForm((f) => ({ ...f, unit: e.target.value }))
              }
            >
              <option value="">Select unit...</option>
              {["t/ha", "kg/ha", "tonnes", "kg", "bags"].map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </FormField>
            <Group grow mt={4}>
              <Button onClick={saveYield}>Save Record</Button>
              <Button
                variant="default"
                onClick={() => {
                  setShowAddYield(false);
                  setYieldErrors({});
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
