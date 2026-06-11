"use client";

import {
  AlertTriangle,
  ArrowRight,
  Beef,
  CheckCircle,
  Clock,
  Package,
  ShoppingCart,
  TrendingUp,
  Wheat,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
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
import StatCard from "@/app/abstract/ui/StatCard";
import { useFarmData } from "@/app/base/hooks/useFarmData";
import {
  type Animal,
  type CropField,
  type SaleRecord,
  type StockItem,
  type Task,
  type YieldRecord,
} from "@/app/base/services/farm-client";

const DASHBOARD_ENTITIES = {
  fields: "fields",
  animals: "animals",
  stock: "stockItems",
  sales: "sales",
  tasks: "tasks",
  yieldRecords: "yieldRecords",
} as const;

type WeatherData = {
  current: {
    temperature_2m: number;
    weather_code: number;
    wind_speed_10m: number;
    relative_humidity_2m: number;
    precipitation: number;
  };
  daily: {
    time: string[];
    weather_code: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_sum: number[];
  };
};

function weatherInfo(code: number): { emoji: string; description: string } {
  if (code === 0) return { emoji: "☀️", description: "Clear sky" };
  if (code <= 2) return { emoji: "⛅", description: "Partly cloudy" };
  if (code === 3) return { emoji: "☁️", description: "Overcast" };
  if (code === 45 || code === 48) return { emoji: "🌫️", description: "Foggy" };
  if (code >= 51 && code <= 55) return { emoji: "🌦️", description: "Drizzle" };
  if (code >= 61 && code <= 65) return { emoji: "🌧️", description: "Rain" };
  if (code >= 71 && code <= 75) return { emoji: "❄️", description: "Snow" };
  if (code >= 80 && code <= 82) return { emoji: "🌦️", description: "Showers" };
  if (code === 85 || code === 86)
    return { emoji: "🌨️", description: "Snow showers" };
  if (code === 95) return { emoji: "⛈️", description: "Thunderstorm" };
  if (code === 96 || code === 99)
    return { emoji: "⛈️", description: "Thunderstorm + hail" };
  return { emoji: "🌤️", description: "Variable" };
}

const CHART_STYLE = {
  background: "transparent",
  fontSize: "0.75rem",
};

type ChartPayloadItem = {
  dataKey: string;
  color?: string;
  name?: string;
  value: number | string;
};

function CustomTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: ChartPayloadItem[];
  label?: string;
}) {
  if (active && payload?.length) {
    return (
      <div
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: 8,
          padding: "10px 14px",
          fontSize: "0.8rem",
        }}
      >
        <div
          style={{
            color: "var(--text-muted)",
            marginBottom: 6,
            fontWeight: 600,
          }}
        >
          {label}
        </div>
        {payload.map((p) => (
          <div key={p.dataKey} style={{ color: p.color ?? "#94a3b8" }}>
            {p.name}: {p.value} t/ha
          </div>
        ))}
      </div>
    );
  }
  return null;
}

