"use client";

import FormField from "@/app/abstract/ui/FormField";
import HelpHint from "@/app/abstract/ui/HelpHint";
import Modal from "@/app/abstract/ui/Modal";
import StatCard from "@/app/abstract/ui/StatCard";
import TableSkeleton from "@/app/abstract/ui/TableSkeleton";
import { useFarmData } from "@/app/base/hooks/useFarmData";
import {
  deleteData,
  generateId,
  saveData,
  type Consignment,
  type CropField,
  type CropModel,
  type GerminationTest,
  type SeedLot,
} from "@/app/base/services/farm-client";
import { cropOptions } from "@/app/lib/crops";
import { useCurrentUser } from "@/app/lib/user-context";
import { Button, Group } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
  BarChart3,
  FlaskConical,
  Package,
  Plus,
  Sprout,
  Trash2,
  TrendingDown,
} from "lucide-react";
import { useEffect, useState } from "react";
import { validate, hasErrors, type Errors, type Rule } from "@/app/lib/validate";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const SEED_ENTITIES = {
  fields: "fields",
  seedLots: "seedLots",
  germinationTests: "germinationTests",
  consignments: "consignments",
  cropModels: "cropModels",
} as const;

type Tab = "inventory" | "germination" | "consignments";

const TREATMENT_COLORS: Record<string, string> = {
  none: "#64748b",
  chemical: "#f87171",
  biological: "#4ade80",
};

