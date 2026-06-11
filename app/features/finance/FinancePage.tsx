"use client";

import {
  Banknote,
  BarChart2,
  Plus,
  Receipt,
  Trash2,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import Modal from "@/app/abstract/ui/Modal";
import StatCard from "@/app/abstract/ui/StatCard";
import { useFarmData } from "@/app/base/hooks/useFarmData";
import {
  deleteData,
  generateId,
  saveData,
  type ExpenseRecord,
  type SaleRecord,
} from "@/app/base/services/farm-client";

const FINANCE_ENTITIES = {
  expenses: "expenses",
  sales: "sales",
} as const;

type Tab = "overview" | "expenses" | "pl-report";

const EXPENSE_CATEGORIES: ExpenseRecord["category"][] = [
  "labour",
  "fuel",
  "chemicals",
  "seeds",
  "repairs",
  "vet",
  "rent",
  "machinery",
  "utilities",
  "other",
];

const CATEGORY_COLORS: Record<ExpenseRecord["category"], string> = {
  labour: "#60a5fa",
  fuel: "#fbbf24",
  chemicals: "#a78bfa",
  seeds: "#4ade80",
  repairs: "#f87171",
  vet: "#2dd4bf",
  rent: "#fb923c",
  machinery: "#38bdf8",
  utilities: "#818cf8",
  other: "#64748b",
};

const CATEGORY_BADGE_CLASS: Partial<Record<ExpenseRecord["category"], string>> =
  {
    labour: "badge-blue",
    fuel: "badge-amber",
    chemicals: "badge-purple",
    seeds: "badge-green",
    repairs: "badge-red",
    rent: "badge-amber",
    machinery: "badge-blue",
  };

function CategoryBadge({ category }: { category: ExpenseRecord["category"] }) {
  const cls = CATEGORY_BADGE_CLASS[category];
  if (cls) return <span className={cls}>{category}</span>;
  if (category === "vet" || category === "utilities") {
    return (
      <span
        style={{
          background: "rgba(45,212,191,0.15)",
          color: "#2dd4bf",
          border: "1px solid rgba(45,212,191,0.3)",
          padding: "2px 10px",
          borderRadius: 999,
          fontSize: "0.75rem",
          fontWeight: 500,
        }}
      >
        {category}
      </span>
    );
  }
  return (
    <span
      style={{
        background: "rgba(100,116,139,0.15)",
        color: "#64748b",
        border: "1px solid rgba(100,116,139,0.3)",
        padding: "2px 10px",
        borderRadius: 999,
        fontSize: "0.75rem",
        fontWeight: 500,
      }}
    >
      {category}
    </span>
  );
}

function getLast6Months(): string[] {
  const months: string[] = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
    );
  }
  return months;
}

function formatMonth(yyyyMM: string): string {
  const d = new Date(yyyyMM + "-01");
  return d.toLocaleDateString("en-GB", { month: "short", year: "2-digit" });
}

const fmtGbp = (v: unknown) =>
  typeof v === "number" ? `£${v.toFixed(2)}` : String(v);