export default function DashboardPage() {
  const { data } = useFarmData(DASHBOARD_ENTITIES);
  const fields = data.fields as CropField[];
  const animals = data.animals as Animal[];
  const stock = data.stock as StockItem[];
  const sales = data.sales as SaleRecord[];
  const tasks = data.tasks as Task[];
  const yieldRecords = data.yieldRecords as YieldRecord[];
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(true);
  const [weatherError, setWeatherError] = useState<string | null>(null);

  useEffect(() => {
    fetch(
      "https://api.open-meteo.com/v1/forecast?latitude=53.95&longitude=-1.08&current=temperature_2m,weather_code,wind_speed_10m,relative_humidity_2m,precipitation&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum&forecast_days=5&timezone=Europe%2FLondon",
    )
      .then((r) => r.json())
      .then((data: WeatherData) => {
        setWeather(data);
        setWeatherLoading(false);
      })
      .catch(() => {
        setWeatherError("Weather data unavailable");
        setWeatherLoading(false);
      });
  }, []);

  const todaySales = sales
    .filter((s) => s.date === new Date().toISOString().slice(0, 10))
    .reduce((sum, s) => sum + s.total, 0);
  const totalSales = sales.reduce((sum, s) => sum + s.total, 0);
  const lowStock = stock.filter((s) => s.quantity <= s.minStock);
  const pendingTasks = tasks.filter(
    (t) => t.status === "pending" || t.status === "in-progress",
  );
  const highPriorityTasks = tasks.filter(
    (t) => t.priority === "high" && t.status !== "done",
  );

  // Yield chart data — most recent record per field, up to 5 fields
  const yieldData = (() => {
    const byField = new Map<string, YieldRecord>();
    for (const r of yieldRecords) {
      const existing = byField.get(r.fieldName);
      if (!existing || r.year > existing.year) byField.set(r.fieldName, r);
    }
    return Array.from(byField.values())
      .slice(0, 5)
      .map((r) => ({
        field: r.fieldName.split(" ")[0],
        projected: r.projected,
        actual: r.actual,
      }));
  })();

  // Sales by channel — last 7 calendar days from live store
  const salesByChannel = (() => {
    const today = new Date();
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() - 6 + i);
      const dateStr = d.toISOString().slice(0, 10);
      const dayLabel = d.toLocaleDateString("en-GB", { weekday: "short" });
      const daySales = sales.filter((s) => s.date === dateStr);
      const shop = daySales
        .filter((s) => s.channel === "shop")
        .reduce((sum, s) => sum + s.total, 0);
      const online = daySales
        .filter((s) => s.channel === "online")
        .reduce((sum, s) => sum + s.total, 0);
      return { day: dayLabel, shop, online };
    });
  })();

  return (
    <div style={{ padding: "32px 32px 48px", minHeight: "100vh" }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
          }}
        >
          <div>
            <h1
              style={{
                fontSize: "1.75rem",
                fontWeight: 800,
                color: "var(--text-primary)",
                letterSpacing: "-0.03em",
              }}
            >
              Good morning, Greenwood Estate 🌿
            </h1>
            <p
              style={{
                color: "var(--text-muted)",
                fontSize: "0.875rem",
                marginTop: 4,
              }}
            >
              {new Date().toLocaleDateString("en-GB", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
              {" · "} Yorkshire, UK
            </p>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            {highPriorityTasks.length > 0 && (
              <div
                style={{
                  background: "rgba(251,191,36,0.1)",
                  border: "1px solid rgba(251,191,36,0.3)",
                  borderRadius: 8,
                  padding: "8px 14px",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <AlertTriangle size={16} color="#fbbf24" />
                <span
                  style={{
                    color: "#fbbf24",
                    fontSize: "0.8rem",
                    fontWeight: 600,
                  }}
                >
                  {highPriorityTasks.length} urgent task
                  {highPriorityTasks.length !== 1 ? "s" : ""}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 16,
          marginBottom: 28,
        }}
      >
        <StatCard
          label="Fields in Production"
          value={fields.filter((f) => f.status !== "fallow").length}
          sub={`${fields.reduce((s, f) => s + f.acres, 0)} total acres`}
          icon={Wheat}
          color="#4ade80"
          trend={{ value: 12, label: "vs last season" }}
          delay={0}
        />
        <StatCard
          label="Total Livestock"
          value={
            animals.filter(
              (a) => a.status !== "deceased" && a.status !== "sold",
            ).length
          }
          sub={`${animals.filter((a) => a.status === "sick").length} sick animals`}
          icon={Beef}
          color="#60a5fa"
          delay={80}
        />
        <StatCard
          label="Stock Lines"
          value={stock.length}
          sub={`${lowStock.length} below minimum`}
          icon={Package}
          color={lowStock.length > 0 ? "#f87171" : "#2dd4bf"}
          trend={
            lowStock.length > 0
              ? { value: -lowStock.length, label: "items need restocking" }
              : undefined
          }
          delay={160}
        />
        <StatCard
          label="Today's Sales"
          value={`£${todaySales.toFixed(2)}`}
          sub={`£${totalSales.toFixed(2)} this week`}
          icon={ShoppingCart}
          color="#a78bfa"
          trend={{ value: 8, label: "vs last week" }}
          delay={240}
        />
      </div>

      {/* Weather card */}
      <div
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: 12,
          padding: "20px 24px",
          marginBottom: 24,
          display: "flex",
          gap: 32,
          alignItems: "stretch",
        }}
      >
        {/* Current conditions */}
        <div style={{ minWidth: 160 }}>
          <div
            style={{
              fontSize: "0.7rem",
              fontWeight: 600,
              color: "var(--text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              marginBottom: 8,
            }}
          >
            Current Weather · Yorkshire, UK
          </div>
          {weatherLoading && (
            <div
              style={{
                color: "var(--text-muted)",
                fontSize: "0.85rem",
                paddingTop: 8,
              }}
            >
              Loading weather...
            </div>
          )}
          {weatherError && (
            <div
              style={{ color: "#f87171", fontSize: "0.85rem", paddingTop: 8 }}
            >
              {weatherError}
            </div>
          )}
          {weather &&
            !weatherLoading &&
            (() => {
              const { emoji, description } = weatherInfo(
                weather.current.weather_code,
              );
              return (
                <>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "baseline",
                      gap: 8,
                      marginBottom: 2,
                    }}
                  >
                    <span
                      style={{
                        fontSize: "2.25rem",
                        fontWeight: 800,
                        color: "var(--text-primary)",
                        lineHeight: 1,
                      }}
                    >
                      {Math.round(weather.current.temperature_2m)}°C
                    </span>
                    <span style={{ fontSize: "1.5rem" }}>{emoji}</span>
                  </div>
                  <div
                    style={{
                      fontSize: "0.8rem",
                      color: "var(--text-muted)",
                      marginBottom: 12,
                    }}
                  >
                    {description}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 4,
                      fontSize: "0.78rem",
                      color: "var(--text-muted)",
                    }}
                  >
                    <span>💨 Wind: {weather.current.wind_speed_10m} km/h</span>
                    <span>
                      💧 Humidity: {weather.current.relative_humidity_2m}%
                    </span>
                    <span>🌧️ Precip: {weather.current.precipitation} mm</span>
                  </div>
                </>
              );
            })()}
        </div>

        {/* Divider */}
        <div
          style={{
            width: 1,
            background: "var(--border)",
            flexShrink: 0,
          }}
        />

        {/* 5-day forecast */}
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontSize: "0.7rem",
              fontWeight: 600,
              color: "var(--text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              marginBottom: 8,
            }}
          >
            5-Day Forecast
          </div>
          {weatherLoading && (
            <div
              style={{
                color: "var(--text-muted)",
                fontSize: "0.85rem",
                paddingTop: 8,
              }}
            >
              Loading...
            </div>
          )}
          {weather && !weatherLoading && (
            <div
              style={{
                display: "flex",
                gap: 8,
                height: "calc(100% - 24px)",
                alignItems: "center",
              }}
            >
              {weather.daily.time.map((t, i) => {
                const d = new Date(t + "T12:00:00");
                const day = d.toLocaleDateString("en-GB", { weekday: "short" });
                const { emoji } = weatherInfo(weather.daily.weather_code[i]);
                const hi = Math.round(weather.daily.temperature_2m_max[i]);
                const lo = Math.round(weather.daily.temperature_2m_min[i]);
                return (
                  <div
                    key={t}
                    style={{
                      flex: 1,
                      textAlign: "center",
                      padding: "8px 4px",
                      borderRadius: 8,
                      background: "rgba(255,255,255,0.03)",
                      border: "1px solid var(--border)",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "0.72rem",
                        color: "var(--text-muted)",
                        marginBottom: 4,
                      }}
                    >
                      {day}
                    </div>
                    <div style={{ fontSize: "1.25rem", marginBottom: 4 }}>
                      {emoji}
                    </div>
                    <div
                      style={{
                        fontSize: "0.8rem",
                        fontWeight: 700,
                        color: "var(--text-primary)",
                      }}
                    >
                      {hi}°
                    </div>
                    <div
                      style={{
                        fontSize: "0.72rem",
                        color: "var(--text-muted)",
                      }}
                    >
                      {lo}°
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Charts row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 20,
          marginBottom: 24,
        }}
      >
        {/* Yield chart */}
        <div
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: 12,
            padding: "20px",
          }}
        >
          <div className="section-header">
            <div>
              <div className="section-title">Yield: Actual vs Projected</div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                Harvest 2024/25 · t/ha
              </div>
            </div>
            <TrendingUp size={18} color="var(--accent-green)" />
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={yieldData} style={CHART_STYLE} barGap={4}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.05)"
                vertical={false}
              />
              <XAxis
                dataKey="field"
                tick={{ fill: "#64748b", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "#64748b", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
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

        {/* Sales chart */}
        <div
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: 12,
            padding: "20px",
          }}
        >
          <div className="section-header">
            <div>
              <div className="section-title">Sales by Channel</div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                This week · Shop vs Online
              </div>
            </div>
            <ShoppingCart size={18} color="#a78bfa" />
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={salesByChannel} style={CHART_STYLE} barGap={4}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.05)"
                vertical={false}
              />
              <XAxis
                dataKey="day"
                tick={{ fill: "#64748b", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "#64748b", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `£${v}`}
              />
              <Tooltip
                formatter={(v) =>
                  typeof v === "number" ? `£${v.toFixed(2)}` : String(v)
                }
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
                dataKey="shop"
                name="Farm Shop"
                fill="#a78bfa"
                radius={[4, 4, 0, 0]}
              />
              <Bar
                dataKey="online"
                name="Online"
                fill="#60a5fa"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom row: Tasks + Alerts */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        {/* Pending tasks */}
        <div
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: 12,
            padding: "20px",
          }}
        >
          <div className="section-header">
            <div className="section-title">Upcoming Tasks</div>
            <Link
              href="/operations"
              style={{
                fontSize: "0.8rem",
                color: "var(--accent-green)",
                textDecoration: "none",
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              View all <ArrowRight size={14} />
            </Link>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {pendingTasks.slice(0, 4).map((task) => (
              <div
                key={task.id}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 12,
                  padding: "10px 12px",
                  borderRadius: 8,
                  background: "rgba(255,255,255,0.02)",
                  border: "1px solid var(--border)",
                }}
              >
                <div style={{ marginTop: 2 }}>
                  {task.status === "in-progress" ? (
                    <Clock size={14} color="#fbbf24" />
                  ) : task.priority === "high" ? (
                    <AlertTriangle size={14} color="#f87171" />
                  ) : (
                    <CheckCircle size={14} color="#64748b" />
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontSize: "0.85rem",
                      fontWeight: 500,
                      color: "var(--text-primary)",
                    }}
                  >
                    {task.title}
                  </div>
                  <div
                    style={{
                      fontSize: "0.75rem",
                      color: "var(--text-muted)",
                      marginTop: 2,
                    }}
                  >
                    {task.assignee} · Due{" "}
                    {new Date(task.dueDate).toLocaleDateString("en-GB")}
                    {task.fieldName && ` · ${task.fieldName}`}
                  </div>
                </div>
                <span
                  className={
                    task.priority === "high"
                      ? "badge-red"
                      : task.priority === "medium"
                        ? "badge-amber"
                        : "badge-blue"
                  }
                >
                  {task.priority}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Low stock + sick animals */}
        <div
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            borderRadius: 12,
            padding: "20px",
          }}
        >
          <div className="section-header">
            <div className="section-title">Alerts & Notifications</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {animals
              .filter((a) => a.status === "sick")
              .map((a) => (
                <div
                  key={a.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "10px 12px",
                    borderRadius: 8,
                    background: "rgba(248,113,113,0.06)",
                    border: "1px solid rgba(248,113,113,0.2)",
                  }}
                >
                  <AlertTriangle size={16} color="#f87171" />
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontSize: "0.85rem",
                        fontWeight: 500,
                        color: "var(--text-primary)",
                      }}
                    >
                      Sick animal: {a.earTag}
                    </div>
                    <div
                      style={{
                        fontSize: "0.75rem",
                        color: "var(--text-muted)",
                      }}
                    >
                      {a.breed} {a.species} · {a.group}
                    </div>
                  </div>
                  <Link
                    href="/livestock"
                    style={{
                      fontSize: "0.75rem",
                      color: "#f87171",
                      textDecoration: "none",
                    }}
                  >
                    View →
                  </Link>
                </div>
              ))}
            {lowStock.map((item) => (
              <div
                key={item.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "10px 12px",
                  borderRadius: 8,
                  background: "rgba(251,191,36,0.06)",
                  border: "1px solid rgba(251,191,36,0.2)",
                }}
              >
                <Package size={16} color="#fbbf24" />
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontSize: "0.85rem",
                      fontWeight: 500,
                      color: "var(--text-primary)",
                    }}
                  >
                    Low stock: {item.name}
                  </div>
                  <div
                    style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}
                  >
                    {item.quantity} {item.unit} remaining · Min {item.minStock}
                  </div>
                </div>
                <Link
                  href="/inventory"
                  style={{
                    fontSize: "0.75rem",
                    color: "#fbbf24",
                    textDecoration: "none",
                  }}
                >
                  View →
                </Link>
              </div>
            ))}
            {lowStock.length === 0 &&
              animals.filter((a) => a.status === "sick").length === 0 && (
                <div
                  style={{
                    textAlign: "center",
                    color: "var(--text-muted)",
                    padding: "20px 0",
                    fontSize: "0.875rem",
                  }}
                >
                  <CheckCircle
                    size={28}
                    color="#4ade80"
                    style={{ margin: "0 auto 8px" }}
                  />
                  All clear — no active alerts
                </div>
              )}
          </div>
        </div>
      </div>
    </div>
  );
}




