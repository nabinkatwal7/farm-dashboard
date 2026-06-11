"use client";

import {
  AlertTriangle,
  ArrowRight,
  Package,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import Modal from "../components/Modal";
import StatCard from "../components/StatCard";
import {
  deleteData,
  generateId,
  getData,
  saveData,
  type BatchRecord,
  type StockAdjustment,
  type StockItem,
} from "../lib/store";

type Tab = "stock" | "batches";

const CATEGORY_COLORS: Record<string, string> = {
  raw: "#4ade80",
  processed: "#a78bfa",
  packaging: "#60a5fa",
  supplies: "#fbbf24",
};

export default function InventoryPage() {
  const [tab, setTab] = useState<Tab>("stock");
  const [stock, setStock] = useState<StockItem[]>([]);
  const [batches, setBatches] = useState<BatchRecord[]>([]);
  const [search, setSearch] = useState("");
  const [traceSearch, setTraceSearch] = useState("");
  const [showAddStock, setShowAddStock] = useState(false);
  const [showAddBatch, setShowAddBatch] = useState(false);
  const [stockForm, setStockForm] = useState<Partial<StockItem>>({});
  const [batchForm, setBatchForm] = useState<Partial<BatchRecord>>({});
  const [showAdjust, setShowAdjust] = useState(false);
  const [adjustItem, setAdjustItem] = useState<StockItem | null>(null);
  const [adjustForm, setAdjustForm] = useState({
    delta: 0,
    reason: "",
    operator: "",
  });

  const load = useCallback(async () => {
    setStock(await getData<StockItem>("stockItems"));
    setBatches(await getData<BatchRecord>("batches"));
  }, []);

  useEffect(() => {
    void Promise.resolve().then(load);
  }, [load]);

  const saveStock = async () => {
    if (!stockForm.name) return;
    await saveData("stockItems", {
      id: generateId(),
      category: "raw",
      subCategory: "",
      minStock: 10,
      unit: "units",
      location: "Main Store",
      updatedAt: new Date().toISOString().slice(0, 10),
      ...stockForm,
    } as StockItem);
    await load();
    setShowAddStock(false);
    setStockForm({});
  };

  const saveAdjustment = async () => {
    if (!adjustItem) return;
    await saveData<StockAdjustment>("stockAdjustments", {
      id: generateId(),
      stockItemId: adjustItem.id,
      stockItemName: adjustItem.name,
      date: new Date().toISOString().slice(0, 10),
      delta: adjustForm.delta,
      reason: adjustForm.reason,
      operator: adjustForm.operator,
    });
    await load();
    setShowAdjust(false);
    setAdjustItem(null);
    setAdjustForm({ delta: 0, reason: "", operator: "" });
  };

  const saveBatch = async () => {
    if (!batchForm.batchCode) return;
    await saveData("batches", {
      id: generateId(),
      status: "active",
      processedDate: new Date().toISOString().slice(0, 10),
      ...batchForm,
    } as BatchRecord);
    await load();
    setShowAddBatch(false);
    setBatchForm({});
  };

  const filteredStock = stock.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.category.toLowerCase().includes(search.toLowerCase()) ||
      s.location.toLowerCase().includes(search.toLowerCase()),
  );

  const traceResult = traceSearch
    ? batches.find(
        (b) =>
          b.batchCode.toLowerCase().includes(traceSearch.toLowerCase()) ||
          b.product.toLowerCase().includes(traceSearch.toLowerCase()),
      )
    : null;

  const lowStock = stock.filter((s) => s.quantity <= s.minStock);
  const totalValue = stock.reduce((s, item) => s + item.quantity, 0);

  return (
    <div style={{ padding: "32px 32px 48px" }}>
      <div style={{ marginBottom: 28 }}>
        <h1
          style={{
            fontSize: "1.6rem",
            fontWeight: 800,
            color: "var(--text-primary)",
            letterSpacing: "-0.02em",
          }}
        >
          📦 Inventory & Traceability
        </h1>
        <p
          style={{
            color: "var(--text-muted)",
            fontSize: "0.875rem",
            marginTop: 4,
          }}
        >
          Real-time stock tracking and full batch traceability from product to
          origin
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
          label="Stock Lines"
          value={stock.length}
          sub={`${totalValue.toLocaleString()} units total`}
          icon={Package}
          color="#2dd4bf"
          delay={0}
        />
        <StatCard
          label="Low Stock Alerts"
          value={lowStock.length}
          icon={AlertTriangle}
          color={lowStock.length > 0 ? "#f87171" : "#4ade80"}
          delay={60}
        />
        <StatCard
          label="Active Batches"
          value={batches.filter((b) => b.status === "active").length}
          icon={Search}
          color="#a78bfa"
          delay={120}
        />
        <StatCard
          label="Processed Items"
          value={stock.filter((s) => s.category === "processed").length}
          sub="value-added products"
          icon={ArrowRight}
          color="#fbbf24"
          delay={180}
        />
      </div>

      {/* Tabs */}
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
            ["stock", "📦 Stock Management"],
            ["batches", "🔍 Batch Tracker"],
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
              background: tab === t ? "rgba(45,212,191,0.15)" : "transparent",
              color: tab === t ? "#2dd4bf" : "var(--text-secondary)",
              transition: "all 0.15s",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Stock Management */}
      {tab === "stock" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {lowStock.length > 0 && (
            <div
              style={{
                background: "rgba(248,113,113,0.06)",
                border: "1px solid rgba(248,113,113,0.2)",
                borderRadius: 10,
                padding: "12px 16px",
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <AlertTriangle size={16} color="#f87171" />
              <span
                style={{
                  color: "#f87171",
                  fontWeight: 600,
                  fontSize: "0.85rem",
                }}
              >
                {lowStock.length} item{lowStock.length !== 1 ? "s" : ""} below
                minimum stock level:
              </span>
              <span style={{ color: "var(--text-muted)", fontSize: "0.8rem" }}>
                {lowStock.map((s) => s.name).join(", ")}
              </span>
            </div>
          )}

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
                gap: 12,
              }}
            >
              <input
                className="farm-input"
                style={{ width: 280 }}
                placeholder="🔍 Search stock…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <button
                className="btn-primary"
                onClick={() => setShowAddStock(true)}
              >
                <Plus size={14} /> Add Stock Item
              </button>
            </div>
            <table className="farm-table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Item</th>
                  <th>Quantity</th>
                  <th>Unit</th>
                  <th>Min Stock</th>
                  <th>Location</th>
                  <th>Origin</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredStock.map((item) => {
                  const isLow = item.quantity <= item.minStock;
                  return (
                    <tr key={item.id}>
                      <td>
                        <span
                          style={{
                            background: `${CATEGORY_COLORS[item.category] ?? "#60a5fa"}18`,
                            color: CATEGORY_COLORS[item.category] ?? "#60a5fa",
                            border: `1px solid ${CATEGORY_COLORS[item.category] ?? "#60a5fa"}30`,
                            padding: "2px 8px",
                            borderRadius: 6,
                            fontSize: "0.72rem",
                            fontWeight: 600,
                          }}
                        >
                          {item.category}
                        </span>
                      </td>
                      <td
                        style={{
                          fontWeight: 500,
                          color: "var(--text-primary)",
                        }}
                      >
                        {item.name}
                      </td>
                      <td
                        style={{
                          color: isLow ? "#f87171" : "var(--text-primary)",
                          fontWeight: isLow ? 700 : 400,
                        }}
                      >
                        {item.quantity.toLocaleString()}
                      </td>
                      <td>{item.unit}</td>
                      <td style={{ color: "var(--text-muted)" }}>
                        {item.minStock}
                      </td>
                      <td style={{ color: "var(--text-muted)" }}>
                        {item.location}
                      </td>
                      <td
                        style={{
                          fontSize: "0.78rem",
                          color: "var(--text-muted)",
                        }}
                      >
                        {item.fieldOrigin
                          ? `🌾 ${item.fieldOrigin}`
                          : item.animalOrigin
                            ? `🐾 ${item.animalOrigin}`
                            : "—"}
                      </td>
                      <td>
                        {isLow ? (
                          <span className="badge-red">Low Stock</span>
                        ) : (
                          <span className="badge-green">OK</span>
                        )}
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button
                            className="btn-ghost"
                            title="Adjust quantity"
                            style={{ padding: "4px 8px" }}
                            onClick={() => {
                              setAdjustItem(item);
                              setAdjustForm({
                                delta: 0,
                                reason: "",
                                operator: "",
                              });
                              setShowAdjust(true);
                            }}
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            className="btn-danger"
                            title="Delete item"
                            style={{ padding: "4px 8px" }}
                            onClick={async () => {
                              await deleteData("stockItems", item.id);
                              await load();
                            }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Batch Tracker */}
      {tab === "batches" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Trace search */}
          <div
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              padding: "20px",
            }}
          >
            <div
              style={{
                fontWeight: 600,
                fontSize: "0.9rem",
                marginBottom: 12,
                color: "var(--text-primary)",
              }}
            >
              🔍 Batch Traceability Search
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <input
                className="farm-input"
                placeholder="Enter batch code or product name…"
                value={traceSearch}
                onChange={(e) => setTraceSearch(e.target.value)}
              />
            </div>
            {traceResult && (
              <div
                style={{
                  marginTop: 16,
                  padding: "16px",
                  borderRadius: 8,
                  background: "rgba(74,222,128,0.06)",
                  border: "1px solid rgba(74,222,128,0.2)",
                }}
              >
                <div
                  style={{
                    fontWeight: 700,
                    color: "#4ade80",
                    fontSize: "0.9rem",
                    marginBottom: 8,
                  }}
                >
                  ✓ Traceability Chain Found
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 10,
                    fontSize: "0.82rem",
                  }}
                >
                  <div>
                    <span style={{ color: "var(--text-muted)" }}>
                      Batch Code:{" "}
                    </span>
                    <span
                      style={{
                        fontWeight: 700,
                        fontFamily: "monospace",
                        color: "var(--text-primary)",
                      }}
                    >
                      {traceResult.batchCode}
                    </span>
                  </div>
                  <div>
                    <span style={{ color: "var(--text-muted)" }}>
                      Product:{" "}
                    </span>
                    <span style={{ color: "var(--text-primary)" }}>
                      {traceResult.product}
                    </span>
                  </div>
                  <div>
                    <span style={{ color: "var(--text-muted)" }}>
                      Origin Type:{" "}
                    </span>
                    <span
                      className={
                        traceResult.originType === "field"
                          ? "badge-green"
                          : "badge-blue"
                      }
                    >
                      {traceResult.originType}
                    </span>
                  </div>
                  <div>
                    <span style={{ color: "var(--text-muted)" }}>Origin: </span>
                    <span
                      style={{ color: "var(--text-primary)", fontWeight: 600 }}
                    >
                      {traceResult.originType === "field" ? "🌾" : "🐾"}{" "}
                      {traceResult.origin}
                    </span>
                  </div>
                  <div>
                    <span style={{ color: "var(--text-muted)" }}>
                      Processed:{" "}
                    </span>
                    <span style={{ color: "var(--text-primary)" }}>
                      {new Date(traceResult.processedDate).toLocaleDateString(
                        "en-GB",
                      )}
                    </span>
                  </div>
                  <div>
                    <span style={{ color: "var(--text-muted)" }}>
                      Quantity:{" "}
                    </span>
                    <span style={{ color: "var(--text-primary)" }}>
                      {traceResult.quantity} {traceResult.unit}
                    </span>
                  </div>
                </div>
              </div>
            )}
            {traceSearch && !traceResult && (
              <div
                style={{
                  marginTop: 12,
                  color: "var(--text-muted)",
                  fontSize: "0.85rem",
                }}
              >
                No batch found matching &quot;{traceSearch}&quot;
              </div>
            )}
          </div>

          {/* Batch list */}
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
                All Batches
              </span>
              <button
                className="btn-primary"
                onClick={() => setShowAddBatch(true)}
              >
                <Plus size={14} /> Create Batch
              </button>
            </div>
            <table className="farm-table">
              <thead>
                <tr>
                  <th>Batch Code</th>
                  <th>Product</th>
                  <th>Origin</th>
                  <th>Type</th>
                  <th>Processed</th>
                  <th>Quantity</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {batches.map((b) => (
                  <tr key={b.id}>
                    <td
                      style={{
                        fontFamily: "monospace",
                        fontWeight: 700,
                        color: "#4ade80",
                        fontSize: "0.8rem",
                      }}
                    >
                      {b.batchCode}
                    </td>
                    <td style={{ color: "var(--text-primary)" }}>
                      {b.product}
                    </td>
                    <td>
                      {b.originType === "field" ? "🌾" : "🐾"} {b.origin}
                    </td>
                    <td>
                      <span
                        className={
                          b.originType === "field"
                            ? "badge-green"
                            : "badge-blue"
                        }
                      >
                        {b.originType}
                      </span>
                    </td>
                    <td>
                      {new Date(b.processedDate).toLocaleDateString("en-GB")}
                    </td>
                    <td>
                      {b.quantity} {b.unit}
                    </td>
                    <td>
                      <span
                        className={
                          b.status === "active"
                            ? "badge-green"
                            : b.status === "recalled"
                              ? "badge-red"
                              : "badge-amber"
                        }
                      >
                        {b.status}
                      </span>
                    </td>
                    <td>
                      <button
                        className="btn-danger"
                        title="Delete batch"
                        style={{ padding: "4px 8px" }}
                        onClick={async () => {
                          await deleteData("batches", b.id);
                          await load();
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Stock Modal */}
      {showAddStock && (
        <Modal title="Add Stock Item" onClose={() => setShowAddStock(false)}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {[
              ["Item Name", "name", "text", "Winter Wheat Grain"],
              ["Quantity", "quantity", "number", "100"],
              ["Unit", "unit", "text", "tonnes"],
              ["Min Stock Level", "minStock", "number", "20"],
              ["Location", "location", "text", "Grain Store A"],
              ["Field Origin", "fieldOrigin", "text", "e.g. North Meadow"],
              ["Animal Origin", "animalOrigin", "text", "e.g. UK123456"],
            ].map(([label, key, type, placeholder]) => (
              <div key={key}>
                <label
                  style={{
                    fontSize: "0.8rem",
                    color: "var(--text-muted)",
                    display: "block",
                    marginBottom: 6,
                  }}
                >
                  {label}
                </label>
                <input
                  className="farm-input"
                  type={type}
                  placeholder={placeholder}
                  value={String((stockForm as Record<string, unknown>)[key] ?? "")}
                  onChange={(e) =>
                    setStockForm((f) => ({
                      ...f,
                      [key]:
                        type === "number" ? +e.target.value : e.target.value,
                    }))
                  }
                />
              </div>
            ))}
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
                value={stockForm.category ?? "raw"}
                onChange={(e) =>
                  setStockForm((f) => ({
                    ...f,
                    category: e.target.value as StockItem["category"],
                  }))
                }
              >
                {["raw", "processed", "packaging", "supplies"].map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
              <button
                className="btn-primary"
                style={{ flex: 1 }}
                onClick={saveStock}
              >
                Save Item
              </button>
              <button
                className="btn-ghost"
                onClick={() => setShowAddStock(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Add Batch Modal */}
      {showAdjust && adjustItem && (
        <Modal
          title={`Adjust Stock: ${adjustItem.name}`}
          onClose={() => {
            setShowAdjust(false);
            setAdjustItem(null);
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label
                style={{
                  fontSize: "0.8rem",
                  color: "var(--text-muted)",
                  display: "block",
                  marginBottom: 6,
                }}
              >
                Item
              </label>
              <input className="farm-input" value={adjustItem.name} readOnly />
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
                Adjust by (+ to add, - to remove)
              </label>
              <input
                className="farm-input"
                type="number"
                value={adjustForm.delta}
                onChange={(e) =>
                  setAdjustForm((f) => ({ ...f, delta: +e.target.value }))
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
                Reason
              </label>
              <input
                className="farm-input"
                placeholder="e.g. Received delivery"
                value={adjustForm.reason}
                onChange={(e) =>
                  setAdjustForm((f) => ({ ...f, reason: e.target.value }))
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
                Operator
              </label>
              <input
                className="farm-input"
                placeholder="Your name"
                value={adjustForm.operator}
                onChange={(e) =>
                  setAdjustForm((f) => ({ ...f, operator: e.target.value }))
                }
              />
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
              <button
                className="btn-primary"
                style={{ flex: 1 }}
                onClick={saveAdjustment}
              >
                Save Adjustment
              </button>
              <button
                className="btn-ghost"
                onClick={() => {
                  setShowAdjust(false);
                  setAdjustItem(null);
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </Modal>
      )}

      {showAddBatch && (
        <Modal
          title="Create Batch Record"
          onClose={() => setShowAddBatch(false)}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {[
              ["Batch Code", "batchCode", "text", "BATCH-2026-WW-01"],
              ["Product", "product", "text", "Winter Wheat / Flour"],
              ["Origin", "origin", "text", "North Meadow or UK123456"],
              ["Quantity", "quantity", "number", "50"],
              ["Unit", "unit", "text", "tonnes"],
            ].map(([label, key, type, placeholder]) => (
              <div key={key}>
                <label
                  style={{
                    fontSize: "0.8rem",
                    color: "var(--text-muted)",
                    display: "block",
                    marginBottom: 6,
                  }}
                >
                  {label}
                </label>
                <input
                  className="farm-input"
                  type={type}
                  placeholder={placeholder}
                  value={String((batchForm as Record<string, unknown>)[key] ?? "")}
                  onChange={(e) =>
                    setBatchForm((f) => ({
                      ...f,
                      [key]:
                        type === "number" ? +e.target.value : e.target.value,
                    }))
                  }
                />
              </div>
            ))}
            <div>
              <label
                style={{
                  fontSize: "0.8rem",
                  color: "var(--text-muted)",
                  display: "block",
                  marginBottom: 6,
                }}
              >
                Origin Type
              </label>
              <select
                className="farm-input"
                value={batchForm.originType ?? "field"}
                onChange={(e) =>
                  setBatchForm((f) => ({
                    ...f,
                    originType: e.target.value as "field" | "animal",
                  }))
                }
              >
                <option value="field">Field</option>
                <option value="animal">Animal</option>
              </select>
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
                Processed Date
              </label>
              <input
                className="farm-input"
                type="date"
                value={
                  batchForm.processedDate ??
                  new Date().toISOString().slice(0, 10)
                }
                onChange={(e) =>
                  setBatchForm((f) => ({ ...f, processedDate: e.target.value }))
                }
              />
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
              <button
                className="btn-primary"
                style={{ flex: 1 }}
                onClick={saveBatch}
              >
                Save Batch
              </button>
              <button
                className="btn-ghost"
                onClick={() => setShowAddBatch(false)}
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






