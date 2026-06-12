"use client";

import { useFarmData } from "@/app/base/hooks/useFarmData";
import {
  type Animal,
  type CropField,
  type SaleRecord,
  type StockItem,
  type Task,
  type YieldRecord,
} from "@/app/base/services/farm-client";
import { useCurrentUser } from "@/app/lib/user-context";
import {
  AlertTriangle,
  ArrowRight,
  Beef,
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  CloudRain,
  Droplets,
  Leaf,
  LineChart,
  Package,
  Plus,
  ShoppingCart,
  Sprout,
  Sun,
  ThermometerSun,
  TrendingDown,
  TrendingUp,
  Wheat,
  Wind,
  Wrench,
} from "lucide-react";
import Link from "next/link";
import type { ComponentType } from "react";
import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
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

type PriorityLevel = "critical" | "high" | "medium" | "low";

type PriorityItem = {
  title: string;
  detail: string;
  level: PriorityLevel;
  due: string;
  href: string;
  action: string;
  icon: ComponentType<{ size?: number; className?: string }>;
};

const severityStyles: Record<PriorityLevel, string> = {
  critical:
    "border-red/30 bg-red/10 text-red shadow-[0_0_0_1px_rgba(239,68,68,0.08)]",
  high: "border-amber/30 bg-amber/10 text-amber shadow-[0_0_0_1px_rgba(245,158,11,0.08)]",
  medium:
    "border-blue/30 bg-blue/10 text-blue shadow-[0_0_0_1px_rgba(96,165,250,0.08)]",
  low: "border-green/30 bg-green/10 text-green shadow-[0_0_0_1px_rgba(34,197,94,0.08)]",
};

const chartGrid = "color-mix(in oklab, var(--stroke-subtle) 70%, transparent)";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatShortDate(date: string) {
  return new Date(`${date}T12:00:00`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
}

function dateDiffDays(date: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(`${date}T00:00:00`);
  return Math.ceil((target.getTime() - today.getTime()) / 86400000);
}

function dueLabel(date: string) {
  const diff = dateDiffDays(date);
  if (diff < 0) return `${Math.abs(diff)}d overdue`;
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  return `${diff}d`;
}

function weatherInfo(code: number) {
  if (code === 0) return { label: "Clear", Icon: Sun };
  if (code <= 3) return { label: "Cloud cover", Icon: CloudRain };
  if (code === 45 || code === 48) return { label: "Fog", Icon: CloudRain };
  if (code >= 51 && code <= 82) return { label: "Rain risk", Icon: CloudRain };
  if (code >= 71 && code <= 86)
    return { label: "Cold front", Icon: ThermometerSun };
  if (code >= 95) return { label: "Storm risk", Icon: AlertTriangle };
  return { label: "Variable", Icon: CloudRain };
}

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function EmptyState({
  title,
  description,
  action,
  href,
}: {
  title: string;
  description: string;
  action: string;
  href: string;
}) {
  return (
    <div className="flex min-h-[220px] flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card-hover/40 p-8 text-center">
      <div className="mb-4 grid h-12 w-12 place-items-center rounded-xl border border-border bg-surface text-green">
        <Leaf size={22} />
      </div>
      <div className="text-sm font-semibold text-primary">{title}</div>
      <p className="mt-1 max-w-sm text-sm leading-6 text-muted">
        {description}
      </p>
      <Link href={href} className="btn-primary mt-5">
        <Plus size={15} />
        {action}
      </Link>
    </div>
  );
}

function SectionTitle({
  eyebrow,
  title,
  action,
  href,
}: {
  eyebrow?: string;
  title: string;
  action?: string;
  href?: string;
}) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <div>
        {eyebrow && (
          <div className="mb-1 text-[0.68rem] font-semibold uppercase tracking-widest text-muted">
            {eyebrow}
          </div>
        )}
        <h2 className="text-lg font-semibold tracking-tight text-primary">
          {title}
        </h2>
      </div>
      {action && href && (
        <Link
          href={href}
          className="hidden items-center gap-1.5 text-sm font-medium text-green no-underline sm:flex"
        >
          {action}
          <ArrowRight size={15} />
        </Link>
      )}
    </div>
  );
}

