"use client";

import { Bluetooth, CheckCircle, Plus, Radio, RefreshCw, ScanLine, Trash2, XCircle } from "lucide-react";
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
  type RFIDScanSession,
  type RFIDTagRead,
} from "@/app/base/services/farm-client";

const ENTITIES = {
  sessions: "rfidScanSessions",
  tagReads: "rfidTagReads",
} as const;

export default function RFIDScannerPage() {
  const { data, reload, loading } = useFarmData(ENTITIES);
  const sessions = data.sessions as RFIDScanSession[];
  const tagReads = data.tagReads as RFIDTagRead[];

  const [showNewSession, setShowNewSession] = useState(false);
  const [sessionForm, setSessionForm] = useState<Partial<RFIDScanSession>>({
    name: "", date: new Date().toISOString().slice(0, 10), status: "active",
  });
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [scanInput, setScanInput] = useState("");
  const [scanning, setScanning] = useState(false);
  const [bulkInput, setBulkInput] = useState("");

  const activeSession = sessions.find((s) => s.status === "active") ?? null;
  const activeReads = tagReads.filter((r) => r.sessionId === activeSession?.id);
  const completedSessions = sessions.filter((s) => s.status === "completed");

  const totalScans = sessions.reduce((s, sess) => s + sess.totalScans, 0);
  const totalMatched = sessions.reduce((s, sess) => s + sess.matchedCount, 0);
  const totalUnmatched = sessions.reduce((s, sess) => s + sess.unmatchedCount, 0);
  const matchRate = totalScans > 0 ? ((totalMatched / totalScans) * 100).toFixed(0) : "0";

  async function handleCreateSession() {
    try {
      if (!sessionForm.name?.trim()) {
        notifications.show({ title: "Validation", message: "Session name is required", color: "orange" });
        return;
      }
      await saveData("rfidScanSessions", {
        id: generateId(),
        name: sessionForm.name.trim(),
        date: sessionForm.date ?? new Date().toISOString().slice(0, 10),
        location: sessionForm.location || undefined,
        status: "active",
        totalScans: 0, matchedCount: 0, unmatchedCount: 0,
        notes: sessionForm.notes || undefined,
      } as RFIDScanSession);
      notifications.show({ title: "Success", message: "Scan session created", color: "green" });
      await reload(); setShowNewSession(false);
      setSessionForm({ name: "", date: new Date().toISOString().slice(0, 10), status: "active" });
    } catch (e) {
      notifications.show({ title: "Error", message: e instanceof Error ? e.message : "Failed to create", color: "red" });
    }
  }

  async function handleSingleScan() {
    if (!activeSession || !scanInput.trim()) return;
    setScanning(true);
    try {
      const res = await fetch("/api/livestock/rfid/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "scan", sessionId: activeSession.id, earTag: scanInput.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Scan failed");
      const tag = data.result;
      notifications.show({
        title: tag.status === "matched" ? "Matched" : "Unmatched",
        message: `${tag.earTag} — ${tag.status}`,
        color: tag.status === "matched" ? "green" : "orange",
      });
      setScanInput("");
      await reload();
    } catch (e) {
      notifications.show({ title: "Scan Error", message: e instanceof Error ? e.message : "Failed", color: "red" });
    } finally {
      setScanning(false);
    }
  }

  async function handleBulkScan() {
    if (!activeSession || !bulkInput.trim()) return;
    const earTags = bulkInput.split("\n").map((s) => s.trim()).filter(Boolean);
    if (earTags.length === 0) return;

    setScanning(true);
    try {
      const res = await fetch("/api/livestock/rfid/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "bulk", sessionId: activeSession.id, earTags }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Bulk scan failed");
      const results = data.result as Array<{ earTag: string; status: string }>;
      const matched = results.filter((r) => r.status === "matched").length;
      const unmatched = results.filter((r) => r.status === "unmatched").length;
      notifications.show({
        title: "Bulk Scan Complete",
        message: `${matched} matched, ${unmatched} unmatched`,
        color: unmatched > 0 ? "orange" : "green",
      });
      setBulkInput("");
      await reload();
    } catch (e) {
      notifications.show({ title: "Bulk Scan Error", message: e instanceof Error ? e.message : "Failed", color: "red" });
    } finally {
      setScanning(false);
    }
  }

  async function handleCompleteSession() {
    if (!activeSession) return;
    try {
      const res = await fetch("/api/livestock/rfid/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "complete", sessionId: activeSession.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to complete session");
      notifications.show({ title: "Session Completed", message: "Scan session finalized", color: "green" });
      await reload();
    } catch (e) {
      notifications.show({ title: "Error", message: e instanceof Error ? e.message : "Failed", color: "red" });
    }
  }

  async function handleDeleteSession(id: string) {
    try {
      await deleteData("rfidScanSessions", id);
      notifications.show({ title: "Deleted", message: "Session removed", color: "green" });
      await reload();
    } catch (e) {
      notifications.show({ title: "Error", message: e instanceof Error ? e.message : "Failed to delete", color: "red" });
    }
  }

  if (loading) return <TableSkeleton />;

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 28 }}>
        <h1 className="text-primary" style={{ fontSize: "1.6rem", fontWeight: 800, letterSpacing: "-0.02em" }}>
          EID & RFID Hardware Sync
        </h1>
        <p className="text-muted" style={{ fontSize: "0.875rem", marginTop: 4 }}>
          Real-time data pipeline linking handheld Bluetooth wand scanners for automated population logging during physical animal handling
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 24 }}>
        <StatCard label="Scan Sessions" value={sessions.length} sub={`${completedSessions.length} completed`} icon={Radio} color="#60a5fa" delay={0} />
        <StatCard label="Total Scans" value={totalScans} sub="tag reads captured" icon={ScanLine} color="#4ade80" delay={60} />
        <StatCard label="Match Rate" value={`${matchRate}%`} sub={`${totalMatched} matched`} icon={CheckCircle} color={+matchRate >= 80 ? "#4ade80" : "#fbbf24"} delay={120} />
        <StatCard label="Unmatched Tags" value={totalUnmatched} sub="require manual review" icon={XCircle} color={totalUnmatched > 0 ? "#f87171" : "#4ade80"} delay={180} />
      </div>

      {activeSession && (
        <div className="bg-card border border-border" style={{ borderRadius: 12, padding: 20, marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div>
              <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--color-primary)", margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", background: "#4ade80", animation: "pulse 1.5s infinite" }} />
                Active Session: {activeSession.name}
              </h2>
              <div style={{ fontSize: "0.8rem", color: "var(--color-muted)", marginTop: 2 }}>
                {activeSession.date}{activeSession.location ? ` · ${activeSession.location}` : ""} · {activeReads.length} reads so far
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <Button size="sm" color="green" onClick={handleCompleteSession}>Complete Session</Button>
              <Button size="sm" variant="default" onClick={() => handleDeleteSession(activeSession.id)}>Discard</Button>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
            <div className="bg-background border border-border" style={{ borderRadius: 10, padding: 16 }}>
              <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--color-primary)", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
                <Bluetooth size={16} /> Wand Scanner Input
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  type="text"
                  value={scanInput}
                  onChange={(e) => setScanInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleSingleScan(); }}
                  placeholder="Scan or type EID tag…"
                  style={{
                    flex: 1, padding: "8px 12px", borderRadius: 8, border: "1px solid var(--color-border)",
                    fontSize: "0.9rem", background: "var(--color-bg)", color: "var(--color-primary)",
                  }}
                />
                <Button size="sm" loading={scanning} onClick={handleSingleScan}>Read</Button>
              </div>
              <div style={{ fontSize: "0.75rem", color: "var(--color-muted)", marginTop: 6 }}>
                Press Enter or click Read to submit a tag
              </div>
            </div>

            <div className="bg-background border border-border" style={{ borderRadius: 10, padding: 16 }}>
              <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--color-primary)", marginBottom: 10 }}>
                Bulk Import
              </div>
              <textarea
                value={bulkInput}
                onChange={(e) => setBulkInput(e.target.value)}
                placeholder="Paste multiple EID tags, one per line&#10;e.g.&#10;UK123456789&#10;UK987654321"
                rows={3}
                style={{
                  width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid var(--color-border)",
                  fontSize: "0.85rem", resize: "vertical", background: "var(--color-bg)", color: "var(--color-primary)",
                }}
              />
              <Button size="sm" loading={scanning} onClick={handleBulkScan} style={{ marginTop: 8 }}>
                Import Tags
              </Button>
            </div>
          </div>

          <div>
            <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--color-primary)", marginBottom: 8 }}>
              Recent Reads ({activeReads.length})
            </div>
            <div style={{ maxHeight: 240, overflowY: "auto" }}>
              <table className="farm-table" style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8rem" }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: "left", padding: "6px 10px", borderBottom: "1px solid var(--color-border)", color: "var(--color-muted)", fontWeight: 600 }}>Tag</th>
                    <th style={{ textAlign: "left", padding: "6px 10px", borderBottom: "1px solid var(--color-border)", color: "var(--color-muted)", fontWeight: 600 }}>Animal</th>
                    <th style={{ textAlign: "center", padding: "6px 10px", borderBottom: "1px solid var(--color-border)", color: "var(--color-muted)", fontWeight: 600 }}>Status</th>
                    <th style={{ textAlign: "right", padding: "6px 10px", borderBottom: "1px solid var(--color-border)", color: "var(--color-muted)", fontWeight: 600 }}>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {[...activeReads].reverse().slice(0, 50).map((r) => (
                    <tr key={r.id}>
                      <td style={{ padding: "6px 10px", fontWeight: 600, color: "var(--color-primary)", fontFamily: "monospace" }}>{r.earTag}</td>
                      <td style={{ padding: "6px 10px", color: "var(--color-secondary)" }}>{r.animalEarTag ?? "—"}</td>
                      <td style={{ padding: "6px 10px", textAlign: "center" }}>
                        <span style={{
                          display: "inline-block", padding: "1px 8px", borderRadius: 999, fontSize: "0.7rem", fontWeight: 600,
                          background: r.status === "matched" ? "rgba(74,222,128,0.15)" : "rgba(248,113,113,0.15)",
                          color: r.status === "matched" ? "#4ade80" : "#f87171",
                        }}>
                          {r.status}
                        </span>
                      </td>
                      <td style={{ padding: "6px 10px", textAlign: "right", fontSize: "0.7rem", color: "var(--color-muted)" }}>
                        {new Date(r.timestamp).toLocaleTimeString("en-GB")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      <div className="bg-card border border-border" style={{ borderRadius: 12, padding: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "var(--color-primary)", margin: 0 }}>
            {activeSession ? "Past Sessions" : "Scan Sessions"}
          </h2>
          <Button size="sm" leftSection={<Plus size={14} />} onClick={() => setShowNewSession(true)}>
            New Session
          </Button>
        </div>

        {!activeSession && sessions.length === 0 && (
          <div style={{ textAlign: "center", padding: "40px 20px", fontSize: "0.85rem", color: "var(--color-muted)" }}>
            No scan sessions yet. Create a new session and connect your Bluetooth wand scanner to begin logging animals.
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {(activeSession ? completedSessions : sessions).map((sess) => {
            const sessReads = tagReads.filter((r) => r.sessionId === sess.id);
            return (
              <div key={sess.id} className="bg-background border border-border" style={{ borderRadius: 10, padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 8,
                    background: sess.status === "active" ? "rgba(74,222,128,0.15)" : "rgba(96,165,250,0.15)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <Radio size={18} color={sess.status === "active" ? "#4ade80" : "#60a5fa"} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: "0.9rem", color: "var(--color-primary)" }}>
                      {sess.name}
                      {sess.status === "active" && <span style={{ color: "#4ade80", fontSize: "0.7rem", marginLeft: 6 }}>LIVE</span>}
                    </div>
                    <div style={{ fontSize: "0.8rem", color: "var(--color-muted)" }}>
                      {sess.date}{sess.location ? ` · ${sess.location}` : ""} · {sess.totalScans} scans ({sess.matchedCount} matched, {sess.unmatchedCount} unmatched)
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  {sessReads.length > 0 && (
                    <span style={{ fontSize: "0.75rem", color: "var(--color-muted)", padding: "4px 0" }}>
                      {sessReads.length} reads
                    </span>
                  )}
                  <button onClick={() => handleDeleteSession(sess.id)} style={{
                    background: "rgba(248,113,113,0.15)", border: "1px solid rgba(248,113,113,0.3)", color: "#f87171",
                    borderRadius: 6, padding: "4px 10px", cursor: "pointer", display: "flex", alignItems: "center",
                  }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {showNewSession && (
        <Modal title="New Scan Session" onClose={() => { setShowNewSession(false); setSessionForm({ name: "", date: new Date().toISOString().slice(0, 10), status: "active" }); }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <FormField label="Session Name" name="name" type="text" placeholder="e.g. June Herd Health Check"
              value={String(sessionForm.name ?? "")}
              onChange={(e) => setSessionForm((f) => ({ ...f, name: e.target.value }))}
            />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <FormField label="Date" name="date" type="date"
                value={String(sessionForm.date ?? new Date().toISOString().slice(0, 10))}
                onChange={(e) => setSessionForm((f) => ({ ...f, date: e.target.value }))}
              />
              <FormField label="Location (optional)" name="location" type="text" placeholder="e.g. North Pasture"
                value={String(sessionForm.location ?? "")}
                onChange={(e) => setSessionForm((f) => ({ ...f, location: e.target.value }))}
              />
            </div>
            <FormField as="textarea" label="Notes" name="notes" placeholder="Purpose, herd group, notes..."
              value={String(sessionForm.notes ?? "")}
              onChange={(e) => setSessionForm((f) => ({ ...f, notes: e.target.value }))}
              rows={2}
            />
            <Group grow mt={4}>
              <Button onClick={handleCreateSession}>Start Session</Button>
              <Button variant="default" onClick={() => { setShowNewSession(false); setSessionForm({ name: "", date: new Date().toISOString().slice(0, 10), status: "active" }); }}>Cancel</Button>
            </Group>
          </div>
        </Modal>
      )}
    </div>
  );
}
