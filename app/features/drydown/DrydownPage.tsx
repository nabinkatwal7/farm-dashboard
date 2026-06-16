"use client";

import { Droplets, Factory, Plus, Trash2, Warehouse, Wheat } from "lucide-react";
import { useState } from "react";
import { Button, Group } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import FormField from "@/app/abstract/ui/FormField";
import Modal from "@/app/abstract/ui/Modal";
import StatCard from "@/app/abstract/ui/StatCard";
import TableSkeleton from "@/app/abstract/ui/TableSkeleton";
import { useFarmData } from "@/app/base/hooks/useFarmData";
import {
  deleteData,
  generateId,
  saveData,
  type DrydownBatch,
} from "@/app/base/services/farm-client";

const ENTITIES = {
  drydownBatches: "drydownBatches",
} as const;

const GRAIN_TYPES = ["Corn", "Soybeans", "Wheat", "Canola", "Oats", "Barley", "Rice", "Sorghum", "Sunflower"] as const;
const STORAGE_STATUS = ["drying", "stable", "ready"] as const;
const GRAIN_UNITS = ["lbs", "bushels", "tons", "kg"] as const;

function calcWeightLoss(initialWeight: number, initialMoisture: number, currentMoisture: number): number {
  if (currentMoisture >= 100 || initialMoisture >= 100) return 0;
  const dryMatter = initialWeight * (100 - initialMoisture) / 100;
  const currentWeight = dryMatter / (100 - currentMoisture) * 100;
  return Math.max(0, initialWeight - currentWeight);
}