function ProgressBar({
  label,
  value,
  helper,
  color = "var(--interactive-default)",
}: {
  label: string;
  value: number;
  helper: string;
  color?: string;
}) {
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <div className="text-sm font-medium text-primary">{label}</div>
        <div className="text-sm font-semibold text-primary">{value}/100</div>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-card-hover">
        <div
          className="h-full rounded-full"
          style={{ width: `${value}%`, background: color }}
        />
      </div>
      <div className="mt-1.5 text-xs text-muted">{helper}</div>
    </div>
  );
}

function KpiCard({
  label,
  value,
  context,
  trend,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  context: string;
  trend?: "up" | "down" | "neutral";
  icon: ComponentType<{ size?: number; className?: string }>;
}) {
  const TrendIcon = trend === "down" ? TrendingDown : TrendingUp;
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div className="grid h-10 w-10 place-items-center rounded-lg border border-border bg-card-hover text-green">
          <Icon size={20} />
        </div>
        {trend && (
          <div
            className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold ${
              trend === "down" ? "bg-red/10 text-red" : "bg-green/10 text-green"
            }`}
          >
            <TrendIcon size={13} />
            {trend === "down" ? "Needs review" : "Healthy"}
          </div>
        )}
      </div>
      <div className="text-2xl font-semibold tracking-tight text-primary">
        {value}
      </div>
      <div className="mt-1 text-sm font-medium text-secondary">{label}</div>
      <div className="mt-3 text-xs leading-5 text-muted">{context}</div>
    </div>
  );
}

export default function DashboardPage() {
  const currentUser = useCurrentUser();
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
      "https://api.open-meteo.com/v1/forecast?latitude=53.95&longitude=-1.08&current=temperature_2m,weather_code,wind_speed_10m,relative_humidity_2m,precipitation&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum&forecast_days=5&timezone=Europe%2FLondon"
    )
      .then((response) => response.json())
      .then((weatherData: WeatherData) => {
        setWeather(weatherData);
        setWeatherLoading(false);
      })
      .catch(() => {
        setWeatherError("Weather guidance is unavailable right now.");
        setWeatherLoading(false);
      });
  }, []);

  const today = new Date().toISOString().slice(0, 10);
  const activeFields = fields.filter((field) => field.status !== "fallow");
  const sickAnimals = animals.filter(
    (animal) => animal.status === "sick" || animal.status === "quarantine"
  );
  const liveAnimals = animals.filter(
    (animal) => animal.status !== "deceased" && animal.status !== "sold"
  );
  const lowStock = stock.filter((item) => item.quantity <= item.minStock);
  const pendingTasks = tasks
    .filter((task) => task.status !== "done")
    .sort((a, b) => dateDiffDays(a.dueDate) - dateDiffDays(b.dueDate));
  const todayTasks = pendingTasks.filter(
    (task) => dateDiffDays(task.dueDate) <= 0
  );
  const onlineSalesToday = sales.filter(
    (sale) => sale.date === today && sale.channel === "online"
  );

  const lastSevenSales = sales
    .filter(
      (sale) => dateDiffDays(sale.date) >= -6 && dateDiffDays(sale.date) <= 0
    )
    .reduce((sum, sale) => sum + sale.total, 0);
  const previousSevenSales = sales
    .filter(
      (sale) => dateDiffDays(sale.date) >= -13 && dateDiffDays(sale.date) <= -7
    )
    .reduce((sum, sale) => sum + sale.total, 0);
  const salesTrend =
    previousSevenSales > 0
      ? ((lastSevenSales - previousSevenSales) / previousSevenSales) * 100
      : lastSevenSales > 0
      ? 100
      : 0;

  const priorities = useMemo<PriorityItem[]>(() => {
    const items: PriorityItem[] = [];

    if (sickAnimals.length > 0) {
      items.push({
        title: `${sickAnimals.length} animal${
          sickAnimals.length === 1 ? "" : "s"
        } require health checks`,
        detail: sickAnimals
          .slice(0, 3)
          .map((animal) => animal.earTag)
          .join(", "),
        level: "critical",
        due: "Today",
        href: "/livestock",
        action: "Review animals",
        icon: Beef,
      });
    }

    const highTasks = pendingTasks.filter((task) => task.priority === "high");
    if (highTasks.length > 0) {
      items.push({
        title: `${highTasks.length} high-priority operation${
          highTasks.length === 1 ? "" : "s"
        } pending`,
        detail: highTasks[0].title,
        level: "high",
        due: dueLabel(highTasks[0].dueDate),
        href: "/operations",
        action: "Open tasks",
        icon: ClipboardCheck,
      });
    }

    if (lowStock.length > 0) {
      items.push({
        title: `${lowStock.length} inventory item${
          lowStock.length === 1 ? "" : "s"
        } below threshold`,
        detail: lowStock
          .slice(0, 3)
          .map((item) => item.name)
          .join(", "),
        level: "high",
        due: "Restock",
        href: "/inventory",
        action: "Update stock",
        icon: Package,
      });
    }

    if (todayTasks.length > 0) {
      items.push({
        title: `${todayTasks.length} operation${
          todayTasks.length === 1 ? "" : "s"
        } due today`,
        detail: todayTasks[0].title,
        level: "medium",
        due: "Today",
        href: "/operations",
        action: "Plan work",
        icon: Wrench,
      });
    }

    const plantedFields = fields.filter((field) => field.status === "planted");
    if (plantedFields.length > 0) {
      items.push({
        title: `${plantedFields.length} field${
          plantedFields.length === 1 ? "" : "s"
        } need establishment review`,
        detail: plantedFields
          .slice(0, 2)
          .map((field) => field.name)
          .join(", "),
        level: "medium",
        due: "This week",
        href: "/crops",
        action: "Inspect fields",
        icon: Wheat,
      });
    }

    if (onlineSalesToday.length > 0) {
      items.push({
        title: `${onlineSalesToday.length} online order${
          onlineSalesToday.length === 1 ? "" : "s"
        } to fulfil`,
        detail: `${formatCurrency(
          onlineSalesToday.reduce((sum, sale) => sum + sale.total, 0)
        )} booked today`,
        level: "low",
        due: "Today",
        href: "/shop",
        action: "Open POS",
        icon: ShoppingCart,
      });
    }

    return items.slice(0, 5);
  }, [
    fields,
    lowStock,
    onlineSalesToday,
    pendingTasks,
    sickAnimals,
    todayTasks,
  ]);

  const weatherRecommendations = (() => {
    if (!weather) return [];

    const tomorrowRain = weather.daily.precipitation_sum[1] ?? 0;
    const coldest = Math.min(...weather.daily.temperature_2m_min);
    const windy = weather.current.wind_speed_10m >= 24;
    const dryWindow =
      weather.daily.precipitation_sum.slice(0, 3).every((rain) => rain < 1) &&
      weather.current.relative_humidity_2m < 75;
    const recommendations = [];

    if (windy) {
      recommendations.push({
        title: "Delay spraying",
        detail: `Wind is ${Math.round(weather.current.wind_speed_10m)} km/h.`,
        level: "high" as PriorityLevel,
      });
    }

    if (tomorrowRain >= 5) {
      recommendations.push({
        title: "Rain expected tomorrow",
        detail: `${tomorrowRain.toFixed(
          1
        )} mm forecast. Bring forward harvest, handling, or yard work.`,
        level: "medium" as PriorityLevel,
      });
    }

    if (coldest <= 1) {
      recommendations.push({
        title: "Frost watch",
        detail: `Low of ${Math.round(coldest)}C in the 5-day outlook.`,
        level: "high" as PriorityLevel,
      });
    }

    if (dryWindow) {
      recommendations.push({
        title: "Good fieldwork window",
        detail:
          "Low rainfall over the next 72 hours. Prioritise drilling, inspections, or irrigation checks.",
        level: "low" as PriorityLevel,
      });
    }

    if (recommendations.length === 0) {
      recommendations.push({
        title: "Normal operating conditions",
        detail: "No major weather constraints detected for the next 24 hours.",
        level: "low" as PriorityLevel,
      });
    }

    return recommendations.slice(0, 3);
  })();

  const cropScore = fields.length
    ? clampScore(
        100 -
          (fields.filter((field) => field.status === "fallow").length /
            fields.length) *
            24
      )
    : 72;
  const livestockScore = liveAnimals.length
    ? clampScore(100 - (sickAnimals.length / liveAnimals.length) * 70)
    : 74;
  const inventoryScore = stock.length
    ? clampScore(100 - (lowStock.length / stock.length) * 80)
    : 70;
  const salesScore = clampScore(70 + Math.min(25, salesTrend / 2));
  const farmHealth = clampScore(
    (cropScore + livestockScore + inventoryScore + salesScore) / 4
  );

  const yieldData = (() => {
    const byField = new Map<string, YieldRecord>();
    for (const record of yieldRecords) {
      const existing = byField.get(record.fieldName);
      if (!existing || record.year > existing.year) {
        byField.set(record.fieldName, record);
      }
    }
    return Array.from(byField.values()).map((record) => ({
      field: record.fieldName.split(" ")[0],
      Projected: record.projected,
      Actual: record.actual,
    }));
  })();

  const revenueTrendData = Array.from({ length: 7 }, (_, index) => {
    const day = new Date();
    day.setDate(day.getDate() - 6 + index);
    const date = day.toISOString().slice(0, 10);
    return {
      day: day.toLocaleDateString("en-GB", { weekday: "short" }),
      Revenue: sales
        .filter((sale) => sale.date === date)
        .reduce((sum, sale) => sum + sale.total, 0),
    };
  });

  const salesChannelData = [
    {
      name: "Shop",
      value: sales
        .filter((sale) => sale.channel === "shop")
        .reduce((sum, sale) => sum + sale.total, 0),
      color: "var(--interactive-default)",
    },
    {
      name: "Online",
      value: sales
        .filter((sale) => sale.channel === "online")
        .reduce((sum, sale) => sum + sale.total, 0),
      color: "var(--feedback-info)",
    },
  ].filter((item) => item.value > 0);

  const inventoryConsumptionData = stock
    .slice()
    .sort(
      (a, b) =>
        a.quantity / Math.max(a.minStock, 1) -
        b.quantity / Math.max(b.minStock, 1)
    )
    .slice(0, 6)
    .map((item) => ({
      name: item.name.split(" ")[0],
      Stock: item.quantity,
      Minimum: item.minStock,
    }));

  const recentActivity = [
    ...sales.slice(-4).map((sale) => ({
      key: `sale-${sale.id}`,
      title: "Sale recorded",
      detail: `${formatCurrency(sale.total)} through ${sale.channel}`,
      time: formatShortDate(sale.date),
      icon: ShoppingCart,
      href: "/shop",
    })),
    ...stock.slice(-4).map((item) => ({
      key: `stock-${item.id}`,
      title: "Inventory updated",
      detail: `${item.name} now ${item.quantity} ${item.unit}`,
      time: formatShortDate(item.updatedAt),
      icon: Package,
      href: "/inventory",
    })),
    ...yieldRecords.slice(-3).map((record) => ({
      key: `yield-${record.id}`,
      title: "Harvest record logged",
      detail: `${record.fieldName}: ${record.actual} ${record.unit}`,
      time: String(record.year),
      icon: Wheat,
      href: "/crops",
    })),
    ...tasks
      .filter((task) => task.status === "done")
      .slice(-3)
      .map((task) => ({
        key: `task-${task.id}`,
        title: "Task completed",
        detail: task.title,
        time: formatShortDate(task.dueDate),
        icon: CheckCircle2,
        href: "/operations",
      })),
  ]
    .slice(-7)
    .reverse();

  const quickActions = [
    { label: "Add Harvest", href: "/crops", icon: Wheat },
    { label: "Record Sale", href: "/shop", icon: ShoppingCart },
    { label: "Add Livestock", href: "/livestock", icon: Beef },
    { label: "Update Inventory", href: "/inventory", icon: Package },
    { label: "Create Task", href: "/operations", icon: ClipboardCheck },
  ];

  const WeatherIcon = weather
    ? weatherInfo(weather.current.weather_code).Icon
    : CloudRain;

  return (
    <div className="min-h-screen bg-background px-4 py-6 text-primary sm:px-6 lg:px-8 lg:py-8">
      <div className="mx-auto flex max-w-[1500px] flex-col gap-8">
        <header className="flex flex-col gap-5 rounded-2xl border border-border bg-[linear-gradient(135deg,color-mix(in_oklab,var(--canvas-surface-01)_94%,var(--interactive-default)_6%),var(--canvas-surface-02))] p-5 shadow-[0_20px_80px_rgba(0,0,0,0.16)] sm:p-6 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-secondary">
              <Leaf size={14} className="text-green" />
              {currentUser?.farm.location ?? "Location not set"}
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-primary sm:text-3xl">
              Good morning, {currentUser?.farm.name ?? "Farm workspace"}
            </h1>
            <p className="mt-2 text-sm text-muted">
              {new Date().toLocaleDateString("en-GB", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
              {currentUser?.farm.acreage
                ? ` - ${currentUser.farm.acreage} acres under management`
                : ""}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap xl:justify-end">
            {quickActions.map(({ label, href, icon: Icon }) => (
              <Link
                href={href}
                key={label}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium text-secondary no-underline transition-colors hover:border-green hover:text-green"
              >
                <Icon size={15} />
                {label}
              </Link>
            ))}
          </div>
        </header>

        <section className="grid gap-5 xl:grid-cols-[1.35fr_0.65fr]">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-[0_16px_60px_rgba(0,0,0,0.14)] sm:p-6">
            <SectionTitle
              eyebrow="Today"
              title="Priorities that need a decision"
              action="Open operations"
              href="/operations"
            />
            {priorities.length > 0 ? (
              <div className="grid gap-3">
                {priorities.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={`${item.title}-${item.due}`}
                      className={`grid gap-4 rounded-xl border p-4 sm:grid-cols-[auto_1fr_auto] sm:items-center ${
                        severityStyles[item.level]
                      }`}
                    >
                      <div className="grid h-11 w-11 place-items-center rounded-xl bg-current/10">
                        <Icon size={21} className="text-current" />
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-semibold text-primary">
                            {item.title}
                          </span>
                          <span className="rounded-full bg-surface px-2 py-0.5 text-[0.68rem] font-semibold uppercase tracking-wider text-muted">
                            {item.level}
                          </span>
                        </div>
                        <p className="mt-1 text-sm leading-5 text-secondary">
                          {item.detail}
                        </p>
                      </div>
                      <div className="flex items-center justify-between gap-3 sm:justify-end">
                        <div className="text-right text-xs font-medium text-muted">
                          Due {item.due}
                        </div>
                        <Link href={item.href} className="btn-primary">
                          {item.action}
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-xl border border-border bg-card-hover/50 p-8 text-center">
                <CheckCircle2 size={34} className="mx-auto mb-3 text-green" />
                <div className="text-sm font-semibold text-primary">
                  No urgent exceptions for today
                </div>
                <p className="mt-1 text-sm text-muted">
                  Weather, livestock, inventory, and open operations are all
                  within normal thresholds.
                </p>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 sm:p-6">
            <SectionTitle eyebrow="Score" title="Farm Health" />
            <div className="mb-6 flex items-end gap-3">
              <div className="text-5xl font-semibold tracking-tight text-primary">
                {farmHealth}
              </div>
              <div className="pb-1 text-sm text-muted">
                /100 operating score
              </div>
            </div>
            <div className="grid gap-4">
              <ProgressBar
                label="Crop Health"
                value={cropScore}
                helper={`${activeFields.length} active fields`}
              />
              <ProgressBar
                label="Livestock Health"
                value={livestockScore}
                helper={`${sickAnimals.length} animal exceptions`}
                color="var(--feedback-info)"
              />
              <ProgressBar
                label="Inventory Status"
                value={inventoryScore}
                helper={`${lowStock.length} low-stock items`}
                color="var(--feedback-warning)"
              />
              <ProgressBar
                label="Sales Performance"
                value={salesScore}
                helper={`${salesTrend >= 0 ? "+" : ""}${salesTrend.toFixed(
                  0
                )}% vs previous week`}
                color="var(--utility-purple)"
              />
            </div>
          </div>
        </section>

        <section className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-2xl border border-border bg-card p-5 sm:p-6">
            <SectionTitle
              eyebrow="Weather"
              title="Smart Weather Center"
              action="Review fields"
              href="/crops"
            />
            {weatherLoading && (
              <div className="rounded-xl border border-border bg-card-hover/40 p-8 text-sm text-muted">
                Loading farm weather guidance...
              </div>
            )}
            {weatherError && (
              <div className="rounded-xl border border-red/30 bg-red/10 p-4 text-sm text-red">
                {weatherError}
              </div>
            )}
            {weather && !weatherLoading && (
              <div className="grid gap-5">
                <div className="flex items-center justify-between rounded-xl border border-border bg-card-hover/40 p-4">
                  <div>
                    <div className="text-sm font-medium text-secondary">
                      Current conditions
                    </div>
                    <div className="mt-1 flex items-end gap-2">
                      <span className="text-4xl font-semibold text-primary">
                        {Math.round(weather.current.temperature_2m)}C
                      </span>
                      <span className="pb-1 text-sm text-muted">
                        {weatherInfo(weather.current.weather_code).label}
                      </span>
                    </div>
                  </div>
                  <div className="grid h-14 w-14 place-items-center rounded-2xl bg-surface text-green">
                    <WeatherIcon size={28} />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div className="rounded-xl border border-border bg-surface p-3">
                    <Wind size={16} className="mb-2 text-muted" />
                    <div className="font-semibold text-primary">
                      {Math.round(weather.current.wind_speed_10m)} km/h
                    </div>
                    <div className="text-xs text-muted">Wind</div>
                  </div>
                  <div className="rounded-xl border border-border bg-surface p-3">
                    <Droplets size={16} className="mb-2 text-muted" />
                    <div className="font-semibold text-primary">
                      {weather.current.relative_humidity_2m}%
                    </div>
                    <div className="text-xs text-muted">Humidity</div>
                  </div>
                  <div className="rounded-xl border border-border bg-surface p-3">
                    <CloudRain size={16} className="mb-2 text-muted" />
                    <div className="font-semibold text-primary">
                      {weather.current.precipitation} mm
                    </div>
                    <div className="text-xs text-muted">Precip</div>
                  </div>
                </div>

                <div className="grid grid-cols-5 gap-2">
                  {weather.daily.time.map((date, index) => {
                    const day = new Date(`${date}T12:00:00`).toLocaleDateString(
                      "en-GB",
                      { weekday: "short" }
                    );
                    const rain = weather.daily.precipitation_sum[index];
                    const max = Math.round(
                      weather.daily.temperature_2m_max[index]
                    );
                    const min = Math.round(
                      weather.daily.temperature_2m_min[index]
                    );
                    return (
                      <div
                        key={date}
                        className="rounded-xl border border-border bg-surface p-3 text-center"
                      >
                        <div className="text-xs font-medium text-muted">
                          {day}
                        </div>
                        <div className="mt-2 text-sm font-semibold text-primary">
                          {max}/{min}C
                        </div>
                        <div
                          className="mx-auto mt-3 h-14 w-2 overflow-hidden rounded-full bg-card-hover"
                          title={`${rain} mm rain`}
                        >
                          <div
                            className="mt-auto rounded-full bg-blue"
                            style={{ height: `${Math.min(100, rain * 16)}%` }}
                          />
                        </div>
                        <div className="mt-2 text-[0.68rem] text-muted">
                          {rain.toFixed(1)} mm
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="grid gap-2">
                  {weatherRecommendations.map((recommendation) => (
                    <div
                      key={recommendation.title}
                      className={`rounded-lg border px-3 py-2 text-sm ${
                        severityStyles[recommendation.level]
                      }`}
                    >
                      <div className="font-semibold text-primary">
                        {recommendation.title}
                      </div>
                      <div className="mt-0.5 text-xs leading-5 text-secondary">
                        {recommendation.detail}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="grid gap-5">
            <div>
              <SectionTitle eyebrow="Snapshot" title="Operational overview" />
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <KpiCard
                  label="Active Acres"
                  value={activeFields.reduce(
                    (sum, field) => sum + field.acres,
                    0
                  )}
                  context={`${activeFields.length} fields in production`}
                  trend={activeFields.length > 0 ? "up" : "neutral"}
                  icon={Sprout}
                />
                <KpiCard
                  label="Livestock Count"
                  value={liveAnimals.length}
                  context={`${sickAnimals.length} require attention`}
                  trend={sickAnimals.length > 0 ? "down" : "up"}
                  icon={Beef}
                />
                <KpiCard
                  label="Inventory Health"
                  value={`${inventoryScore}%`}
                  context={`${stock.length - lowStock.length}/${
                    stock.length || 0
                  } lines above minimum`}
                  trend={lowStock.length > 0 ? "down" : "up"}
                  icon={Package}
                />
                <KpiCard
                  label="Weekly Revenue"
                  value={formatCurrency(lastSevenSales)}
                  context={`${salesTrend >= 0 ? "+" : ""}${salesTrend.toFixed(
                    0
                  )}% vs previous 7 days`}
                  trend={salesTrend >= 0 ? "up" : "down"}
                  icon={ShoppingCart}
                />
              </div>
            </div>

            <div className="grid gap-5 lg:grid-cols-2">
              <div className="rounded-2xl border border-border bg-card p-5">
                <SectionTitle title="Recent activity" />
                {recentActivity.length > 0 ? (
                  <div className="space-y-3">
                    {recentActivity.slice(0, 6).map((activity) => {
                      const Icon = activity.icon;
                      return (
                        <Link
                          key={activity.key}
                          href={activity.href}
                          className="flex items-start gap-3 rounded-xl border border-transparent p-2 no-underline transition-colors hover:border-border hover:bg-card-hover/60"
                        >
                          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-card-hover text-green">
                            <Icon size={17} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-medium text-primary">
                              {activity.title}
                            </div>
                            <div className="truncate text-xs text-muted">
                              {activity.detail}
                            </div>
                          </div>
                          <div className="text-xs text-muted">
                            {activity.time}
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                ) : (
                  <EmptyState
                    title="No activity yet"
                    description="Record sales, harvests, stock movements, or completed work to build an operational timeline."
                    action="Record sale"
                    href="/shop"
                  />
                )}
              </div>

              <div className="rounded-2xl border border-border bg-card p-5">
                <SectionTitle
                  title="Upcoming tasks"
                  action="Manage tasks"
                  href="/operations"
                />
                {pendingTasks.length > 0 ? (
                  <div className="space-y-3">
                    {pendingTasks.slice(0, 6).map((task) => (
                      <div
                        key={task.id}
                        className="rounded-xl border border-border bg-surface p-3"
                      >
                        <div className="mb-2 flex items-start justify-between gap-3">
                          <div className="text-sm font-semibold text-primary">
                            {task.title}
                          </div>
                          <span
                            className={`rounded-md px-2 py-0.5 text-[0.68rem] font-semibold uppercase ${
                              task.priority === "high"
                                ? "bg-red/10 text-red"
                                : task.priority === "medium"
                                ? "bg-amber/10 text-amber"
                                : "bg-blue/10 text-blue"
                            }`}
                          >
                            {task.priority}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-xs text-muted">
                          <span className="inline-flex items-center gap-1">
                            <CalendarClock size={13} />
                            {dueLabel(task.dueDate)}
                          </span>
                          <span>{task.assignee}</span>
                          {task.fieldName && <span>{task.fieldName}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    title="No open tasks"
                    description="Create recurring jobs for field inspections, maintenance, livestock checks, and fulfilment."
                    action="Create task"
                    href="/operations"
                  />
                )}
              </div>
            </div>
          </div>
        </section>

        <section>
          <SectionTitle
            eyebrow="Analytics"
            title="Trends and performance"
            action="Open finance"
            href="/finance"
          />
          <div className="grid gap-5 xl:grid-cols-2">
            <div className="rounded-2xl border border-border bg-card p-5">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-primary">
                    Yield vs projection
                  </div>
                  <div className="text-xs text-muted">
                    Latest harvest records
                  </div>
                </div>
                <Wheat size={18} className="text-green" />
              </div>
              {yieldData.length > 0 ? (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={yieldData} barGap={5}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke={chartGrid}
                      vertical={false}
                    />
                    <XAxis
                      dataKey="field"
                      tick={{ fill: "var(--content-muted)", fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: "var(--content-muted)", fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "var(--bg-card)",
                        border: "1px solid var(--border)",
                        borderRadius: 10,
                        color: "var(--text-primary)",
                      }}
                    />
                    <Bar
                      dataKey="Projected"
                      fill="var(--stroke-strong)"
                      radius={[5, 5, 0, 0]}
                    />
                    <Bar
                      dataKey="Actual"
                      fill="var(--interactive-default)"
                      radius={[5, 5, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <EmptyState
                  title="No harvest data yet"
                  description="Record your first harvest to start tracking yield performance against projections."
                  action="Record harvest"
                  href="/crops"
                />
              )}
            </div>

            <div className="rounded-2xl border border-border bg-card p-5">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-primary">
                    Revenue trend
                  </div>
                  <div className="text-xs text-muted">Last 7 days</div>
                </div>
                <LineChart size={18} className="text-blue" />
              </div>
              {sales.length > 0 ? (
                <ResponsiveContainer width="100%" height={260}>
                  <AreaChart data={revenueTrendData}>
                    <defs>
                      <linearGradient
                        id="revenueFill"
                        x1="0"
                        x2="0"
                        y1="0"
                        y2="1"
                      >
                        <stop
                          offset="0%"
                          stopColor="var(--interactive-default)"
                          stopOpacity={0.32}
                        />
                        <stop
                          offset="100%"
                          stopColor="var(--interactive-default)"
                          stopOpacity={0.02}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke={chartGrid}
                      vertical={false}
                    />
                    <XAxis
                      dataKey="day"
                      tick={{ fill: "var(--content-muted)", fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: "var(--content-muted)", fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(value) => `£${value}`}
                    />
                    <Tooltip
                      formatter={(value) =>
                        typeof value === "number"
                          ? formatCurrency(value)
                          : value
                      }
                      contentStyle={{
                        background: "var(--bg-card)",
                        border: "1px solid var(--border)",
                        borderRadius: 10,
                        color: "var(--text-primary)",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="Revenue"
                      stroke="var(--interactive-default)"
                      fill="url(#revenueFill)"
                      strokeWidth={2.5}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <EmptyState
                  title="No sales recorded"
                  description="Record farm shop or online sales to see revenue trends and channel performance."
                  action="Record sale"
                  href="/shop"
                />
              )}
            </div>

            <div className="rounded-2xl border border-border bg-card p-5">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-primary">
                    Sales channels
                  </div>
                  <div className="text-xs text-muted">
                    Shop vs online revenue
                  </div>
                </div>
                <ShoppingCart size={18} className="text-purple" />
              </div>
              {salesChannelData.length > 0 ? (
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie
                      data={salesChannelData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={88}
                      paddingAngle={4}
                    >
                      {salesChannelData.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) =>
                        typeof value === "number"
                          ? formatCurrency(value)
                          : value
                      }
                      contentStyle={{
                        background: "var(--bg-card)",
                        border: "1px solid var(--border)",
                        borderRadius: 10,
                        color: "var(--text-primary)",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <EmptyState
                  title="No channel data"
                  description="Record sales through Shop & POS to compare direct and online performance."
                  action="Open POS"
                  href="/shop"
                />
              )}
            </div>

            <div className="rounded-2xl border border-border bg-card p-5">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-primary">
                    Inventory consumption
                  </div>
                  <div className="text-xs text-muted">
                    Lowest coverage lines
                  </div>
                </div>
                <Package size={18} className="text-amber" />
              </div>
              {inventoryConsumptionData.length > 0 ? (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={inventoryConsumptionData} layout="vertical">
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke={chartGrid}
                      horizontal={false}
                    />
                    <XAxis
                      type="number"
                      tick={{ fill: "var(--content-muted)", fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      dataKey="name"
                      type="category"
                      width={72}
                      tick={{ fill: "var(--content-muted)", fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "var(--bg-card)",
                        border: "1px solid var(--border)",
                        borderRadius: 10,
                        color: "var(--text-primary)",
                      }}
                    />
                    <Bar
                      dataKey="Minimum"
                      fill="var(--stroke-strong)"
                      radius={[0, 5, 5, 0]}
                    />
                    <Bar
                      dataKey="Stock"
                      fill="var(--feedback-warning)"
                      radius={[0, 5, 5, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <EmptyState
                  title="No inventory lines"
                  description="Add stock items and minimum thresholds to monitor coverage and consumption."
                  action="Add inventory"
                  href="/inventory"
                />
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
