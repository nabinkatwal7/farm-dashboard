"use client";

import { Download, Printer, QrCode, Search } from "lucide-react";
import { useState } from "react";
import Modal from "@/app/abstract/ui/Modal";
import StatCard from "@/app/abstract/ui/StatCard";
import TableSkeleton from "@/app/abstract/ui/TableSkeleton";
import { useFarmData } from "@/app/base/hooks/useFarmData";
import type { BatchRecord } from "@/app/base/services/farm-client";

const ENTITIES = { batches: "batches" } as const;

function downloadSvg(svgText: string, filename: string) {
  const blob = new Blob([svgText], { type: "image/svg+xml" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

async function printSvg(batchCode: string, product: string) {
  const res = await fetch(`/api/qrcode/${encodeURIComponent(batchCode)}`);
  if (!res.ok) return;
  const svgText = await res.text();
  const win = window.open("", "_blank");
  if (!win) return;
  win.document.write(
    `<!DOCTYPE html><html><head><title>QR Code - ${product}</title><style>body{display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0}svg{max-width:90vw;max-height:90vh}</style></head><body>${svgText}</body></html>`,
  );
  win.document.close();
  win.focus();
  win.print();
}

export default function QRCodeGeneratorPage() {
  const { data, reload: load, loading } = useFarmData(ENTITIES);
  const batches = (data.batches ?? []) as BatchRecord[];
  const [search, setSearch] = useState("");
  const [selectedBatch, setSelectedBatch] = useState<BatchRecord | null>(null);

  const filtered = batches.filter(
    (b) =>
      b.batchCode.toLowerCase().includes(search.toLowerCase()) ||
      b.product.toLowerCase().includes(search.toLowerCase()),
  );

  const active = batches.filter((b) => b.status === "active").length;

  if (loading) return <TableSkeleton rows={5} cols={6} />;

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 28 }}>
        <h1
          className="text-primary"
          style={{
            fontSize: "1.6rem",
            fontWeight: 800,
            letterSpacing: "-0.02em",
          }}
        >
          QR Code Generator
        </h1>
        <p
          className="text-muted"
          style={{ fontSize: "0.875rem", marginTop: 4 }}
        >
          Generate printable vector QR codes for product packaging. Each code
          links to the public traceability page.
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
          label="Total batches"
          value={batches.length}
          icon={QrCode}
          color="#60a5fa"
          delay={0}
        />
        <StatCard
          label="Active batches"
          value={active}
          icon={QrCode}
          color="#4ade80"
          delay={60}
        />
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
            gap: 12,
          }}
        >
          <input
            className="farm-input"
            style={{ width: 320 }}
            placeholder="Search by batch code or product..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <table className="farm-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Batch Code</th>
              <th>Processed</th>
              <th>Status</th>
              <th>QR Code</th>
              <th style={{ textAlign: "right" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((batch) => (
              <tr key={batch.id}>
                <td className="text-primary" style={{ fontWeight: 600 }}>
                  {batch.product}
                </td>
                <td
                  style={{ fontFamily: "monospace", fontSize: "0.85rem" }}
                  className="text-secondary"
                >
                  {batch.batchCode}
                </td>
                <td className="text-muted">{batch.processedDate}</td>
                <td>
                  <span
                    className={
                      batch.status === "active"
                        ? "badge-green"
                        : batch.status === "sold"
                          ? "badge-blue"
                          : "badge-red"
                    }
                  >
                    {batch.status}
                  </span>
                </td>
                <td>
                  <img
                    src={`/api/qrcode/${encodeURIComponent(batch.batchCode)}`}
                    alt={`QR for ${batch.batchCode}`}
                    style={{
                      height: 36,
                      width: 36,
                      borderRadius: 6,
                      border: "1px solid var(--border)",
                      objectFit: "contain",
                      cursor: "pointer",
                    }}
                    onClick={() => setSelectedBatch(batch)}
                    title="Click to enlarge"
                  />
                </td>
                <td style={{ textAlign: "right" }}>
                  <div style={{ display: "flex", gap: 4, justifyContent: "flex-end" }}>
                    <button
                      className="btn-ghost"
                      style={{ padding: "4px 8px" }}
                      title="Download SVG"
                      onClick={async () => {
                        const res = await fetch(
                          `/api/qrcode/${encodeURIComponent(batch.batchCode)}`,
                        );
                        if (!res.ok) return;
                        const svg = await res.text();
                        downloadSvg(svg, `qrcode-${batch.batchCode}.svg`);
                      }}
                    >
                      <Download size={14} />
                    </button>
                    <button
                      className="btn-ghost"
                      style={{ padding: "4px 8px" }}
                      title="Print"
                      onClick={() => printSvg(batch.batchCode, batch.product)}
                    >
                      <Printer size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="text-muted"
                  style={{ textAlign: "center", padding: "48px 16px", fontSize: "0.875rem" }}
                >
                  {search
                    ? "No batches match your search."
                    : "No batches found. Create a batch in Inventory first."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {selectedBatch && (
        <Modal
          title={`${selectedBatch.product} — ${selectedBatch.batchCode}`}
          onClose={() => setSelectedBatch(null)}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 20,
            }}
          >
            <img
              src={`/api/qrcode/${encodeURIComponent(selectedBatch.batchCode)}`}
              alt={`QR code for ${selectedBatch.batchCode}`}
              style={{
                height: 256,
                width: 256,
                borderRadius: 12,
                border: "1px solid var(--border)",
                objectFit: "contain",
              }}
            />
            <p
              className="text-muted"
              style={{ textAlign: "center", fontSize: "0.8rem" }}
            >
              Scan to view traceability:{" "}
              <span
                className="text-secondary"
                style={{ fontFamily: "monospace" }}
              >
                /traceability/{selectedBatch.batchCode}
              </span>
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                className="btn-ghost"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "8px 18px",
                }}
                onClick={async () => {
                  const res = await fetch(
                    `/api/qrcode/${encodeURIComponent(selectedBatch.batchCode)}`,
                  );
                  if (!res.ok) return;
                  const svg = await res.text();
                  downloadSvg(svg, `qrcode-${selectedBatch.batchCode}.svg`);
                }}
              >
                <Download size={15} />
                Download SVG
              </button>
              <button
                className="btn-ghost"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "8px 18px",
                }}
                onClick={() =>
                  printSvg(selectedBatch.batchCode, selectedBatch.product)
                }
              >
                <Printer size={15} />
                Print
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