export default function SeedTrackerPage() {
  const [tab, setTab] = useState<Tab>("inventory");
  const currentUser = useCurrentUser();
  const { data, reload, loading } = useFarmData(SEED_ENTITIES);
  const fields = data.fields as CropField[];
  const seedLots = data.seedLots as SeedLot[];
  const germinationTests = data.germinationTests as GerminationTest[];
  const consignments = data.consignments as Consignment[];
  const cropModels = data.cropModels as CropModel[];

  const [showAddLot, setShowAddLot] = useState(false);
  const [showAddTest, setShowAddTest] = useState(false);
  const [showAddConsignment, setShowAddConsignment] = useState(false);
  const [lotForm, setLotForm] = useState<Partial<SeedLot>>({});
  const [testForm, setTestForm] = useState<Partial<GerminationTest>>({});
  const [consignmentForm, setConsignmentForm] = useState<Partial<Consignment>>({});
  const [lotErrors, setLotErrors] = useState<Errors>({});
  const [testErrors, setTestErrors] = useState<Errors>({});
  const [selectedLotId, setSelectedLotId] = useState<string>("");
  const [viabilityData, setViabilityData] = useState<Array<{
    date: string;
    germinationPercent: number;
  }> | null>(null);
  const [declineInfo, setDeclineInfo] = useState<{
    declineRatePerMonth: number;
    projectedViability: number | null;
  } | null>(null);

  const LOT_RULES: Rule[] = [
    { key: "crop", label: "Crop", required: true },
    { key: "lotNumber", label: "Lot number", required: true },
    { key: "supplier", label: "Supplier", required: true },
    { key: "quantity", label: "Quantity", required: true },
    { key: "unit", label: "Unit", required: true },
    { key: "purchaseDate", label: "Purchase date", required: true },
    { key: "baselineGermination", label: "Baseline germination", required: true },
  ];

  const TEST_RULES: Rule[] = [
    { key: "seedLotId", label: "Seed lot", required: true },
    { key: "testDate", label: "Test date", required: true },
    { key: "seedsTested", label: "Seeds tested", required: true },
    { key: "seedsGerminated", label: "Seeds germinated", required: true },
  ];

  const sortedLots = [...seedLots].sort((a, b) => b.lotNumber.localeCompare(a.lotNumber));

  const firstLot = sortedLots.length > 0 ? sortedLots[0].id : "";
  useEffect(() => {
    if (!selectedLotId && firstLot) {
      setSelectedLotId(firstLot);
    }
  }, [firstLot]);

  useEffect(() => {
    if (!selectedLotId) return;
    fetch("/api/seed/viability", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ seedLotId: selectedLotId }),
    })
      .then((r) => r.json())
      .then((result) => {
        if (result.viability) {
          setViabilityData(
            result.viability.map((v: { date: string; germinationPercent: number }) => ({
              date: new Date(v.date).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
              }),
              germinationPercent: v.germinationPercent,
            })),
          );
          setDeclineInfo(result.decline);
        }
      })
      .catch(() => {});
  }, [selectedLotId, germinationTests.length]);

  const selectedLot = seedLots.find((l) => l.id === selectedLotId);
  const lotTests = germinationTests.filter((t) => t.seedLotId === selectedLotId);
  const lotConsignments = consignments.filter((c) => c.seedLotId === selectedLotId);

  const totalSeedKg = seedLots.reduce((s, l) => s + l.quantity, 0);
  const totalConsignedKg = consignments.reduce((s, c) => s + c.quantity, 0);
  const totalTests = germinationTests.length;
  const lowViabilityLots = seedLots.filter((l) => {
    const latest = germinationTests
      .filter((t) => t.seedLotId === l.id)
      .sort(
        (a, b) =>
          new Date(b.testDate).getTime() - new Date(a.testDate).getTime(),
      );
    return latest.length > 0 && latest[0].germinationPercent < 70;
  }).length;

  function getRemaining(lot: SeedLot) {
    const used = consignments
      .filter((c) => c.seedLotId === lot.id)
      .reduce((s, c) => s + c.quantity, 0);
    return Math.max(0, lot.quantity - used);
  }

  if (loading) return <TableSkeleton />;

  const cropChoices = cropOptions(cropModels);

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 28 }}>
        <h1
          className="text-primary"
          style={{ fontSize: "1.6rem", fontWeight: 800, letterSpacing: "-0.02em" }}
        >
          Seed Lot & Consignment Germination Tracker
        </h1>
        <p className="text-muted" style={{ fontSize: "0.875rem", marginTop: 4 }}>
          Inventory ledger tracking germination rates, seed-treatment lot numbers, and viability curves across {seedLots.length} seed lots
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
          label="Seed Lots"
          value={seedLots.length}
          sub={`${totalSeedKg.toFixed(0)} kg total`}
          icon={Package}
          color="#60a5fa"
          delay={0}
        />
        <StatCard
          label="Consignments"
          value={consignments.length}
          sub={`${totalConsignedKg.toFixed(0)} kg used`}
          icon={BarChart3}
          color="#a78bfa"
          delay={60}
        />
        <StatCard
          label="Germination Tests"
          value={totalTests}
          sub="across all lots"
          icon={FlaskConical}
          color="#fbbf24"
          delay={120}
        />
        <StatCard
          label="Low Viability"
          value={lowViabilityLots}
          sub="lots below 70%"
          icon={TrendingDown}
          color={lowViabilityLots > 0 ? "#f87171" : "#4ade80"}
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
            ["inventory", "Seed Inventory"],
            ["germination", "Germination Tests"],
            ["consignments", "Consignments"],
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

      {tab === "inventory" && (
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
                Seed Lots
              </span>
              <button
                className="btn-primary"
                onClick={() => setShowAddLot(true)}
              >
                <Plus size={14} /> Add Seed Lot
              </button>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table className="farm-table">
                <thead>
                  <tr>
                    <th>Lot #</th>
                    <th>Crop / Variety</th>
                    <th>Qty</th>
                    <th>Remaining</th>
                    <th>Treatment</th>
                    <th>Baseline Germ.</th>
                    <th>Latest Germ.</th>
                    <th>Tests</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {sortedLots.map((lot) => {
                    const latest = [...germinationTests]
                      .filter((t) => t.seedLotId === lot.id)
                      .sort(
                        (a, b) =>
                          new Date(b.testDate).getTime() -
                          new Date(a.testDate).getTime(),
                      );
                    return (
                      <tr key={lot.id}>
                        <td className="text-primary" style={{ fontWeight: 600 }}>
                          {lot.lotNumber}
                        </td>
                        <td>
                          {lot.crop}
                          {lot.variety ? ` (${lot.variety})` : ""}
                        </td>
                        <td>
                          {lot.quantity} {lot.unit}
                        </td>
                        <td>
                          <span
                            className={
                              getRemaining(lot) / lot.quantity < 0.2
                                ? "badge-red"
                                : "badge-green"
                            }
                          >
                            {getRemaining(lot)} {lot.unit}
                          </span>
                        </td>
                        <td>
                          <span
                            style={{
                              color: TREATMENT_COLORS[lotsTreatmentType(lot.treatmentType)],
                              fontSize: "0.85rem",
                              fontWeight: 500,
                            }}
                          >
                            {lot.treatmentType}
                          </span>
                        </td>
                        <td>
                          {lot.baselineGermination !== null &&
                          lot.baselineGermination !== undefined
                            ? `${lot.baselineGermination}%`
                            : "—"}
                        </td>
                        <td>
                          {latest.length > 0 ? (
                            <span
                              className={
                                latest[0].germinationPercent >= 85
                                  ? "badge-green"
                                  : latest[0].germinationPercent >= 70
                                    ? "badge-yellow"
                                    : "badge-red"
                              }
                            >
                              {latest[0].germinationPercent}%
                            </span>
                          ) : (
                            <span className="text-muted">—</span>
                          )}
                        </td>
                        <td>{germinationTests.filter((t) => t.seedLotId === lot.id).length}</td>
                        <td>
                          <button
                            onClick={async () => {
                              try {
                                await deleteData("seedLots", lot.id);
                                notifications.show({ title: "Deleted", message: `Seed lot ${lot.lotNumber} removed`, color: "green" });
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
                            title="Delete lot"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {sortedLots.length === 0 && (
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
                        No seed lots recorded. Add a seed lot to start tracking inventory and germination.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {tab === "germination" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div
            style={{
              display: "flex",
              gap: 12,
              alignItems: "center",
              marginBottom: 4,
            }}
          >
            <select
              value={selectedLotId}
              onChange={(e) => setSelectedLotId(e.target.value)}
              style={{
                padding: "8px 14px",
                borderRadius: 8,
                border: "1px solid var(--border)",
                background: "var(--bg-card)",
                color: "var(--text-primary)",
                fontSize: "0.85rem",
                fontWeight: 500,
                minWidth: 260,
              }}
            >
              <option value="">Select a seed lot...</option>
              {sortedLots.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.lotNumber} — {l.crop}
                </option>
              ))}
            </select>
          </div>

          {selectedLot && (
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
                  Viability Curve — {selectedLot.lotNumber} ({selectedLot.crop})
                </span>
                <button
                  className="btn-primary"
                  onClick={() => setShowAddTest(true)}
                >
                  <Plus size={14} /> Add Test
                </button>
              </div>
              <div style={{ padding: 20 }}>
                {viabilityData && viabilityData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={280}>
                    <AreaChart data={viabilityData}>
                      <defs>
                        <linearGradient id="viabilityFill" x1="0" x2="0" y1="0" y2="1">
                          <stop offset="0%" stopColor="#fbbf24" stopOpacity={0.3} />
                          <stop offset="100%" stopColor="#fbbf24" stopOpacity={0.02} />
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
                        domain={[0, 100]}
                        tick={{ fill: "#64748b", fontSize: 10 }}
                        axisLine={false}
                        tickLine={false}
                        label={{
                          value: "Germination %",
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
                        formatter={(value) => [`${value}%`, "Germination"]}
                      />
                      <Area
                        type="monotone"
                        dataKey="germinationPercent"
                        stroke="#fbbf24"
                        fill="url(#viabilityFill)"
                        strokeWidth={2.5}
                        name="Germination"
                        dot={{ r: 4, fill: "#fbbf24" }}
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
                    No germination tests recorded for this lot. Add tests to track viability over time.
                  </div>
                )}

                {declineInfo && declineInfo.projectedViability !== null && (
                  <div
                    style={{
                      marginTop: 16,
                      display: "flex",
                      gap: 20,
                      justifyContent: "center",
                    }}
                  >
                    <div
                      className="border border-border"
                      style={{
                        borderRadius: 10,
                        padding: "12px 24px",
                        textAlign: "center",
                      }}
                    >
                      <div className="text-muted" style={{ fontSize: "0.7rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                        Decline Rate
                      </div>
                      <div
                        style={{
                          fontSize: "1.2rem",
                          fontWeight: 700,
                          marginTop: 2,
                          color: declineInfo.declineRatePerMonth > 2 ? "#f87171" : "#4ade80",
                        }}
                      >
                        {declineInfo.declineRatePerMonth}%/mo
                      </div>
                    </div>
                    <div
                      className="border border-border"
                      style={{
                        borderRadius: 10,
                        padding: "12px 24px",
                        textAlign: "center",
                      }}
                    >
                      <div className="text-muted" style={{ fontSize: "0.7rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                        Projected (3 mo)
                      </div>
                      <div
                        style={{
                          fontSize: "1.2rem",
                          fontWeight: 700,
                          marginTop: 2,
                          color: declineInfo.projectedViability >= 70 ? "#4ade80" : "#f87171",
                        }}
                      >
                        {declineInfo.projectedViability}%
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {selectedLot && (
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
                  Test Records
                </span>
              </div>
              <div style={{ overflowX: "auto" }}>
                <table className="farm-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Tested</th>
                      <th>Germinated</th>
                      <th>Rate</th>
                      <th>Method</th>
                      <th>Notes</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...lotTests]
                      .sort(
                        (a, b) =>
                          new Date(b.testDate).getTime() -
                          new Date(a.testDate).getTime(),
                      )
                      .map((t) => (
                        <tr key={t.id}>
                          <td>
                            {new Date(t.testDate).toLocaleDateString("en-GB")}
                          </td>
                          <td>{t.seedsTested}</td>
                          <td>{t.seedsGerminated}</td>
                          <td>
                            <span
                              className={
                                t.germinationPercent >= 85
                                  ? "badge-green"
                                  : t.germinationPercent >= 70
                                    ? "badge-yellow"
                                    : "badge-red"
                              }
                            >
                              {t.germinationPercent}%
                            </span>
                          </td>
                          <td className="text-muted" style={{ textTransform: "capitalize" }}>
                            {t.testMethod.replace("-", " ")}
                          </td>
                          <td className="text-muted" style={{ maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis" }}>
                            {t.notes ?? "—"}
                          </td>
                          <td>
                            <button
                              onClick={async () => {
                                try {
                                  await deleteData("germinationTests", t.id);
                                  notifications.show({ title: "Deleted", message: "Test record removed", color: "green" });
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
                              title="Delete test"
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    {lotTests.length === 0 && (
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
                          No tests for this lot.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {tab === "consignments" && (
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
                Consignments
              </span>
              <button
                className="btn-primary"
                onClick={() => setShowAddConsignment(true)}
              >
                <Plus size={14} /> Add Consignment
              </button>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table className="farm-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Seed Lot</th>
                    <th>Qty</th>
                    <th>Destination</th>
                    <th>Field</th>
                    <th>Sowing Date</th>
                    <th>Notes</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {[...consignments]
                    .sort(
                      (a, b) =>
                        new Date(b.date).getTime() - new Date(a.date).getTime(),
                    )
                    .map((c) => {
                      const lot = seedLots.find((l) => l.id === c.seedLotId);
                      const field = fields.find((f) => f.id === c.fieldId);
                      return (
                        <tr key={c.id}>
                          <td>
                            {new Date(c.date).toLocaleDateString("en-GB")}
                          </td>
                          <td className="text-primary" style={{ fontWeight: 500 }}>
                            {lot ? `${lot.lotNumber} (${lot.crop})` : "—"}
                          </td>
                          <td style={{ fontWeight: 600 }}>
                            {c.quantity} {c.unit}
                          </td>
                          <td className="text-muted">
                            {c.destination ?? "—"}
                          </td>
                          <td className="text-muted">
                            {field?.name ?? (c.fieldId ? "—" : "—")}
                          </td>
                          <td className="text-muted">
                            {c.sowingDate
                              ? new Date(c.sowingDate).toLocaleDateString("en-GB")
                              : "—"}
                          </td>
                          <td className="text-muted" style={{ maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis" }}>
                            {c.notes ?? "—"}
                          </td>
                          <td>
                            <button
                              onClick={async () => {
                                try {
                                  await deleteData("consignments", c.id);
                                  notifications.show({ title: "Deleted", message: "Consignment removed", color: "green" });
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
                              title="Delete consignment"
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  {consignments.length === 0 && (
                    <tr>
                      <td
                        colSpan={8}
                        className="text-muted"
                        style={{
                          textAlign: "center",
                          padding: "40px 20px",
                          fontSize: "0.85rem",
                        }}
                      >
                        No consignments recorded. Add a consignment to track seed distribution.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {showAddLot && (
        <Modal
          title="Add Seed Lot"
          onClose={() => {
            setShowAddLot(false);
            setLotForm({});
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <FormField
                as="select"
                label={<span className="inline-flex items-center gap-1.5">Crop <HelpHint label="Seed lots should match a crop type already defined in Settings so germination and planning screens stay aligned." /></span>}
                name="crop"
                required
                error={lotErrors.crop}
                helperText={
                  cropChoices.length > 0
                    ? "Choose a crop already defined in your workspace."
                    : "No crop types yet. Add one in Settings before creating a seed lot."
                }
                disabled={cropChoices.length === 0}
                value={lotForm.crop ?? ""}
                onChange={(e) => setLotForm((f) => ({ ...f, crop: e.target.value }))}
              >
                <option value="">Select crop...</option>
                {cropChoices.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </FormField>
              <FormField
                label="Variety"
                name="variety"
                type="text"
                placeholder="e.g. Crusoe"
                value={String(lotForm.variety ?? "")}
                onChange={(e) => setLotForm((f) => ({ ...f, variety: e.target.value }))}
              />
            </div>
            <FormField
              label="Lot Number"
              name="lotNumber"
              type="text"
              placeholder="e.g. L-2024-001"
              required
              error={lotErrors.lotNumber}
              value={String(lotForm.lotNumber ?? "")}
              onChange={(e) => setLotForm((f) => ({ ...f, lotNumber: e.target.value }))}
            />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
              <FormField
                label="Quantity"
                name="quantity"
                type="number"
                required
                error={lotErrors.quantity}
                value={String(lotForm.quantity ?? "")}
                onChange={(e) => setLotForm((f) => ({ ...f, quantity: +e.target.value }))}
              />
              <FormField
                as="select"
                label="Unit"
                name="unit"
                required
                error={lotErrors.unit}
                value={lotForm.unit ?? "kg"}
                onChange={(e) => setLotForm((f) => ({ ...f, unit: e.target.value }))}
              >
                <option value="kg">kg</option>
                <option value="tonne">tonne</option>
                <option value="bag">bag</option>
                <option value="unit">unit</option>
              </FormField>
              <FormField
                as="select"
                label="Treatment"
                name="treatmentType"
                value={lotForm.treatmentType ?? "none"}
                onChange={(e) => setLotForm((f) => ({ ...f, treatmentType: e.target.value as SeedLot["treatmentType"] }))}
              >
                <option value="none">None</option>
                <option value="chemical">Chemical</option>
                <option value="biological">Biological</option>
              </FormField>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <FormField
                label={<span className="inline-flex items-center gap-1.5">Supplier <HelpHint label="Use the supplier or merchant name exactly as you want it to appear in future lots and purchase history." /></span>}
                name="supplier"
                placeholder="e.g. Frontier Seeds"
                helperText="Enter the supplier directly. Reuse the same name for clearer lot history."
                required
                error={lotErrors.supplier}
                value={lotForm.supplier ?? ""}
                onChange={(e) => setLotForm((f) => ({ ...f, supplier: e.target.value }))}
              />
              <FormField
                label="Baseline Germination (%)"
                name="baselineGermination"
                type="number"
                required
                error={lotErrors.baselineGermination}
                value={String(lotForm.baselineGermination ?? "")}
                onChange={(e) => setLotForm((f) => ({ ...f, baselineGermination: +e.target.value }))}
              />
            </div>
            <Group grow mt={4}>
              <Button
                onClick={async () => {
                  const errors = validate(lotForm, LOT_RULES);
                  if (hasErrors(errors)) {
                    setLotErrors(errors);
                    return;
                  }
                  try {
                    await saveData("seedLots", {
                      id: generateId(),
                      crop: (lotForm.crop ?? "").trim(),
                      variety: lotForm.variety?.trim() || undefined,
                      lotNumber: (lotForm.lotNumber ?? "").trim(),
                      supplier: lotForm.supplier?.trim() || undefined,
                      purchaseDate: lotForm.purchaseDate,
                      quantity: lotForm.quantity,
                      unit: lotForm.unit || "kg",
                      treatmentType: lotForm.treatmentType || "none",
                      treatmentProduct: lotForm.treatmentProduct || undefined,
                      treatmentDate: lotForm.treatmentDate,
                      baselineGermination: lotForm.baselineGermination || undefined,
                      notes: lotForm.notes,
                    } as SeedLot);
                    notifications.show({ title: "Success", message: "Seed lot created", color: "green" });
                    await reload();
                    setShowAddLot(false);
                    setLotForm({});
                    setLotErrors({});
                  } catch (e) {
                    notifications.show({ title: "Error", message: e instanceof Error ? e.message : "Failed to save lot", color: "red" });
                  }
                }}
              >
                Save Lot
              </Button>
              <Button variant="default" onClick={() => { setShowAddLot(false); setLotForm({}); setLotErrors({}); }}>
                Cancel
              </Button>
            </Group>
          </div>
        </Modal>
      )}

      {showAddTest && (
        <Modal
          title="Add Germination Test"
          onClose={() => { setShowAddTest(false); setTestForm({}); setTestErrors({}); }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <FormField
              label="Test Date"
              name="testDate"
              type="date"
              required
              error={testErrors.testDate}
              value={String(testForm.testDate ?? new Date().toISOString().slice(0, 10))}
              onChange={(e) => setTestForm((f) => ({ ...f, testDate: e.target.value }))}
            />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
              <FormField
                label="Seeds Tested"
                name="seedsTested"
                type="number"
                required
                error={testErrors.seedsTested}
                value={String(testForm.seedsTested ?? "")}
                onChange={(e) => setTestForm((f) => ({ ...f, seedsTested: +e.target.value }))}
              />
              <FormField
                label="Seeds Germinated"
                name="seedsGerminated"
                type="number"
                required
                error={testErrors.seedsGerminated}
                value={String(testForm.seedsGerminated ?? "")}
                onChange={(e) => setTestForm((f) => ({ ...f, seedsGerminated: +e.target.value }))}
              />
              <FormField
                as="select"
                label="Method"
                name="testMethod"
                value={testForm.testMethod ?? "paper"}
                onChange={(e) => setTestForm((f) => ({ ...f, testMethod: e.target.value as GerminationTest["testMethod"] }))}
              >
                <option value="paper">Paper</option>
                <option value="damp-towel">Damp Towel</option>
                <option value="soil">Soil</option>
                <option value="other">Other</option>
              </FormField>
            </div>
            <Group grow mt={4}>
              <Button
                onClick={async () => {
                  const testData = { ...testForm, seedLotId: selectedLotId };
                  const errors = validate(testData, TEST_RULES);
                  if (hasErrors(errors)) {
                    setTestErrors(errors);
                    return;
                  }
                  try {
                    const percent = Math.round(((testForm.seedsGerminated ?? 0) / (testForm.seedsTested ?? 1)) * 1000) / 10;
                    await saveData("germinationTests", {
                      id: generateId(),
                      seedLotId: selectedLotId,
                      testDate: testForm.testDate || new Date().toISOString().slice(0, 10),
                      seedsTested: testForm.seedsTested,
                      seedsGerminated: testForm.seedsGerminated,
                      germinationPercent: percent,
                      testMethod: testForm.testMethod || "paper",
                      notes: testForm.notes,
                    } as GerminationTest);
                    notifications.show({ title: "Success", message: `Germination test saved (${percent}%)`, color: "green" });
                    await reload();
                    setShowAddTest(false);
                    setTestForm({});
                    setTestErrors({});
                  } catch (e) {
                    notifications.show({ title: "Error", message: e instanceof Error ? e.message : "Failed to save test", color: "red" });
                  }
                }}
              >
                Save Test
              </Button>
              <Button variant="default" onClick={() => { setShowAddTest(false); setTestForm({}); setTestErrors({}); }}>
                Cancel
              </Button>
            </Group>
          </div>
        </Modal>
      )}

      {showAddConsignment && (
        <Modal
          title="Add Consignment"
          onClose={() => { setShowAddConsignment(false); setConsignmentForm({}); }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <FormField
              as="select"
              label={<span className="inline-flex items-center gap-1.5">Seed Lot <HelpHint label="Choose the source lot being issued out. Remaining quantity is shown in the option label to reduce over-allocation." /></span>}
              name="seedLotId"
              helperText={
                sortedLots.length > 0
                  ? "Choose the lot being sent out."
                  : "No seed lots available yet. Add a seed lot before recording a consignment."
              }
              disabled={sortedLots.length === 0}
              value={consignmentForm.seedLotId ?? ""}
              onChange={(e) => setConsignmentForm((f) => ({ ...f, seedLotId: e.target.value }))}
            >
              <option value="">Select lot...</option>
              {sortedLots.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.lotNumber} — {l.crop} ({getRemaining(l)} {l.unit} remaining)
                </option>
              ))}
            </FormField>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <FormField
                label="Date"
                name="date"
                type="date"
                value={String(consignmentForm.date ?? new Date().toISOString().slice(0, 10))}
                onChange={(e) => setConsignmentForm((f) => ({ ...f, date: e.target.value }))}
              />
              <FormField
                label="Quantity"
                name="quantity"
                type="number"
                value={String(consignmentForm.quantity ?? "")}
                onChange={(e) => setConsignmentForm((f) => ({ ...f, quantity: +e.target.value }))}
              />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <FormField
                as="select"
                label="Field (optional)"
                name="fieldId"
                helperText={
                  fields.length > 0
                    ? "Optional. Link this consignment to a receiving field."
                    : "No active fields available yet. Create one in Crops & Fields if you want field-level seed allocation."
                }
                disabled={fields.length === 0}
                value={consignmentForm.fieldId ?? ""}
                onChange={(e) => setConsignmentForm((f) => ({ ...f, fieldId: e.target.value }))}
              >
                <option value="">None</option>
                {fields.filter((f) => f.status !== "fallow").map((f) => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </FormField>
              <FormField
                label="Sowing Date"
                name="sowingDate"
                type="date"
                value={String(consignmentForm.sowingDate ?? "")}
                onChange={(e) => setConsignmentForm((f) => ({ ...f, sowingDate: e.target.value }))}
              />
            </div>
            <Group grow mt={4}>
              <Button
                onClick={async () => {
                  try {
                    if (!consignmentForm.seedLotId || !consignmentForm.quantity) {
                      notifications.show({ title: "Validation", message: "Seed lot and quantity are required", color: "orange" });
                      return;
                    }
                    await saveData("consignments", {
                      id: generateId(),
                      seedLotId: consignmentForm.seedLotId,
                      fieldId: consignmentForm.fieldId || undefined,
                      date: consignmentForm.date || new Date().toISOString().slice(0, 10),
                      quantity: consignmentForm.quantity,
                      unit: consignmentForm.unit || "kg",
                      destination: consignmentForm.destination || undefined,
                      sowingDate: consignmentForm.sowingDate || undefined,
                      notes: consignmentForm.notes,
                    } as Consignment);
                    notifications.show({ title: "Success", message: "Consignment saved", color: "green" });
                    await reload();
                    setShowAddConsignment(false);
                    setConsignmentForm({});
                  } catch (e) {
                    notifications.show({ title: "Error", message: e instanceof Error ? e.message : "Failed to save consignment", color: "red" });
                  }
                }}
              >
                Save Consignment
              </Button>
              <Button variant="default" onClick={() => { setShowAddConsignment(false); setConsignmentForm({}); }}>
                Cancel
              </Button>
            </Group>
          </div>
        </Modal>
      )}
    </div>
  );
}

function lotsTreatmentType(type: string): string {
  if (type === "none" || type === "chemical" || type === "biological") return type;
  return "none";
}
