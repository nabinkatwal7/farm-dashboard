"use client";

import {
  Banknote,
  BarChart2,
  Pencil,
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
  type ExpenseRecord,
  type SaleRecord,
} from "@/app/base/services/farm-client";
import { validate, hasErrors, type Errors, type Rule } from "@/app/lib/validate";
import { Button, Group } from "@mantine/core";
import { notifications } from "@mantine/notifications";

const FINANCE_ENTITIES = {
  expenses: "expenses",
  sales: "sales",
  fields: "fields",
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
  const { data, reload: load, loading } = useFarmData(FINANCE_ENTITIES);
  const expenses = data.expenses as ExpenseRecord[];
  const sales = data.sales as SaleRecord[];
  const fields = data.fields as CropField[];
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [editingExpense, setEditingExpense] = useState<ExpenseRecord | null>(null);
  const [expenseForm, setExpenseForm] = useState<Partial<ExpenseRecord>>({
    date: new Date().toISOString().slice(0, 10),
    category: "other",
  });
  const [expenseErrors, setExpenseErrors] = useState<Errors>({});
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<ExpenseRecord["category"] | "">("");

  const validateExpense = () => {
    const rules: Rule[] = [
      { key: "date", label: "Date", required: true },
      { key: "category", label: "Category", required: true },
      { key: "description", label: "Description", required: true },
      { key: "amount", label: "Amount", required: true },
    ];
    const errors = validate(expenseForm as Record<string, unknown>, rules);
    setExpenseErrors(errors);
    return !hasErrors(errors);
  };

  const saveExpense = async () => {
    if (!validateExpense()) return;
    try {
      await saveData("expenses", {
        id: editingExpense?.id || generateId(),
        date: new Date().toISOString().slice(0, 10),
        category: "other" as const,
        description: "",
        amount: 0,
        ...expenseForm,
      } as ExpenseRecord);
      await load();
      notifications.show({ title: "Success", message: "Expense saved", color: "green" });
      setShowAddExpense(false);
      setEditingExpense(null);
      setExpenseForm({
        date: new Date().toISOString().slice(0, 10),
        category: "other",
      });
      setExpenseErrors({});
    } catch (error) {
      notifications.show({
        title: "Error",
        message: error instanceof Error ? error.message : "Failed to save expense",
        color: "red",
      });
    }
  };

  const handleDeleteExpense = async (id: string) => {
    try {
      await deleteData("expenses", id);
      await load();
      notifications.show({ title: "Success", message: "Expense deleted", color: "green" });
    } catch (error) {
      notifications.show({
        title: "Error",
        message: error instanceof Error ? error.message : "Failed to delete expense",
        color: "red",
      });
    }
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
    <div style={{ padding: 24 }}>
      {/* ── Page Header ─────────────────────────────────────────────────── */}
      <div style={{ marginBottom: 28 }}>
        <h1
          className="text-primary"
          style={{
            fontSize: "1.6rem",
            fontWeight: 800,
            letterSpacing: "-0.02em",
          }}
        >
          💰 Finance &amp; Costs
        </h1>
        <p
          className="text-muted"
          style={{
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
            className="bg-card border border-border"
            style={{
              borderRadius: 12,
              padding: 20,
            }}
          >
            <div className="section-header">
              <div>
                <div className="section-title">Monthly Revenue vs Expenses</div>
                <div
                  className="text-muted"
                  style={{ fontSize: "0.75rem" }}
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
              className="bg-card border border-border"
              style={{
                borderRadius: 12,
                padding: 20,
              }}
            >
              <div className="section-header">
                <div>
                  <div className="section-title">Expenses by Category</div>
                  <div
                    className="text-muted"
                    style={{ fontSize: "0.75rem" }}
                  >
                    Current year · £
                  </div>
                </div>
              </div>
              {categoryBreakdown.length === 0 ? (
                <div
                  className="text-muted"
                  style={{
                    fontSize: "0.875rem",
                    textAlign: "center",
                    padding: "24px 0",
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
              className="bg-card border border-border"
              style={{
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
                  className="text-muted"
                  style={{
                    fontSize: "0.875rem",
                    padding: "24px 0",
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
  if (loading) return <TableSkeleton rows={5} cols={5} />;

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
                                className="text-secondary"
                                style={{
                                  textTransform: "capitalize",
                                }}
                              >
                                {cat.name}
                              </span>
                            </div>
                            <span
                              className="text-primary"
                              style={{
                                fontWeight: 600,
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
                Expense Records
              </span>
              <span className="text-muted" style={{ fontSize: "0.8rem" }}>
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
                        className="text-muted"
                        style={{
                          textAlign: "center",
                          padding: "24px 0",
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
                          className="text-primary"
                          style={{
                            fontWeight: 500,
                            maxWidth: 220,
                          }}
                        >
                          {e.description}
                          {e.fieldName && (
                            <span
                              className="text-muted"
                              style={{
                                fontSize: "0.72rem",
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
                          <div style={{ display: "flex", gap: 4 }}>
                          <button
                            className="btn-ghost"
                            onClick={() => {
                              setEditingExpense(e);
                              setExpenseForm({
                                date: e.date,
                                category: e.category,
                                description: e.description,
                                amount: e.amount,
                                supplier: e.supplier,
                                invoiceRef: e.invoiceRef,
                                fieldName: e.fieldName,
                                notes: e.notes,
                              });
                              setExpenseErrors({});
                              setShowAddExpense(true);
                            }}
                            title="Edit expense"
                          >
                            <Pencil size={13} />
                          </button>
                          <button
                            className="btn-danger"
                            onClick={() => handleDeleteExpense(e.id)}
                            title="Delete expense"
                          >
                            <Trash2 size={13} />
                          </button>
                          </div>
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
            className="bg-card border border-border"
            style={{
              borderRadius: 12,
              padding: 20,
            }}
          >
            <div className="section-header">
              <div>
                <div className="section-title">Monthly P&amp;L Breakdown</div>
                <div
                  className="text-muted"
                  style={{ fontSize: "0.75rem" }}
                >
                  Expenses stacked by category vs Revenue line · £
                </div>
              </div>
            </div>
            {plMonthlyData.length === 0 ? (
              <div
                className="text-muted"
                style={{
                  fontSize: "0.875rem",
                  textAlign: "center",
                  padding: "24px 0",
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
                      className="text-muted"
                      style={{
                        textAlign: "center",
                        padding: "24px 0",
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
                          className="text-primary"
                          style={{
                            fontWeight: 500,
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
          title={editingExpense ? `Edit Expense — ${editingExpense.description}` : "Add Expense"}
          onClose={() => {
            setShowAddExpense(false);
            setEditingExpense(null);
            setExpenseForm({
              date: new Date().toISOString().slice(0, 10),
              category: "other",
            });
          }}
          maxWidth={560}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <FormField
                label="Expense date"
                name="expense-date"
                type="date"
                required
                error={expenseErrors.date}
                value={expenseForm.date ?? new Date().toISOString().slice(0, 10)}
                onChange={(e) => setExpenseForm((f) => ({ ...f, date: e.target.value }))}
              />
              <FormField
                as="select"
                label="Expense category"
                name="expense-category"
                required
                error={expenseErrors.category}
                value={expenseForm.category ?? "other"}
                onChange={(e) =>
                  setExpenseForm((f) => ({
                    ...f,
                    category: e.target.value as ExpenseRecord["category"],
                  }))
                }
              >
                {EXPENSE_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </FormField>
            </div>

            <FormField
              label="Description"
              name="expense-desc"
              type="text"
              placeholder="Diesel fuel delivery"
              required
              error={expenseErrors.description}
              value={String(expenseForm.description ?? "")}
              onChange={(e) => setExpenseForm((f) => ({ ...f, description: e.target.value }))}
            />

            <FormField
              label="Amount"
              helperText="Enter the expense amount in GBP."
              name="expense-amount"
              type="number"
              placeholder="0.00"
              min="0"
              step="0.01"
              required
              error={expenseErrors.amount}
              value={String(expenseForm.amount ?? "")}
              onChange={(e) => setExpenseForm((f) => ({ ...f, amount: +e.target.value }))}
            />

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <FormField
                label="Supplier"
                name="supplier"
                placeholder="e.g. Northern Ag Supply"
                helperText="Enter the supplier directly. Reuse the same name for cleaner reporting."
                value={expenseForm.supplier ?? ""}
                onChange={(e) => setExpenseForm((f) => ({ ...f, supplier: e.target.value }))}
              />
              <FormField
                label="Invoice reference"
                name="invoiceRef"
                placeholder="INV-2025-001"
                value={expenseForm.invoiceRef ?? ""}
                onChange={(e) => setExpenseForm((f) => ({ ...f, invoiceRef: e.target.value }))}
              />
            </div>

            <FormField
              as="select"
              label="Field or area"
              name="fieldName"
              helperText={
                fields.length > 0
                  ? "Optional. Attribute the expense to a field when it applies."
                  : "No fields available yet. Create one in Crops & Fields if you want field-level cost tracking."
              }
              disabled={fields.length === 0}
              value={expenseForm.fieldName ?? ""}
              onChange={(e) => setExpenseForm((f) => ({ ...f, fieldName: e.target.value }))}
            >
              <option value="">Select field...</option>
              {fields.map((f) => (
                <option key={f.id} value={f.name}>
                  {f.name}
                </option>
              ))}
            </FormField>

            <FormField
              as="textarea"
              label="Notes"
              name="expenseNotes"
              rows={2}
              placeholder="Any additional notes"
              value={expenseForm.notes ?? ""}
              onChange={(e) => setExpenseForm((f) => ({ ...f, notes: e.target.value }))}
            />

            <Group grow mt={4}>
              <Button onClick={saveExpense}>Save Expense</Button>
              <Button
                variant="default"
                onClick={() => {
                  setShowAddExpense(false);
                  setEditingExpense(null);
                  setExpenseForm({
                    date: new Date().toISOString().slice(0, 10),
                    category: "other",
                  });
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







