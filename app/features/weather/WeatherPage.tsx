"use client";

import FormField from "@/app/abstract/ui/FormField";
import Modal from "@/app/abstract/ui/Modal";
import StatCard from "@/app/abstract/ui/StatCard";
import TableSkeleton from "@/app/abstract/ui/TableSkeleton";
import { useFarmData } from "@/app/base/hooks/useFarmData";
import {
  deleteData,
  generateId,
  saveData,
  type CropField,
  type CropModel,
  type GDDRecord,
  type GrowthStageForecast,
  type WeatherStation,
} from "@/app/base/services/farm-client";
import { COMMON_CROPS } from "@/app/lib/crops";
import { useCurrentUser } from "@/app/lib/user-context";
import { Button, Group } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
  Cloud,
  CloudRain,
  CloudSun,
  FlaskConical,
  Gauge,
  Pencil,
  Plus,
  Sprout,
  ThermometerSun,
  Trash2,
  Wind,
} from "lucide-react";
import { useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const WEATHER_ENTITIES = {
  fields: "fields",
  weatherStations: "weatherStations",
  cropModels: "cropModels",
  gddRecords: "gddRecords",
  growthStageForecasts: "growthStageForecasts",
} as const;

type Tab = "stations" | "gdd" | "forecast";

const STAGE_COLORS: Record<string, string> = {
  germination: "#fbbf24",
  emergence: "#60a5fa",
  vegetative: "#4ade80",
  flowering: "#f472b6",
  fruiting: "#a78bfa",
  maturity: "#f87171",
};

function getStageEmoji(stage: string) {
  const map: Record<string, string> = {
    germination: "🌱",
    emergence: "🌿",
    vegetative: "🌿",
    flowering: "🌸",
    fruiting: "🍎",
    maturity: "🌾",
  };
  return map[stage] ?? "🌱";
}

function getDefaultProviders() {
  return [
    "davis-vantage",
    "open-meteo",
    "custom-api",
    "weatherlink",
    "netatmo",
    "ambient-weather",
  ];
}

export default function WeatherPage() {
  const [tab, setTab] = useState<Tab>("stations");
  const currentUser = useCurrentUser();
  const { data, loading, reload } = useFarmData(WEATHER_ENTITIES);
  const fields = data.fields as CropField[];
  const stations = data.weatherStations as WeatherStation[];
  const cropModels = data.cropModels as CropModel[];
  const gddRecords = data.gddRecords as GDDRecord[];
  const forecasts = data.growthStageForecasts as GrowthStageForecast[];

  const [showAddStation, setShowAddStation] = useState(false);
  const [editingStation, setEditingStation] = useState<WeatherStation | null>(null);
  const [showAddCropModel, setShowAddCropModel] = useState(false);
  const [editingModel, setEditingModel] = useState<CropModel | null>(null);
  const [stationForm, setStationForm] = useState<Partial<WeatherStation>>({});
  const [modelForm, setModelForm] = useState<Partial<CropModel>>({});
  const [computing, setComputing] = useState<string | null>(null);
  const [computingForecast, setComputingForecast] = useState<string | null>(null);
  const [gddResults, setGddResults] = useState<Record<string, { cumulativeGdd: number; records: GDDRecord[] }>>({});
  const [forecastResults, setForecastResults] = useState<Record<string, GrowthStageForecast[]>>({});

  const activeStations = stations.filter((s) => s.isActive);

  const uniqueCrops = [...new Set(fields.map((f) => f.currentCrop).filter(Boolean))];

  useEffect(() => {
    const season = new Date().getFullYear();
    for (const field of fields) {
      if (field.status === "fallow") continue;
      setComputing(field.id);
      fetch("/api/weather/compute-gdd", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fieldId: field.id, season }),
      })
        .then((r) => r.json())
        .then((result) => {
          if (result.cumulativeGdd !== undefined) {
            setGddResults((prev) => ({
              ...prev,
              [field.id]: { cumulativeGdd: result.cumulativeGdd, records: result.records ?? [] },
            }));
          }
        })
        .catch(() => {})
        .finally(() => setComputing(null));
    }
  }, [fields.length]);

  useEffect(() => {
    const season = new Date().getFullYear();
    for (const field of fields) {
      if (field.status === "fallow") continue;
      setComputingForecast(field.id);
      fetch("/api/weather/forecast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fieldId: field.id, season }),
      })
        .then((r) => r.json())
        .then((result) => {
          if (result.forecasts) {
            setForecastResults((prev) => ({
              ...prev,
              [field.id]: result.forecasts,
            }));
          }
        })
        .catch(() => {})
        .finally(() => setComputingForecast(null));
    }
  }, [fields.length]);

  const totalSeededAcres = fields
    .filter((f) => f.status !== "fallow")
    .reduce((s, f) => s + f.acres, 0);

  const totalGdd = Object.values(gddResults).reduce((s, r) => s + r.cumulativeGdd, 0);
  const avgGdd = Object.keys(gddResults).length > 0
    ? (totalGdd / Object.keys(gddResults).length).toFixed(0)
    : "—";

  const nextStageFields = forecasts
    .filter((f) => {
      const stages = forecastResults[f.fieldId] ?? [];
      const unreached = stages.filter((s) => !s.actualDate);
      return unreached.length > 0;
    })
    .slice(0, 5);

  if (loading) return <TableSkeleton rows={6} cols={5} />;

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 28 }}>
        <h1
          className="text-primary"
          style={{ fontSize: "1.6rem", fontWeight: 800, letterSpacing: "-0.02em" }}
        >
          Hyper-Local Weather & Crop Modeling
        </h1>
        <p className="text-muted" style={{ fontSize: "0.875rem", marginTop: 4 }}>
          On-farm weather stations, Growing Degree Days, and physiological growth stage forecasts across {totalSeededAcres} seeded acres
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
          label="Weather Stations"
          value={stations.length}
          sub={`${activeStations.length} active`}
          icon={CloudSun}
          color="#60a5fa"
          delay={0}
        />
        <StatCard
          label="Crop Models"
          value={cropModels.length}
          sub={`${uniqueCrops.length} unique crops`}
          icon={FlaskConical}
          color="#a78bfa"
          delay={60}
        />
        <StatCard
          label="Avg GDD Accumulated"
          value={avgGdd}
          sub="season-to-date"
          icon={ThermometerSun}
          color="#fbbf24"
          delay={120}
        />
        <StatCard
          label="Growth Stage Forecasts"
          value={forecasts.length}
          sub={`${nextStageFields.length} pending transitions`}
          icon={Sprout}
          color="#4ade80"
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
            ["stations", "Weather Stations"],
            ["gdd", "GDD Tracker"],
            ["forecast", "Growth Stage Forecast"],
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

      {tab === "stations" && (
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
                On-Farm Weather Stations
              </span>
              <button
                className="btn-primary"
                onClick={() => setShowAddStation(true)}
              >
                <Plus size={14} /> Add Station
              </button>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table className="farm-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Provider</th>
                    <th>Status</th>
                    <th>Last Sync</th>
                    <th>Location</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {stations.map((station) => (
                    <tr key={station.id}>
                      <td className="text-primary" style={{ fontWeight: 500 }}>
                        {station.name}
                      </td>
                      <td>
                        <span className="badge-blue">{station.provider}</span>
                      </td>
                      <td>
                        <span
                          className={
                            station.isActive ? "badge-green" : "badge-red"
                          }
                        >
                          {station.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="text-muted" style={{ fontSize: "0.85rem" }}>
                        {station.lastSyncAt
                          ? new Date(
                              station.lastSyncAt
                            ).toLocaleDateString("en-GB")
                          : "Never"}
                      </td>
                      <td className="text-muted">
                        {station.lat && station.lng
                          ? `${station.lat.toFixed(4)}, ${station.lng.toFixed(4)}`
                          : "—"}
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: 4 }}>
                        <button
                          onClick={() => {
                            setEditingStation(station);
                            setStationForm({
                              name: station.name,
                              provider: station.provider,
                              apiEndpoint: station.apiEndpoint,
                              lat: station.lat,
                              lng: station.lng,
                            });
                            setShowAddStation(true);
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
                          title="Edit station"
                        >
                          <Pencil size={12} />
                        </button>
                        <button
                          onClick={async () => {
                            try {
                              await deleteData("weatherStations", station.id);
                              await reload();
                              notifications.show({ title: "Success", message: "Station deleted", color: "green" });
                            } catch (error) {
                              notifications.show({
                                title: "Error",
                                message: error instanceof Error ? error.message : "Failed to delete station",
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
                          title="Delete station"
                        >
                          <Trash2 size={14} />
                        </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {stations.length === 0 && (
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
                        No weather stations configured. Add a station to start collecting weather data.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
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
                Crop Models
              </span>
              <button
                className="btn-primary"
                onClick={() => setShowAddCropModel(true)}
              >
                <Plus size={14} /> Add Crop Model
              </button>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table className="farm-table">
                <thead>
                  <tr>
                    <th>Crop</th>
                    <th>Base Temp</th>
                    <th>Optimal Temp</th>
                    <th>Max Temp</th>
                    <th>Germination</th>
                    <th>Vegetative</th>
                    <th>Flowering</th>
                    <th>Maturity</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {cropModels.map((model) => (
                    <tr key={model.id}>
                      <td className="text-primary" style={{ fontWeight: 500 }}>
                        {model.crop}
                      </td>
                      <td>{model.baseTemp}C</td>
                      <td>{model.optimalTemp}C</td>
                      <td>{model.maxTemp}C</td>
                      <td>{model.gddToGermination ?? "—"}</td>
                      <td>{model.gddToVegetative ?? "—"}</td>
                      <td>{model.gddToFlowering ?? "—"}</td>
                      <td>{model.gddToMaturity ?? "—"}</td>
                      <td>
                        <div style={{ display: "flex", gap: 4 }}>
                        <button
                          onClick={() => {
                            setEditingModel(model);
                            setModelForm({
                              crop: model.crop,
                              baseTemp: model.baseTemp,
                              optimalTemp: model.optimalTemp,
                              maxTemp: model.maxTemp,
                              gddToGermination: model.gddToGermination,
                              gddToEmergence: model.gddToEmergence,
                              gddToVegetative: model.gddToVegetative,
                              gddToFlowering: model.gddToFlowering,
                              gddToFruiting: model.gddToFruiting,
                              gddToMaturity: model.gddToMaturity,
                            });
                            setShowAddCropModel(true);
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
                          title="Edit model"
                        >
                          <Pencil size={12} />
                        </button>
                        <button
                          onClick={async () => {
                            try {
                              await deleteData("cropModels", model.id);
                              await reload();
                              notifications.show({ title: "Success", message: "Crop model deleted", color: "green" });
                            } catch (error) {
                              notifications.show({
                                title: "Error",
                                message: error instanceof Error ? error.message : "Failed to delete model",
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
                          title="Delete model"
                        >
                          <Trash2 size={14} />
                        </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {cropModels.length === 0 && (
                    <tr>
                      <td
                        colSpan={9}
                        className="text-muted"
                        style={{
                          textAlign: "center",
                          padding: "40px 20px",
                          fontSize: "0.85rem",
                        }}
                      >
                        No crop models defined. Default models are used from the
                        built-in library. Add custom models to fine-tune GDD
                        thresholds.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === "gdd" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {fields
            .filter((f) => f.status !== "fallow")
            .map((field) => {
              const gddInfo = gddResults[field.id];
              const fieldGddRecords = gddRecords.filter(
                (r) => r.fieldId === field.id
              );
              const chartData = (gddInfo?.records ?? fieldGddRecords)
                .slice(-60)
                .map((r) => ({
                  date: new Date(r.date).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                  }),
                  daily: r.dailyGDD,
                  cumulative: r.cumulativeGDD,
                }));

              return (
                <div
                  key={field.id}
                  className="bg-card border border-border"
                  style={{ borderRadius: 12, padding: 20 }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 16,
                    }}
                  >
                    <div>
                      <div
                        className="text-primary"
                        style={{ fontWeight: 600, fontSize: "0.95rem" }}
                      >
                        {field.name}
                      </div>
                      <div className="text-muted" style={{ fontSize: "0.8rem" }}>
                        {field.currentCrop} · Sown {field.sowDate} ·{" "}
                        {field.acres} acres
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div className="text-primary" style={{ fontSize: "1.8rem", fontWeight: 700 }}>
                        {computing === field.id ? (
                          <span className="text-muted" style={{ fontSize: "0.9rem" }}>Computing…</span>
                        ) : (
                          <>{gddInfo?.cumulativeGdd?.toFixed(0) ?? "—"} <span style={{ fontSize: "0.75rem", fontWeight: 400, color: "var(--text-muted)" }}>GDD</span></>
                        )}
                      </div>
                      <div className="text-muted" style={{ fontSize: "0.75rem" }}>
                        season-to-date
                      </div>
                    </div>
                  </div>
                  {chartData.length > 0 && (
                    <ResponsiveContainer width="100%" height={200}>
                      <AreaChart data={chartData}>
                        <defs>
                          <linearGradient id={`gddFill-${field.id}`} x1="0" x2="0" y1="0" y2="1">
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
                        />
                        <Tooltip
                          contentStyle={{
                            background: "var(--bg-card)",
                            border: "1px solid var(--border)",
                            borderRadius: 8,
                            fontSize: "0.8rem",
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="cumulative"
                          stroke="#4ade80"
                          fill={`url(#gddFill-${field.id})`}
                          strokeWidth={2.5}
                          name="Cumulative GDD"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                  {chartData.length === 0 && computing !== field.id && (
                    <div
                      className="text-muted"
                      style={{
                        textAlign: "center",
                        padding: "30px 20px",
                        fontSize: "0.85rem",
                      }}
                    >
                      No GDD data yet. Ingest weather data or click "Compute GDD" to
                      generate seasonal GDD records.
                    </div>
                  )}
                </div>
              );
            })}
          {fields.filter((f) => f.status !== "fallow").length === 0 && (
            <div
              className="bg-card border border-border"
              style={{
                borderRadius: 12,
                padding: "40px 20px",
                textAlign: "center",
              }}
            >
              <div className="text-muted" style={{ fontSize: "0.9rem" }}>
                No active fields found. Add fields in Crops & Fields to start tracking GDD.
              </div>
            </div>
          )}
        </div>
      )}

      {tab === "forecast" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {fields
            .filter((f) => f.status !== "fallow")
            .map((field) => {
              const fieldForecasts = forecastResults[field.id] ?? forecasts.filter(
                (f) => f.fieldId === field.id
              );
              const gddInfo = gddResults[field.id];

              return (
                <div
                  key={field.id}
                  className="bg-card border border-border"
                  style={{ borderRadius: 12, padding: 20 }}
                >
                  <div style={{ marginBottom: 16 }}>
                    <div
                      className="text-primary"
                      style={{ fontWeight: 600, fontSize: "0.95rem" }}
                    >
                      {field.name}
                    </div>
                    <div className="text-muted" style={{ fontSize: "0.8rem" }}>
                      {field.currentCrop} ·{" "}
                      {gddInfo
                        ? `${gddInfo.cumulativeGdd.toFixed(0)} GDD accumulated`
                        : "Computing GDD..."}
                    </div>
                  </div>
                  {fieldForecasts.length > 0 ? (
                    <div
                      style={{
                        display: "grid",
                        gap: 10,
                        gridTemplateColumns: `repeat(${Math.min(fieldForecasts.length, 6)}, 1fr)`,
                      }}
                    >
                      {fieldForecasts.map((f) => {
                        const reached = f.actualDate !== null && f.actualDate !== undefined;
                        const stageColor = STAGE_COLORS[f.stage] ?? "#64748b";
                        const daysTo =
                          !reached
                            ? Math.ceil(
                                (new Date(`${f.forecastDate}T00:00:00`).getTime() -
                                  new Date().getTime()) /
                                  86400000
                              )
                            : null;
                        return (
                          <div
                            key={f.id}
                            className="border border-border"
                            style={{
                              borderRadius: 10,
                              padding: 14,
                              textAlign: "center",
                              background: reached
                                ? "rgba(74,222,128,0.08)"
                                : "rgba(255,255,255,0.02)",
                              borderColor: reached ? "rgba(74,222,128,0.3)" : undefined,
                            }}
                          >
                            <div style={{ fontSize: "1.5rem", marginBottom: 4 }}>
                              {getStageEmoji(f.stage)}
                            </div>
                            <div
                              style={{
                                fontSize: "0.8rem",
                                fontWeight: 600,
                                textTransform: "capitalize",
                                color: stageColor,
                                marginBottom: 4,
                              }}
                            >
                              {f.stage}
                            </div>
                            <div
                              className="text-primary"
                              style={{ fontSize: "0.9rem", fontWeight: 600 }}
                            >
                              {f.gddRequired} GDD
                            </div>
                            {reached ? (
                              <div
                                className="text-green"
                                style={{ fontSize: "0.75rem", marginTop: 4 }}
                              >
                                Reached {f.actualDate}
                              </div>
                            ) : (
                              <>
                                <div
                                  className="text-muted"
                                  style={{ fontSize: "0.75rem", marginTop: 4 }}
                                >
                                  Est. {f.forecastDate}
                                </div>
                                {daysTo !== null && (
                                  <div
                                    style={{
                                      fontSize: "0.75rem",
                                      fontWeight: 600,
                                      marginTop: 2,
                                      color:
                                        daysTo <= 7
                                          ? "#fbbf24"
                                          : daysTo <= 14
                                          ? "#60a5fa"
                                          : "var(--text-muted)",
                                    }}
                                  >
                                    {daysTo <= 0
                                      ? "Imminent"
                                      : `${daysTo} days`}
                                  </div>
                                )}
                                <div
                                  className="text-muted"
                                  style={{
                                    fontSize: "0.65rem",
                                    marginTop: 4,
                                  }}
                                >
                                  {(f.confidence * 100).toFixed(0)}% confidence
                                </div>
                              </>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div
                      className="text-muted"
                      style={{
                        textAlign: "center",
                        padding: "30px 20px",
                        fontSize: "0.85rem",
                      }}
                    >
                      {computingForecast === field.id
                        ? "Computing forecast..."
                        : "No forecast data. Compute GDD first to generate growth stage forecasts."}
                    </div>
                  )}
                </div>
              );
            })}
          {fields.filter((f) => f.status !== "fallow").length === 0 && (
            <div
              className="bg-card border border-border"
              style={{
                borderRadius: 12,
                padding: "40px 20px",
                textAlign: "center",
              }}
            >
              <div className="text-muted" style={{ fontSize: "0.9rem" }}>
                No active fields. Add fields in Crops & Fields to start forecasting growth stages.
              </div>
            </div>
          )}
        </div>
      )}

      {showAddStation && (
        <Modal
          title={editingStation ? `Edit Station — ${editingStation.name}` : "Add Weather Station"}
          onClose={() => {
            setShowAddStation(false);
            setEditingStation(null);
            setStationForm({});
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 12,
              }}
            >
              <FormField
                label="Station Name"
                name="name"
                type="text"
                placeholder="e.g. North Field Station"
                value={String(stationForm.name ?? "")}
                onChange={(e) =>
                  setStationForm((f) => ({ ...f, name: e.target.value }))
                }
              />
              <FormField
                as="select"
                label="Provider"
                name="provider"
                value={stationForm.provider ?? "open-meteo"}
                onChange={(e) =>
                  setStationForm((f) => ({ ...f, provider: e.target.value }))
                }
              >
                {getDefaultProviders().map((p) => (
                  <option key={p} value={p}>
                    {p.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                  </option>
                ))}
              </FormField>
            </div>
            <FormField
              label="API Endpoint (optional)"
              name="apiEndpoint"
              type="text"
              placeholder="https://api.weatherlink.com/v2/..."
              value={String(stationForm.apiEndpoint ?? "")}
              onChange={(e) =>
                setStationForm((f) => ({ ...f, apiEndpoint: e.target.value }))
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
                label="Latitude"
                name="lat"
                type="number"
                placeholder="53.95"
                value={String(stationForm.lat ?? "")}
                onChange={(e) =>
                  setStationForm((f) => ({ ...f, lat: +e.target.value }))
                }
              />
              <FormField
                label="Longitude"
                name="lng"
                type="number"
                placeholder="-1.08"
                value={String(stationForm.lng ?? "")}
                onChange={(e) =>
                  setStationForm((f) => ({ ...f, lng: +e.target.value }))
                }
              />
            </div>
            <Group grow mt={4}>
              <Button
                onClick={async () => {
                  try {
                    await saveData("weatherStations", {
                      id: editingStation?.id || generateId(),
                      name: stationForm.name?.trim() || "Unnamed Station",
                      provider: stationForm.provider || "open-meteo",
                      apiEndpoint: stationForm.apiEndpoint || undefined,
                      lat: stationForm.lat || undefined,
                      lng: stationForm.lng || undefined,
                      isActive: true,
                    } as WeatherStation);
                    await reload();
                    setShowAddStation(false);
                    setEditingStation(null);
                    setStationForm({});
                    notifications.show({ title: "Success", message: "Station saved", color: "green" });
                  } catch (error) {
                    notifications.show({
                      title: "Error",
                      message: error instanceof Error ? error.message : "Failed to save station",
                      color: "red",
                    });
                  }
                }}
              >
                Save Station
              </Button>
              <Button
                variant="default"
                onClick={() => {
                  setShowAddStation(false);
                  setEditingStation(null);
                  setStationForm({});
                }}
              >
                Cancel
              </Button>
            </Group>
          </div>
        </Modal>
      )}

      {showAddCropModel && (
        <Modal
          title={editingModel ? `Edit Model — ${editingModel.crop}` : "Add Crop Model"}
          onClose={() => {
            setShowAddCropModel(false);
            setEditingModel(null);
            setModelForm({});
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <FormField
              as="select"
              label="Crop"
              name="crop"
              value={modelForm.crop ?? ""}
              onChange={(e) =>
                setModelForm((f) => ({ ...f, crop: e.target.value }))
              }
            >
              <option value="">Select crop...</option>
              {COMMON_CROPS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </FormField>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr",
                gap: 12,
              }}
            >
              <FormField
                label="Base Temp (C)"
                name="baseTemp"
                type="number"
                value={String(modelForm.baseTemp ?? 0)}
                onChange={(e) =>
                  setModelForm((f) => ({ ...f, baseTemp: +e.target.value }))
                }
              />
              <FormField
                label="Optimal Temp (C)"
                name="optimalTemp"
                type="number"
                value={String(modelForm.optimalTemp ?? 25)}
                onChange={(e) =>
                  setModelForm((f) => ({ ...f, optimalTemp: +e.target.value }))
                }
              />
              <FormField
                label="Max Temp (C)"
                name="maxTemp"
                type="number"
                value={String(modelForm.maxTemp ?? 35)}
                onChange={(e) =>
                  setModelForm((f) => ({ ...f, maxTemp: +e.target.value }))
                }
              />
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr",
                gap: 12,
              }}
            >
              <FormField
                label="GDD to Germination"
                name="gddToGermination"
                type="number"
                value={String(modelForm.gddToGermination ?? "")}
                onChange={(e) =>
                  setModelForm((f) => ({
                    ...f,
                    gddToGermination: +e.target.value,
                  }))
                }
              />
              <FormField
                label="GDD to Vegetative"
                name="gddToVegetative"
                type="number"
                value={String(modelForm.gddToVegetative ?? "")}
                onChange={(e) =>
                  setModelForm((f) => ({
                    ...f,
                    gddToVegetative: +e.target.value,
                  }))
                }
              />
              <FormField
                label="GDD to Flowering"
                name="gddToFlowering"
                type="number"
                value={String(modelForm.gddToFlowering ?? "")}
                onChange={(e) =>
                  setModelForm((f) => ({
                    ...f,
                    gddToFlowering: +e.target.value,
                  }))
                }
              />
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr",
                gap: 12,
              }}
            >
              <FormField
                label="GDD to Fruiting"
                name="gddToFruiting"
                type="number"
                value={String(modelForm.gddToFruiting ?? "")}
                onChange={(e) =>
                  setModelForm((f) => ({
                    ...f,
                    gddToFruiting: +e.target.value,
                  }))
                }
              />
              <FormField
                label="GDD to Maturity"
                name="gddToMaturity"
                type="number"
                value={String(modelForm.gddToMaturity ?? "")}
                onChange={(e) =>
                  setModelForm((f) => ({
                    ...f,
                    gddToMaturity: +e.target.value,
                  }))
                }
              />
              <FormField
                label="GDD to Emergence"
                name="gddToEmergence"
                type="number"
                value={String(modelForm.gddToEmergence ?? "")}
                onChange={(e) =>
                  setModelForm((f) => ({
                    ...f,
                    gddToEmergence: +e.target.value,
                  }))
                }
              />
            </div>
            <Group grow mt={4}>
              <Button
                onClick={async () => {
                  if (!modelForm.crop) return;
                  try {
                    await saveData("cropModels", {
                      id: editingModel?.id || generateId(),
                      ...modelForm,
                    } as CropModel);
                    await reload();
                    setShowAddCropModel(false);
                    setEditingModel(null);
                    setModelForm({});
                    notifications.show({ title: "Success", message: "Crop model saved", color: "green" });
                  } catch (error) {
                    notifications.show({
                      title: "Error",
                      message: error instanceof Error ? error.message : "Failed to save model",
                      color: "red",
                    });
                  }
                }}
              >
                Save Model
              </Button>
              <Button
                variant="default"
                onClick={() => {
                  setShowAddCropModel(false);
                  setEditingModel(null);
                  setModelForm({});
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