function formatNumber(n: number): string {
  if (Math.abs(n) >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (Math.abs(n) >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return n.toFixed(1);
}

function formatWeight(n: number, unit: string): string {
  return `${formatNumber(n)} ${unit}`;
}

export default function DrydownPage() {
  const { data, reload, loading } = useFarmData(ENTITIES);
  const batches = data.drydownBatches as DrydownBatch[];

  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState<Partial<DrydownBatch>>({
    grainType: "Corn",
    initialUnit: "lbs",
    status: "drying",
    targetMoisture: 15,
  });
  const [simBatch, setSimBatch] = useState<DrydownBatch | null>(null);
  const [simTarget, setSimTarget] = useState("");

  const totalBatches = batches.length;
  const totalInitialWeight = batches.reduce((s, b) => s + b.initialWeight, 0);
  const avgMoisture = totalBatches > 0 ? batches.reduce((s, b) => s + b.currentMoisture, 0) / totalBatches : 0;
  const totalWeightLoss = batches.reduce((s, b) => s + calcWeightLoss(b.initialWeight, b.initialMoisture, b.currentMoisture), 0);

  async function handleSave() {
    try {
      if (!form.storageName?.trim() || !form.grainType || form.initialMoisture == null || form.currentMoisture == null || !form.initialWeight) {
        notifications.show({ title: "Validation", message: "Storage name, grain type, moisture, and weight are required", color: "orange" });
        return;
      }
      if (form.initialMoisture! <= form.currentMoisture!) {
        notifications.show({ title: "Validation", message: "Current moisture must be less than initial moisture", color: "orange" });
        return;
      }
      await saveData("drydownBatches", {
        id: generateId(),
        storageName: form.storageName.trim(),
        grainType: form.grainType,
        cropYear: form.cropYear ?? new Date().getFullYear(),
        initialMoisture: form.initialMoisture,
        initialWeight: form.initialWeight,
        initialUnit: form.initialUnit ?? "lbs",
        currentMoisture: form.currentMoisture,
        currentTemperature: form.currentTemperature || undefined,
        currentHumidity: form.currentHumidity || undefined,
        targetMoisture: form.targetMoisture || undefined,
        status: form.status ?? "drying",
        notes: form.notes || undefined,
      } as DrydownBatch);
      notifications.show({ title: "Success", message: "Drydown batch added", color: "green" });
      await reload(); setShowAdd(false); setForm({ grainType: "Corn", initialUnit: "lbs", status: "drying", targetMoisture: 15 });
    } catch (e) {
      notifications.show({ title: "Error", message: e instanceof Error ? e.message : "Failed to save", color: "red" });
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteData("drydownBatches", id);
      notifications.show({ title: "Deleted", message: "Batch removed", color: "green" });
      await reload();
    } catch (e) {
      notifications.show({ title: "Error", message: e instanceof Error ? e.message : "Failed to delete", color: "red" });
    }
  }

  function openSimulator(batch: DrydownBatch) {
    setSimBatch(batch);
    setSimTarget(String(batch.targetMoisture ?? batch.currentMoisture));
  }

  if (loading) return <TableSkeleton />;

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 28 }}>
        <h1 className="text-primary" style={{ fontSize: "1.6rem", fontWeight: 800, letterSpacing: "-0.02em" }}>
          Crop Drydown Simulator
        </h1>
        <p className="text-muted" style={{ fontSize: "0.875rem", marginTop: 4 }}>
          Track grain ambient drying speeds within storage sheds and calculate weight loss from moisture evaporation
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 24 }}>
        <StatCard label="Storage Batches" value={totalBatches} sub="active drydown lots" icon={Warehouse} color="#60a5fa" delay={0} />
        <StatCard label="Total Grain In" value={formatNumber(totalInitialWeight)} sub={`${batches[0]?.initialUnit ?? "lbs"} initial`} icon={Wheat} color="#4ade80" delay={60} />
        <StatCard label="Avg Moisture" value={`${avgMoisture.toFixed(1)}%`} sub={totalBatches > 0 ? `${batches.filter((b) => b.status === "drying").length} still drying` : "—"} icon={Droplets} color="#a78bfa" delay={120} />
        <StatCard label="Est. Weight Loss" value={formatNumber(totalWeightLoss)} sub="evaporated moisture" icon={Factory} color={totalWeightLoss > 0 ? "#fbbf24" : "#4ade80"} delay={180} />
      </div>

      <div className="bg-card border border-border" style={{ borderRadius: 12, padding: 20, overflow: "auto" }}>
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
          <Button leftSection={<Plus size={16} />} onClick={() => setShowAdd(true)}>
            Add Batch
          </Button>
        </div>
        <table className="farm-table" style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
          <thead>
            <tr>
              <th style={{ textAlign: "left", padding: "8px 12px", borderBottom: "1px solid var(--color-border)", color: "var(--color-muted)", fontWeight: 600 }}>Storage</th>
              <th style={{ textAlign: "left", padding: "8px 12px", borderBottom: "1px solid var(--color-border)", color: "var(--color-muted)", fontWeight: 600 }}>Grain</th>
              <th style={{ textAlign: "center", padding: "8px 12px", borderBottom: "1px solid var(--color-border)", color: "var(--color-muted)", fontWeight: 600 }}>Year</th>
              <th style={{ textAlign: "center", padding: "8px 12px", borderBottom: "1px solid var(--color-border)", color: "var(--color-muted)", fontWeight: 600 }}>Init Moisture</th>
              <th style={{ textAlign: "center", padding: "8px 12px", borderBottom: "1px solid var(--color-border)", color: "var(--color-muted)", fontWeight: 600 }}>Current</th>
              <th style={{ textAlign: "right", padding: "8px 12px", borderBottom: "1px solid var(--color-border)", color: "var(--color-muted)", fontWeight: 600 }}>Init Weight</th>
              <th style={{ textAlign: "right", padding: "8px 12px", borderBottom: "1px solid var(--color-border)", color: "var(--color-muted)", fontWeight: 600 }}>Weight Loss</th>
              <th style={{ textAlign: "center", padding: "8px 12px", borderBottom: "1px solid var(--color-border)", color: "var(--color-muted)", fontWeight: 600 }}>Status</th>
              <th style={{ textAlign: "right", padding: "8px 12px", borderBottom: "1px solid var(--color-border)", color: "var(--color-muted)", fontWeight: 600 }}></th>
            </tr>
          </thead>
          <tbody>
            {batches.map((b) => {
              const loss = calcWeightLoss(b.initialWeight, b.initialMoisture, b.currentMoisture);
              const daysInStorage = b.createdAt ? Math.floor((Date.now() - new Date(b.createdAt).getTime()) / 86400000) : 0;
              return (
                <tr key={b.id}>
                  <td style={{ padding: "10px 12px", fontWeight: 600, color: "var(--color-primary)" }}>{b.storageName}</td>
                  <td style={{ padding: "10px 12px", color: "var(--color-secondary)" }}>{b.grainType}</td>
                  <td style={{ padding: "10px 12px", textAlign: "center" }}>{b.cropYear}</td>
                  <td style={{ padding: "10px 12px", textAlign: "center" }}>{b.initialMoisture.toFixed(1)}%</td>
                  <td style={{ padding: "10px 12px", textAlign: "center" }}>
                    <span style={{ fontWeight: 600, color: b.currentMoisture > (b.targetMoisture ?? 15) ? "#fbbf24" : "#4ade80" }}>
                      {b.currentMoisture.toFixed(1)}%
                    </span>
                    {b.currentTemperature != null && (
                      <span style={{ fontSize: "0.75rem", color: "var(--color-muted)", marginLeft: 6 }}>
                        {b.currentTemperature}°C
                      </span>
                    )}
                  </td>
                  <td style={{ padding: "10px 12px", textAlign: "right" }}>{formatWeight(b.initialWeight, b.initialUnit)}</td>
                  <td style={{ padding: "10px 12px", textAlign: "right", color: loss > 0 ? "#f87171" : "var(--color-secondary)" }}>
                    {loss > 0 ? `-${formatWeight(loss, b.initialUnit)}` : "—"}
                  </td>
                  <td style={{ padding: "10px 12px", textAlign: "center" }}>
                    <span style={{
                      display: "inline-block",
                      padding: "2px 10px",
                      borderRadius: 999,
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      background: b.status === "drying" ? "rgba(251,191,36,0.15)" : b.status === "stable" ? "rgba(74,222,128,0.15)" : "rgba(96,165,250,0.15)",
                      color: b.status === "drying" ? "#fbbf24" : b.status === "stable" ? "#4ade80" : "#60a5fa",
                    }}>
                      {b.status}
                    </span>
                    {daysInStorage > 0 && (
                      <span style={{ fontSize: "0.7rem", color: "var(--color-muted)", marginLeft: 6, display: "block" }}>
                        {daysInStorage}d
                      </span>
                    )}
                  </td>
                  <td style={{ padding: "10px 12px", textAlign: "right" }}>
                    <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                      <button
                        onClick={() => openSimulator(b)}
                        style={{
                          background: "rgba(96,165,250,0.15)", border: "1px solid rgba(96,165,250,0.3)", color: "#60a5fa",
                          borderRadius: 6, padding: "4px 10px", fontSize: "0.75rem", cursor: "pointer",
                        }}
                        title="Simulate drying"
                      >
                        <Factory size={14} />
                      </button>
                      <button
                        onClick={() => handleDelete(b.id)}
                        style={{
                          background: "rgba(248,113,113,0.15)", border: "1px solid rgba(248,113,113,0.3)", color: "#f87171",
                          borderRadius: 6, padding: "4px 10px", fontSize: "0.75rem", cursor: "pointer",
                        }}
                        title="Delete batch"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {batches.length === 0 && (
              <tr>
                <td colSpan={9} style={{ textAlign: "center", padding: "40px 20px", fontSize: "0.85rem", color: "var(--color-muted)" }}>
                  No drydown batches. Add a batch to start tracking post-harvest grain moisture.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showAdd && (
        <Modal title="Add Drydown Batch" onClose={() => { setShowAdd(false); setForm({ grainType: "Corn", initialUnit: "lbs", status: "drying", targetMoisture: 15 }); }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <FormField label="Storage Name" name="storageName" type="text" placeholder="e.g. North Silo, Bin 3"
                value={String(form.storageName ?? "")}
                onChange={(e) => setForm((f) => ({ ...f, storageName: e.target.value }))}
              />
              <FormField as="select" label="Grain Type" name="grainType"
                value={form.grainType ?? "Corn"}
                onChange={(e) => setForm((f) => ({ ...f, grainType: e.target.value }))}
              >
                {GRAIN_TYPES.map((g) => <option key={g} value={g}>{g}</option>)}
              </FormField>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
              <FormField label="Crop Year" name="cropYear" type="number"
                value={String(form.cropYear ?? new Date().getFullYear())}
                onChange={(e) => setForm((f) => ({ ...f, cropYear: +e.target.value }))}
              />
              <FormField label="Initial Moisture %" name="initialMoisture" type="number" placeholder="e.g. 25" step="0.1"
                value={String(form.initialMoisture ?? "")}
                onChange={(e) => setForm((f) => ({ ...f, initialMoisture: +e.target.value }))}
              />
              <FormField label="Current Moisture %" name="currentMoisture" type="number" placeholder="e.g. 18" step="0.1"
                value={String(form.currentMoisture ?? "")}
                onChange={(e) => setForm((f) => ({ ...f, currentMoisture: +e.target.value }))}
              />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
              <FormField label="Initial Weight" name="initialWeight" type="number" placeholder="e.g. 50000"
                value={String(form.initialWeight ?? "")}
                onChange={(e) => setForm((f) => ({ ...f, initialWeight: +e.target.value }))}
              />
              <FormField as="select" label="Weight Unit" name="initialUnit"
                value={form.initialUnit ?? "lbs"}
                onChange={(e) => setForm((f) => ({ ...f, initialUnit: e.target.value }))}
              >
                {GRAIN_UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
              </FormField>
              <FormField label="Target Moisture %" name="targetMoisture" type="number" placeholder="e.g. 15" step="0.1"
                value={String(form.targetMoisture ?? "")}
                onChange={(e) => setForm((f) => ({ ...f, targetMoisture: +e.target.value }))}
              />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <FormField label="Temperature (°C)" name="currentTemperature" type="number" placeholder="Ambient"
                value={String(form.currentTemperature ?? "")}
                onChange={(e) => setForm((f) => ({ ...f, currentTemperature: +e.target.value }))}
              />
              <FormField label="Humidity (%)" name="currentHumidity" type="number" placeholder="Ambient"
                value={String(form.currentHumidity ?? "")}
                onChange={(e) => setForm((f) => ({ ...f, currentHumidity: +e.target.value }))}
              />
            </div>
            <FormField as="select" label="Status" name="status"
              value={form.status ?? "drying"}
              onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as DrydownBatch["status"] }))}
            >
              {STORAGE_STATUS.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
            </FormField>
            <FormField as="textarea" label="Notes" name="notes" placeholder="Storage conditions, observations..."
              value={String(form.notes ?? "")}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              rows={2}
            />
            <Group grow mt={4}>
              <Button onClick={handleSave}>Save Batch</Button>
              <Button variant="default" onClick={() => { setShowAdd(false); setForm({ grainType: "Corn", initialUnit: "lbs", status: "drying", targetMoisture: 15 }); }}>Cancel</Button>
            </Group>
          </div>
        </Modal>
      )}

      {simBatch && (
        <Modal title={`Drydown Simulator — ${simBatch.storageName}`} onClose={() => { setSimBatch(null); setSimTarget(""); }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ background: "rgba(96,165,250,0.08)", borderRadius: 10, padding: 16, fontSize: "0.85rem", lineHeight: 1.7 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 20px" }}>
                <span style={{ color: "var(--color-muted)" }}>Grain:</span><span style={{ fontWeight: 600 }}>{simBatch.grainType}</span>
                <span style={{ color: "var(--color-muted)" }}>Initial moisture:</span><span>{simBatch.initialMoisture.toFixed(1)}%</span>
                <span style={{ color: "var(--color-muted)" }}>Current moisture:</span><span>{simBatch.currentMoisture.toFixed(1)}%</span>
                <span style={{ color: "var(--color-muted)" }}>Initial weight:</span><span>{formatWeight(simBatch.initialWeight, simBatch.initialUnit)}</span>
                <span style={{ color: "var(--color-muted)" }}>Dry matter:</span><span style={{ fontWeight: 600 }}>{(simBatch.initialWeight * (100 - simBatch.initialMoisture) / 100).toFixed(1)} {simBatch.initialUnit}</span>
              </div>
            </div>

            <FormField label="Target moisture %" name="simTarget" type="number" placeholder="e.g. 14" step="0.1"
              value={simTarget}
              onChange={(e) => setSimTarget(e.target.value)}
            />

            {(() => {
              const target = parseFloat(simTarget);
              if (!target || target <= 0 || target >= 100) return null;
              const dryMatter = simBatch.initialWeight * (100 - simBatch.initialMoisture) / 100;
              const estWeight = dryMatter / (100 - target) * 100;
              const estLoss = simBatch.initialWeight - estWeight;
              const currentDryMatter = simBatch.initialWeight * (100 - simBatch.initialMoisture) / 100;
              const currentWeight = currentDryMatter / (100 - simBatch.currentMoisture) * 100;
              const remainingLoss = target < simBatch.currentMoisture ? currentWeight - estWeight : 0;
              return (
                <div style={{ background: "rgba(74,222,128,0.08)", borderRadius: 10, padding: 16, fontSize: "0.9rem", lineHeight: 2 }}>
                  <div style={{ fontWeight: 700, fontSize: "1rem", marginBottom: 6 }}>Simulation Results</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2px 20px" }}>
                    <span style={{ color: "var(--color-muted)" }}>Estimated dry weight at {target.toFixed(1)}%:</span>
                    <span style={{ fontWeight: 600 }}>{formatWeight(estWeight, simBatch.initialUnit)}</span>
                    <span style={{ color: "var(--color-muted)" }}>Total weight loss:</span>
                    <span style={{ color: "#f87171", fontWeight: 600 }}>{formatWeight(estLoss, simBatch.initialUnit)}</span>
                    <span style={{ color: "var(--color-muted)" }}>Weight loss %:</span>
                    <span style={{ fontWeight: 600 }}>{(estLoss / simBatch.initialWeight * 100).toFixed(1)}%</span>
                    {remainingLoss > 0 && (
                      <>
                        <span style={{ color: "var(--color-muted)" }}>Remaining drying loss:</span>
                        <span style={{ color: "#fbbf24", fontWeight: 600 }}>{formatWeight(remainingLoss, simBatch.initialUnit)}</span>
                      </>
                    )}
                  </div>
                </div>
              );
            })()}

            <Group grow mt={4}>
              <Button variant="default" onClick={() => { setSimBatch(null); setSimTarget(""); }}>Close</Button>
            </Group>
          </div>
        </Modal>
      )}
    </div>
  );
}