export default function FinancePage() {
  const [tab, setTab] = useState<Tab>("overview");
  const { data, reload: load } = useFarmData(FINANCE_ENTITIES);
  const expenses = data.expenses as ExpenseRecord[];
  const sales = data.sales as SaleRecord[];
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [expenseForm, setExpenseForm] = useState<Partial<ExpenseRecord>>({
    date: new Date().toISOString().slice(0, 10),
    category: "other",
  });
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<
    ExpenseRecord["category"] | ""
  >("");

  const saveExpense = async () => {
    if (!expenseForm.description || !expenseForm.amount) return;
    await saveData("expenses", {
      id: generateId(),
      date: new Date().toISOString().slice(0, 10),
      category: "other" as const,
      description: "",
      amount: 0,
      ...expenseForm,
    } as ExpenseRecord);
    await load();
    setShowAddExpense(false);
    setExpenseForm({
      date: new Date().toISOString().slice(0, 10),
      category: "other",
    });
  };

  const handleDeleteExpense = async (id: string) => {
    await deleteData("expenses", id);
    await load();
  };

  // ── KPIs ──────────────────────────────────────────────────────────────────
  const totalRevenue = sales.reduce((s, r) => s + r.total, 0);
  const totalExpensesAmt = expenses.reduce((s, e) => s + e.amount, 0);
  const netPnL = totalRevenue - totalExpensesAmt;
  const profitMargin = totalRevenue > 0 ? (netPnL / totalRevenue) * 100 : 0;

  // ── Overview: last-6-month bar chart ──────────────────────────────────────
  const last6Months = getLast6Months();
  const monthlyOverviewData = last6Months.map((month) => ({
    month: formatMonth(month),
    Revenue: sales
      .filter((s) => s.date.slice(0, 7) === month)
      .reduce((s, r) => s + r.total, 0),
    Expenses: expenses
      .filter((e) => e.date.slice(0, 7) === month)
      .reduce((s, e) => s + e.amount, 0),
  }));

  // ── Overview: expense category breakdown (current year) ───────────────────
  const currentYear = new Date().getFullYear().toString();
  const categoryBreakdown = EXPENSE_CATEGORIES.map((cat) => ({
    name: cat,
    value: expenses
      .filter((e) => e.category === cat && e.date.startsWith(currentYear))
      .reduce((s, e) => s + e.amount, 0),
  })).filter((c) => c.value > 0);

  // ── Expenses tab: filtered list ───────────────────────────────────────────
  const filteredExpenses = expenses
    .filter((e) => {
      const q = search.toLowerCase();
      if (
        q &&
        !e.description.toLowerCase().includes(q) &&
        !(e.supplier ?? "").toLowerCase().includes(q) &&
        !(e.invoiceRef ?? "").toLowerCase().includes(q)
      )
        return false;
      if (categoryFilter && e.category !== categoryFilter) return false;
      return true;
    })
    .sort((a, b) => b.date.localeCompare(a.date));

  const filteredTotal = filteredExpenses.reduce((s, e) => s + e.amount, 0);

  // ── P&L report: monthly data (all months with any data) ───────────────────
  const allMonths = [
    ...new Set([
      ...sales.map((s) => s.date.slice(0, 7)),
      ...expenses.map((e) => e.date.slice(0, 7)),
    ]),
  ].sort();

  type PlRow = Record<string, string | number>;

  const plMonthlyData: PlRow[] = allMonths.map((month) => {
    const revenue = sales
      .filter((s) => s.date.slice(0, 7) === month)
      .reduce((s, r) => s + r.total, 0);
    const row: PlRow = { month: formatMonth(month), revenue };
    EXPENSE_CATEGORIES.forEach((cat) => {
      row[cat] = expenses
        .filter((e) => e.category === cat && e.date.slice(0, 7) === month)
        .reduce((s, e) => s + e.amount, 0);
    });
    const totalExp = EXPENSE_CATEGORIES.reduce(
      (s, c) => s + ((row[c] as number) || 0),
      0,
    );
    row.totalExpenses = totalExp;
    row.netPnL = revenue - totalExp;
    row.margin = revenue > 0 ? ((revenue - totalExp) / revenue) * 100 : 0;
    return row;
  });

  return (
    <div style={{ padding: "32px 32px 48px" }}>
      {/* ── Page Header ─────────────────────────────────────────────────── */}
      <div style={{ marginBottom: 28 }}>
        <h1
          style={{
            fontSize: "1.6rem",
            fontWeight: 800,
            color: "var(--text-primary)",
            letterSpacing: "-0.02em",
          }}
        >
          💰 Finance &amp; Costs
        </h1>
        <p
          style={{
            color: "var(--text-muted)",
            fontSize: "0.875rem",
            marginTop: 4,
          }}
        >
          Revenue tracking, expense management, and profit &amp; loss reporting
        </p>
      </div>

      {/* ── KPI StatCards ───────────────────────────────────────────────── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 14,
          marginBottom: 24,
        }}
      >
        <StatCard
          label="Total Revenue"
          value={`£${totalRevenue.toFixed(2)}`}
          icon={TrendingUp}
          color="#60a5fa"
          delay={0}
        />
        <StatCard
          label="Total Expenses"
          value={`£${totalExpensesAmt.toFixed(2)}`}
          icon={Receipt}
          color="#f87171"
          delay={60}
        />
        <StatCard
          label="Net P&L"
          value={`${netPnL >= 0 ? "+" : ""}£${netPnL.toFixed(2)}`}
          icon={netPnL >= 0 ? Banknote : TrendingDown}
          color={netPnL >= 0 ? "#4ade80" : "#f87171"}
          delay={120}
        />
        <StatCard
          label="Profit Margin"
          value={`${profitMargin.toFixed(1)}%`}
          icon={BarChart2}
          color="#fbbf24"
          delay={180}
        />
      </div>

      {/* ── Tab Bar ─────────────────────────────────────────────────────── */}
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
            ["overview", "📊 Overview"],
            ["expenses", "🧾 Expenses"],
            ["pl-report", "📈 P&L Report"],
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
              background:
                tab === t ? "rgba(45,212,191,0.15)" : "transparent",
              color: tab === t ? "#2dd4bf" : "var(--text-secondary)",
              transition: "all 0.15s",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ════════════════════════════════════════════════════════════════════
          OVERVIEW TAB
      ════════════════════════════════════════════════════════════════════ */}
      {tab === "overview" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Monthly Revenue vs Expenses */}
          <div
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              padding: 20,
            }}
          >
            <div className="section-header">
              <div>
                <div className="section-title">Monthly Revenue vs Expenses</div>
                <div
                  style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}
                >
                  Last 6 months · £
                </div>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={monthlyOverviewData} barGap={6}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(255,255,255,0.05)"
                  vertical={false}
                />
                <XAxis
                  dataKey="month"
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
                  formatter={fmtGbp}
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
                <Bar dataKey="Revenue" fill="#60a5fa" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Expenses" fill="#f87171" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Category breakdown: pie + bar list */}
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}
          >
            {/* Pie chart */}
            <div
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
                borderRadius: 12,
                padding: 20,
              }}
            >
              <div className="section-header">
                <div>
                  <div className="section-title">Expenses by Category</div>
                  <div
                    style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}
                  >
                    Current year · £
                  </div>
                </div>
              </div>
              {categoryBreakdown.length === 0 ? (
                <div
                  style={{
                    color: "var(--text-muted)",
                    fontSize: "0.875rem",
                    textAlign: "center",
                    padding: "56px 0",
                  }}
                >
                  No expense data for this year
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie
                      data={categoryBreakdown}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={96}
                      innerRadius={40}
                      label={({ name, percent }) =>
                        (percent ?? 0) > 0.05
                          ? `${name} ${(((percent ?? 0)) * 100).toFixed(0)}%`
                          : ""
                      }
                      labelLine={false}
                    >
                      {categoryBreakdown.map((entry) => (
                        <Cell
                          key={entry.name}
                          fill={
                            CATEGORY_COLORS[
                              entry.name as ExpenseRecord["category"]
                            ]
                          }
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={fmtGbp}
                      contentStyle={{
                        background: "var(--bg-card)",
                        border: "1px solid var(--border)",
                        borderRadius: 8,
                        fontSize: "0.8rem",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Category totals list */}
            <div
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border)",
                borderRadius: 12,
                padding: 20,
              }}
            >
              <div
                className="section-title"
                style={{ marginBottom: 16 }}
              >
                Category Totals
              </div>
              {categoryBreakdown.length === 0 ? (
                <div
                  style={{
                    color: "var(--text-muted)",
                    fontSize: "0.875rem",
                    padding: "56px 0",
                    textAlign: "center",
                  }}
                >
                  No data for current year
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {[...categoryBreakdown]
                    .sort((a, b) => b.value - a.value)
                    .map((cat) => {
                      const pct =
                        totalExpensesAmt > 0
                          ? (cat.value / totalExpensesAmt) * 100
                          : 0;
                      const color =
                        CATEGORY_COLORS[
                          cat.name as ExpenseRecord["category"]
                        ];
                      return (
                        <div key={cat.name}>
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              marginBottom: 5,
                              fontSize: "0.8rem",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 7,
                              }}
                            >
                              <span
                                style={{
                                  width: 8,
                                  height: 8,
                                  borderRadius: "50%",
                                  background: color,
                                  display: "inline-block",
                                  flexShrink: 0,
                                }}
                              />
                              <span
                                style={{
                                  color: "var(--text-secondary)",
                                  textTransform: "capitalize",
                                }}
                              >
                                {cat.name}
                              </span>
                            </div>
                            <span
                              style={{
                                fontWeight: 600,
                                color: "var(--text-primary)",
                              }}
                            >
                              £{cat.value.toFixed(2)}
                            </span>
                          </div>
                          <div
                            style={{
                              height: 4,
                              background: "rgba(255,255,255,0.06)",
                              borderRadius: 4,
                            }}
                          >
                            <div
                              style={{
                                height: "100%",
                                width: `${pct}%`,
                                background: color,
                                borderRadius: 4,
                                transition: "width 0.4s ease",
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          EXPENSES TAB
      ════════════════════════════════════════════════════════════════════ */}
      {tab === "expenses" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Filter row */}
          <div
            style={{
              display: "flex",
              gap: 10,
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <input
              className="farm-input"
              style={{ maxWidth: 280 }}
              type="text"
              placeholder="Search description, supplier, invoice…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select
              className="farm-input"
              style={{ maxWidth: 180 }}
              value={categoryFilter}
              onChange={(e) =>
                setCategoryFilter(
                  e.target.value as ExpenseRecord["category"] | "",
                )
              }
            >
              <option value="">All categories</option>
              {EXPENSE_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <button
              className="btn-primary"
              onClick={() => setShowAddExpense(true)}
              style={{ marginLeft: "auto" }}
            >
              <Plus size={16} />
              Add Expense
            </button>
          </div>

          {/* Expenses table */}
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
                Expense Records
              </span>
              <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                {filteredExpenses.length}{" "}
                {filteredExpenses.length === 1 ? "record" : "records"} ·{" "}
                <span style={{ color: "#f87171", fontWeight: 600 }}>
                  £{filteredTotal.toFixed(2)}
                </span>
              </span>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table className="farm-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Category</th>
                    <th>Description</th>
                    <th>Supplier</th>
                    <th>Invoice Ref</th>
                    <th style={{ textAlign: "right" }}>Amount</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredExpenses.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        style={{
                          textAlign: "center",
                          color: "var(--text-muted)",
                          padding: "36px 0",
                        }}
                      >
                        {search || categoryFilter
                          ? "No expenses match your filters"
                          : "No expenses recorded yet"}
                      </td>
                    </tr>
                  ) : (
                    filteredExpenses.map((e) => (
                      <tr key={e.id}>
                        <td style={{ whiteSpace: "nowrap" }}>
                          {new Date(e.date).toLocaleDateString("en-GB")}
                        </td>
                        <td>
                          <CategoryBadge category={e.category} />
                        </td>
                        <td
                          style={{
                            fontWeight: 500,
                            color: "var(--text-primary)",
                            maxWidth: 220,
                          }}
                        >
                          {e.description}
                          {e.fieldName && (
                            <span
                              style={{
                                fontSize: "0.72rem",
                                color: "var(--text-muted)",
                                display: "block",
                                marginTop: 2,
                              }}
                            >
                              📍 {e.fieldName}
                            </span>
                          )}
                        </td>
                        <td>{e.supplier ?? "—"}</td>
                        <td
                          style={{
                            fontFamily: "monospace",
                            fontSize: "0.8rem",
                          }}
                        >
                          {e.invoiceRef ?? "—"}
                        </td>
                        <td
                          style={{
                            textAlign: "right",
                            fontWeight: 700,
                            color: "#f87171",
                            whiteSpace: "nowrap",
                          }}
                        >
                          £{e.amount.toFixed(2)}
                        </td>
                        <td>
                          <button
                            className="btn-danger"
                            onClick={() => handleDeleteExpense(e.id)}
                            title="Delete expense"
                          >
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          P&L REPORT TAB
      ════════════════════════════════════════════════════════════════════ */}
      {tab === "pl-report" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Stacked ComposedChart */}
          <div
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              padding: 20,
            }}
          >
            <div className="section-header">
              <div>
                <div className="section-title">Monthly P&amp;L Breakdown</div>
                <div
                  style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}
                >
                  Expenses stacked by category vs Revenue line · £
                </div>
              </div>
            </div>
            {plMonthlyData.length === 0 ? (
              <div
                style={{
                  color: "var(--text-muted)",
                  fontSize: "0.875rem",
                  textAlign: "center",
                  padding: "72px 0",
                }}
              >
                No data available yet — add expenses or record sales to populate
                this report
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={340}>
                <ComposedChart data={plMonthlyData} barGap={2}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(255,255,255,0.05)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="month"
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
                    formatter={fmtGbp}
                    contentStyle={{
                      background: "var(--bg-card)",
                      border: "1px solid var(--border)",
                      borderRadius: 8,
                      fontSize: "0.8rem",
                    }}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: "0.72rem", color: "#94a3b8" }}
                  />
                  {EXPENSE_CATEGORIES.map((cat) => (
                    <Bar
                      key={cat}
                      dataKey={cat}
                      stackId="expenses"
                      fill={CATEGORY_COLORS[cat]}
                      name={cat}
                    />
                  ))}
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#60a5fa"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: "#60a5fa", strokeWidth: 0 }}
                    name="Revenue"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* P&L Summary Table */}
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
              }}
            >
              <span style={{ fontWeight: 600, fontSize: "0.9rem" }}>
                Monthly P&amp;L Summary
              </span>
            </div>
            <table className="farm-table">
              <thead>
                <tr>
                  <th>Month</th>
                  <th style={{ textAlign: "right" }}>Revenue</th>
                  <th style={{ textAlign: "right" }}>Expenses</th>
                  <th style={{ textAlign: "right" }}>Net P&amp;L</th>
                  <th style={{ textAlign: "right" }}>Margin %</th>
                </tr>
              </thead>
              <tbody>
                {plMonthlyData.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      style={{
                        textAlign: "center",
                        color: "var(--text-muted)",
                        padding: "36px 0",
                      }}
                    >
                      No data available yet
                    </td>
                  </tr>
                ) : (
                  plMonthlyData.map((row) => {
                    const rev = row.revenue as number;
                    const exp = row.totalExpenses as number;
                    const net = row.netPnL as number;
                    const margin = row.margin as number;
                    return (
                      <tr key={row.month as string}>
                        <td
                          style={{
                            fontWeight: 500,
                            color: "var(--text-primary)",
                          }}
                        >
                          {row.month as string}
                        </td>
                        <td
                          style={{
                            textAlign: "right",
                            fontWeight: 600,
                            color: "#60a5fa",
                          }}
                        >
                          £{rev.toFixed(2)}
                        </td>
                        <td
                          style={{
                            textAlign: "right",
                            color: "#f87171",
                          }}
                        >
                          £{exp.toFixed(2)}
                        </td>
                        <td
                          style={{
                            textAlign: "right",
                            fontWeight: 700,
                            color: net >= 0 ? "#4ade80" : "#f87171",
                          }}
                        >
                          {net >= 0 ? "+" : ""}£{net.toFixed(2)}
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <span
                            style={{
                              color:
                                margin >= 20
                                  ? "#4ade80"
                                  : margin >= 0
                                    ? "#fbbf24"
                                    : "#f87171",
                              fontWeight: 600,
                            }}
                          >
                            {margin.toFixed(1)}%
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════════
          ADD EXPENSE MODAL
      ════════════════════════════════════════════════════════════════════ */}
      {showAddExpense && (
        <Modal
          title="Add Expense"
          onClose={() => {
            setShowAddExpense(false);
            setExpenseForm({
              date: new Date().toISOString().slice(0, 10),
              category: "other",
            });
          }}
          maxWidth={560}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {/* Date + Category */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 12,
              }}
            >
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
                  value={
                    expenseForm.date ?? new Date().toISOString().slice(0, 10)
                  }
                  onChange={(e) =>
                    setExpenseForm((f) => ({ ...f, date: e.target.value }))
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
                  Category
                </label>
                <select
                  className="farm-input"
                  value={expenseForm.category ?? "other"}
                  onChange={(e) =>
                    setExpenseForm((f) => ({
                      ...f,
                      category: e.target.value as ExpenseRecord["category"],
                    }))
                  }
                >
                  {EXPENSE_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Description */}
            <div>
              <label
                style={{
                  fontSize: "0.8rem",
                  color: "var(--text-muted)",
                  display: "block",
                  marginBottom: 6,
                }}
              >
                Description *
              </label>
              <input
                className="farm-input"
                type="text"
                placeholder="e.g. Diesel fuel delivery"
                value={expenseForm.description ?? ""}
                onChange={(e) =>
                  setExpenseForm((f) => ({ ...f, description: e.target.value }))
                }
              />
            </div>

            {/* Amount */}
            <div>
              <label
                style={{
                  fontSize: "0.8rem",
                  color: "var(--text-muted)",
                  display: "block",
                  marginBottom: 6,
                }}
              >
                Amount (£) *
              </label>
              <input
                className="farm-input"
                type="number"
                placeholder="0.00"
                min="0"
                step="0.01"
                value={expenseForm.amount ?? ""}
                onChange={(e) =>
                  setExpenseForm((f) => ({ ...f, amount: +e.target.value }))
                }
              />
            </div>

            {/* Supplier + Invoice Ref */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 12,
              }}
            >
              <div>
                <label
                  style={{
                    fontSize: "0.8rem",
                    color: "var(--text-muted)",
                    display: "block",
                    marginBottom: 6,
                  }}
                >
                  Supplier
                </label>
                <input
                  className="farm-input"
                  type="text"
                  placeholder="e.g. AgriSupplies Ltd"
                  value={expenseForm.supplier ?? ""}
                  onChange={(e) =>
                    setExpenseForm((f) => ({ ...f, supplier: e.target.value }))
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
                  Invoice Ref
                </label>
                <input
                  className="farm-input"
                  type="text"
                  placeholder="e.g. INV-2025-001"
                  value={expenseForm.invoiceRef ?? ""}
                  onChange={(e) =>
                    setExpenseForm((f) => ({
                      ...f,
                      invoiceRef: e.target.value,
                    }))
                  }
                />
              </div>
            </div>

            {/* Field / Area */}
            <div>
              <label
                style={{
                  fontSize: "0.8rem",
                  color: "var(--text-muted)",
                  display: "block",
                  marginBottom: 6,
                }}
              >
                Field / Area
              </label>
              <input
                className="farm-input"
                type="text"
                placeholder="e.g. North Meadow (optional)"
                value={expenseForm.fieldName ?? ""}
                onChange={(e) =>
                  setExpenseForm((f) => ({ ...f, fieldName: e.target.value }))
                }
              />
            </div>

            {/* Notes */}
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
              <textarea
                className="farm-input"
                rows={2}
                placeholder="Any additional notes…"
                value={expenseForm.notes ?? ""}
                onChange={(e) =>
                  setExpenseForm((f) => ({ ...f, notes: e.target.value }))
                }
                style={{ resize: "vertical" }}
              />
            </div>

            {/* Actions */}
            <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
              <button
                className="btn-primary"
                style={{ flex: 1 }}
                onClick={saveExpense}
              >
                Save Expense
              </button>
              <button
                className="btn-ghost"
                onClick={() => {
                  setShowAddExpense(false);
                  setExpenseForm({
                    date: new Date().toISOString().slice(0, 10),
                    category: "other",
                  });
                }}
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







