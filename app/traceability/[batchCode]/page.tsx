"use client";

import { CheckCircle, Clock, Eye, Leaf, MapPin, Package, Wheat } from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useState } from "react";

const PublicFieldMap = dynamic(() => import("@/app/components/PublicFieldMap"), {
  ssr: false,
  loading: () => (
    <div style={{ height: 280, background: "#f9fafb", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.85rem", color: "#9ca3af" }}>
      Loading map…
    </div>
  ),
});

type TraceData = {
  found: boolean;
  batch: {
    batchCode: string; product: string; origin: string; originType: string;
    processedDate: string; quantity: number; unit: string; status: string;
  } | null;
  productInfo: { name: string; category: string } | null;
  field: { name: string; acres: number; lat: number; lng: number; boundary: Array<{ lat: number; lng: number }>; currentCrop: string } | null;
  yields: Array<{ year: number; crop: string; actual: number; unit: string }>;
  rotations: Array<{ year: number; crop: string }>;
  animals: Array<{ earTag: string; species: string; breed: string; sex: string; dob: string }>;
  saleDate: string | null;
};

export default function BatchTraceabilityPage({ params }: { params: Promise<{ batchCode: string }> }) {
  const [data, setData] = useState<TraceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [batchCode, setBatchCode] = useState("");

  useEffect(() => {
    params.then((p) => setBatchCode(p.batchCode));
  }, [params]);

  useEffect(() => {
    if (!batchCode) return;
    setLoading(true);
    fetch(`/api/public/traceability/${encodeURIComponent(batchCode)}`)
      .then((res) => res.json())
      .then((json) => {
        if (json.error) { setError(json.error); setData(null); }
        else { setData(json); setError(null); }
      })
      .catch(() => setError("Failed to load traceability data"))
      .finally(() => setLoading(false));
  }, [batchCode]);

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#f0fdf4", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "system-ui, -apple-system, sans-serif" }}>
        <div style={{ textAlign: "center", color: "#6b7280" }}>
          <Leaf size={32} style={{ margin: "0 auto 12px", display: "block", opacity: 0.5 }} />
          <div style={{ fontSize: "0.9rem" }}>Looking up batch…</div>
        </div>
      </div>
    );
  }

  if (error || (data && !data.found)) {
    return (
      <div style={{ minHeight: "100vh", background: "#f0fdf4", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "system-ui, -apple-system, sans-serif" }}>
        <div style={{ maxWidth: 420, padding: 24, textAlign: "center" }}>
          <div style={{ width: 64, height: 64, borderRadius: "50%", background: "#fef2f2", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
            <Eye size={28} color="#ef4444" />
          </div>
          <h2 style={{ fontSize: "1.3rem", fontWeight: 700, color: "#111827", margin: "0 0 8px" }}>Batch Not Found</h2>
          <p style={{ fontSize: "0.9rem", color: "#6b7280", margin: "0 0 24px" }}>
            {error ? "Unable to load traceability data. Please try again." : `No batch found with code "${batchCode}". Check your code and try again.`}
          </p>
          <Link href="/traceability" style={{ color: "#16a34a", fontWeight: 600, fontSize: "0.9rem" }}>← Back to search</Link>
        </div>
      </div>
    );
  }

  if (!data || !data.batch) return null;

  const { batch, productInfo, field, yields, rotations, animals, saleDate } = data;
  const timeline = [
    { label: "Harvested", date: yields.length > 0 ? String(yields[yields.length - 1].year) : batch.processedDate, icon: Wheat },
    { label: "Processed", date: batch.processedDate, icon: Package },
    ...(saleDate ? [{ label: "Sold", date: saleDate, icon: CheckCircle }] : []),
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#f0fdf4", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <div style={{ background: "white", borderBottom: "1px solid #e5e7eb" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", padding: "16px 24px", display: "flex", alignItems: "center", gap: 10 }}>
          <Leaf size={20} color="#16a34a" />
          <span style={{ fontWeight: 700, color: "#166534", fontSize: "0.95rem" }}>Traceability Portal</span>
          <span style={{ color: "#d1d5db" }}>/</span>
          <span style={{ color: "#6b7280", fontSize: "0.85rem", fontFamily: "monospace" }}>{batch.batchCode}</span>
          <div style={{ marginLeft: "auto" }}>
            <Link href="/traceability" style={{ fontSize: "0.8rem", color: "#16a34a" }}>New Search</Link>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "32px 24px 60px" }}>
        <div style={{ background: "white", borderRadius: 16, padding: 32, boxShadow: "0 4px 24px rgba(0,0,0,0.06)", border: "1px solid #e5e7eb", marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
            <div>
              <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#111827", margin: "0 0 4px", letterSpacing: "-0.02em" }}>
                {batch.product}
              </h1>
              <p style={{ fontSize: "0.85rem", color: "#6b7280", margin: 0 }}>
                Batch {batch.batchCode} · {batch.quantity} {batch.unit}
              </p>
            </div>
            <span style={{
              display: "inline-block", padding: "4px 14px", borderRadius: 999, fontSize: "0.75rem", fontWeight: 600,
              background: batch.status === "active" ? "rgba(34,197,94,0.12)" : batch.status === "sold" ? "rgba(59,130,246,0.12)" : "rgba(239,68,68,0.12)",
              color: batch.status === "active" ? "#16a34a" : batch.status === "sold" ? "#2563eb" : "#dc2626",
            }}>
              {batch.status}
            </span>
          </div>

          {productInfo && (
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 24 }}>
              <div style={{ background: "#f0fdf4", borderRadius: 8, padding: "8px 14px", fontSize: "0.8rem" }}>
                <span style={{ color: "#6b7280" }}>Category: </span>
                <span style={{ fontWeight: 600, color: "#166534" }}>{productInfo.category}</span>
              </div>
              <div style={{ background: "#f0fdf4", borderRadius: 8, padding: "8px 14px", fontSize: "0.8rem" }}>
                <span style={{ color: "#6b7280" }}>Origin: </span>
                <span style={{ fontWeight: 600, color: "#166534" }}>{batch.origin} ({batch.originType})</span>
              </div>
            </div>
          )}

          <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "#111827", margin: "0 0 16px" }}>Timeline</h2>
          <div style={{ display: "flex", gap: 0, alignItems: "flex-start" }}>
            {timeline.map((item, i) => (
              <div key={item.label} style={{ flex: 1, position: "relative", paddingLeft: i > 0 ? 0 : 0 }}>
                {i > 0 && <div style={{ position: "absolute", top: 16, left: "-50%", width: "100%", height: 2, background: "#dcfce7", zIndex: 0 }} />}
                <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#dcfce7", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <item.icon size={16} color="#16a34a" />
                  </div>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontWeight: 600, fontSize: "0.8rem", color: "#111827" }}>{item.label}</div>
                    <div style={{ fontSize: "0.75rem", color: "#6b7280" }}>{item.date}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {field && (
          <div style={{ background: "white", borderRadius: 16, padding: 32, boxShadow: "0 4px 24px rgba(0,0,0,0.06)", border: "1px solid #e5e7eb", marginBottom: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "#111827", margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
                <MapPin size={18} color="#16a34a" /> Field Origin
              </h2>
              <div style={{ fontSize: "0.8rem", color: "#6b7280" }}>
                {field.acres} acres · Current: {field.currentCrop}
              </div>
            </div>

            {field.boundary.length >= 3 && (
              <div style={{ borderRadius: 12, overflow: "hidden", marginBottom: 16 }}>
                <PublicFieldMap boundary={field.boundary} fieldName={field.name} />
              </div>
            )}

            {yields.length > 0 && (
              <div>
                <h3 style={{ fontSize: "0.9rem", fontWeight: 600, color: "#111827", margin: "0 0 10px" }}>Harvest History</h3>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: "left", padding: "8px 12px", borderBottom: "1px solid #e5e7eb", color: "#6b7280", fontWeight: 600 }}>Year</th>
                      <th style={{ textAlign: "left", padding: "8px 12px", borderBottom: "1px solid #e5e7eb", color: "#6b7280", fontWeight: 600 }}>Crop</th>
                      <th style={{ textAlign: "right", padding: "8px 12px", borderBottom: "1px solid #e5e7eb", color: "#6b7280", fontWeight: 600 }}>Yield</th>
                    </tr>
                  </thead>
                  <tbody>
                    {yields.map((y) => (
                      <tr key={`${y.year}-${y.crop}`}>
                        <td style={{ padding: "8px 12px", color: "#111827", fontWeight: 500 }}>{y.year}</td>
                        <td style={{ padding: "8px 12px", color: "#374151" }}>{y.crop}</td>
                        <td style={{ padding: "8px 12px", textAlign: "right", color: "#374151" }}>{y.actual.toLocaleString()} {y.unit}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {rotations.length > 1 && (
              <div style={{ marginTop: 16, display: "flex", gap: 8, flexWrap: "wrap" }}>
                <span style={{ fontSize: "0.8rem", color: "#6b7280", padding: "4px 0" }}>Crop rotation: </span>
                {rotations.map((r) => (
                  <span key={`${r.year}-${r.crop}`} style={{
                    background: "#f0fdf4", color: "#166534", padding: "2px 10px", borderRadius: 999, fontSize: "0.75rem", fontWeight: 500,
                  }}>
                    {r.crop} ({r.year})
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {animals.length > 0 && (
          <div style={{ background: "white", borderRadius: 16, padding: 32, boxShadow: "0 4px 24px rgba(0,0,0,0.06)", border: "1px solid #e5e7eb", marginBottom: 20 }}>
            <h2 style={{ fontSize: "1rem", fontWeight: 700, color: "#111827", margin: "0 0 16px", display: "flex", alignItems: "center", gap: 8 }}>
              <Leaf size={18} color="#16a34a" /> Animal Breed History
            </h2>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
              <thead>
                <tr>
                  <th style={{ textAlign: "left", padding: "8px 12px", borderBottom: "1px solid #e5e7eb", color: "#6b7280", fontWeight: 600 }}>Tag</th>
                  <th style={{ textAlign: "left", padding: "8px 12px", borderBottom: "1px solid #e5e7eb", color: "#6b7280", fontWeight: 600 }}>Species</th>
                  <th style={{ textAlign: "left", padding: "8px 12px", borderBottom: "1px solid #e5e7eb", color: "#6b7280", fontWeight: 600 }}>Breed</th>
                  <th style={{ textAlign: "center", padding: "8px 12px", borderBottom: "1px solid #e5e7eb", color: "#6b7280", fontWeight: 600 }}>DOB</th>
                </tr>
              </thead>
              <tbody>
                {animals.slice(0, 20).map((a) => (
                  <tr key={a.earTag}>
                    <td style={{ padding: "8px 12px", fontWeight: 600, color: "#111827", fontFamily: "monospace" }}>{a.earTag}</td>
                    <td style={{ padding: "8px 12px", color: "#374151", textTransform: "capitalize" }}>{a.species}</td>
                    <td style={{ padding: "8px 12px", color: "#374151" }}>{a.breed}</td>
                    <td style={{ padding: "8px 12px", textAlign: "center", color: "#6b7280" }}>{a.dob}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {animals.length > 20 && (
              <div style={{ textAlign: "center", marginTop: 12, fontSize: "0.8rem", color: "#9ca3af" }}>
                Showing 20 of {animals.length} animals
              </div>
            )}
          </div>
        )}

        <div style={{ textAlign: "center", padding: "24px 0 0" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginBottom: 8 }}>
            <Leaf size={14} color="#22c55e" />
            <span style={{ fontSize: "0.8rem", color: "#9ca3af" }}>Verified by FieldPilot Traceability Portal</span>
          </div>
          <Link href="/traceability" style={{ fontSize: "0.8rem", color: "#16a34a" }}>← Search another batch</Link>
        </div>
      </div>
    </div>
  );
}
