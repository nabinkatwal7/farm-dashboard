"use client";

import {
  AlertTriangle,
  ArrowRight,
  Package,
  Pencil,
  Plus,
  Search,
  Settings,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import TableSkeleton from "@/app/abstract/ui/TableSkeleton";
import EmptyState from "@/app/abstract/ui/EmptyState";
import { Button, Group } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import FormField from "@/app/abstract/ui/FormField";
import Modal from "@/app/abstract/ui/Modal";
import StatCard from "@/app/abstract/ui/StatCard";
import { useFarmData } from "@/app/base/hooks/useFarmData";
import {
  deleteData,
  generateId,
  saveData,
  type Animal,
  type BatchRecord,
  type CropField,
  type StockAdjustment,
  type StockItem,
} from "@/app/base/services/farm-client";
import { validate, hasErrors, type Errors, type Rule } from "@/app/lib/validate";

const INVENTORY_ENTITIES = {
  stock: "stockItems",
  batches: "batches",
  fields: "fields",
  animals: "animals",
} as const;

type Tab = "stock" | "batches";

const CATEGORY_COLORS: Record<string, string> = {
  raw: "#4ade80",
  processed: "#a78bfa",
  packaging: "#60a5fa",
  supplies: "#fbbf24",
};

export default function InventoryPage() {
  const [tab, setTab] = useState<Tab>("stock");
  const { data, reload: load, loading } = useFarmData(INVENTORY_ENTITIES);
  const stock = data.stock as StockItem[];
  const batches = data.batches as BatchRecord[];
  const fields = data.fields as CropField[];
  const animals = data.animals as Animal[];
  const [search, setSearch] = useState("");
  const [traceSearch, setTraceSearch] = useState("");
  const [showAddStock, setShowAddStock] = useState(false);
  const [editingStock, setEditingStock] = useState<StockItem | null>(null);
  const [showAddBatch, setShowAddBatch] = useState(false);
  const [editingBatch, setEditingBatch] = useState<BatchRecord | null>(null);
  const [stockForm, setStockForm] = useState<Partial<StockItem>>({});
  const [batchForm, setBatchForm] = useState<Partial<BatchRecord>>({});
  const [showAdjust, setShowAdjust] = useState(false);
  const [adjustItem, setAdjustItem] = useState<StockItem | null>(null);
  const [adjustForm, setAdjustForm] = useState({
    delta: 0,
    reason: "",
    operator: "",
  });
  const [stockErrors, setStockErrors] = useState<Errors>({});
  const [batchErrors, setBatchErrors] = useState<Errors>({});
  const [adjustErrors, setAdjustErrors] = useState<Errors>({});

const STOCK_RULES: Rule[] = [
  { key: "name", label: "Item name", required: true },
  { key: "category", label: "Category", required: true },
];
const BATCH_RULES: Rule[] = [
  { key: "batchCode", label: "Batch code", required: true },
  { key: "product", label: "Product", required: true },
  { key: "origin", label: "Origin", required: true },
  { key: "originType", label: "Origin type", required: true },
  { key: "unit", label: "Unit", required: true },
  { key: "quantity", label: "Quantity", required: true },
];
const ADJUST_RULES: Rule[] = [
  { key: "delta", label: "Quantity change", required: true },
  { key: "reason", label: "Reason", required: true },
];

  const saveStock = async () => {
    const errs = validate(stockForm as Record<string, unknown>, STOCK_RULES);
    setStockErrors(errs);
    if (hasErrors(errs)) return;
    try {
      await saveData("stockItems", {
        id: editingStock?.id || generateId(),
        category: "raw",
        subCategory: "",
        minStock: 10,
        unit: "units",
        location: "Main Store",
        ...stockForm,
      } as StockItem);
      await load();
      notifications.show({
        title: "Success",
        message: editingStock ? "Stock item updated" : "Stock item created",
        color: "green",
      });
      setShowAddStock(false);
      setEditingStock(null);
      setStockForm({});
      setStockErrors({});
    } catch (error) {
      notifications.show({
        title: "Error",
        message: error instanceof Error ? error.message : "Failed to save stock item",
        color: "red",
      });
    }
  };

  const saveAdjustment = async () => {
    if (!adjustItem) return;
    const errs = validate(adjustForm as Record<string, unknown>, ADJUST_RULES);
    setAdjustErrors(errs);
    if (hasErrors(errs)) return;
    try {
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
      notifications.show({
        title: "Success",
        message: "Stock adjustment saved",
        color: "green",
      });
      setShowAdjust(false);
      setAdjustItem(null);
      setAdjustForm({ delta: 0, reason: "", operator: "" });
      setAdjustErrors({});
    } catch (error) {
      notifications.show({
        title: "Error",
        message: error instanceof Error ? error.message : "Failed to save adjustment",
        color: "red",
      });
    }
  };

  const saveBatch = async () => {
    const data = { originType: "field", ...batchForm };
    const errs = validate(data, BATCH_RULES);
    setBatchErrors(errs);
    if (hasErrors(errs)) return;
    try {
      await saveData("batches", {
        id: editingBatch?.id || generateId(),
        status: "active",
        processedDate: new Date().toISOString().slice(0, 10),
        ...data,
      } as BatchRecord);
      await load();
      notifications.show({
        title: "Success",
        message: editingBatch ? "Batch updated" : "Batch created",
        color: "green",
      });
      setShowAddBatch(false);
      setEditingBatch(null);
      setBatchForm({});
      setBatchErrors({});
    } catch (error) {
      notifications.show({
        title: "Error",
        message: error instanceof Error ? error.message : "Failed to save batch",
        color: "red",
      });
    }
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
          📦 Inventory & Traceability
        </h1>
        <p
          className="text-muted"
          style={{
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
              <span className="text-muted" style={{ fontSize: "0.8rem" }}>
                {lowStock.map((s) => s.name).join(", ")}
              </span>
            </div>
          )}

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
                        className="text-primary"
                        style={{
                          fontWeight: 500,
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
                      <td className="text-muted">
                        {item.minStock}
                      </td>
                      <td className="text-muted">
                        {item.location}
                      </td>
                      <td
                        className="text-muted"
                        style={{
                          fontSize: "0.78rem",
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
                            title="Edit stock item"
                            style={{ padding: "4px 8px" }}
                            onClick={() => {
                              setEditingStock(item);
                              setStockForm({
                                name: item.name,
                                category: item.category,
                                subCategory: item.subCategory,
                                quantity: item.quantity,
                                unit: item.unit,
                                minStock: item.minStock,
                                location: item.location,
                                fieldOrigin: item.fieldOrigin,
                                animalOrigin: item.animalOrigin,
                              });
                              setShowAddStock(true);
                            }}
                          >
                            <Settings size={14} />
                          </button>
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
                              try {
                                await deleteData("stockItems", item.id);
                                await load();
                                notifications.show({
                                  title: "Success",
                                  message: "Stock item deleted",
                                  color: "green",
                                });
                              } catch (error) {
                                notifications.show({
                                  title: "Error",
                                  message: error instanceof Error ? error.message : "Failed to delete stock item",
                                  color: "red",
                                });
                              }
                            }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredStock.length === 0 && (
                  <tr>
                    <td colSpan={99}>
                      <EmptyState icon={Package} title="No stock items" description="Add your first stock item to start tracking inventory." />
                    </td>
                  </tr>
                )}
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
            className="bg-card border border-border"
            style={{
              borderRadius: 12,
              padding: "20px",
            }}
          >
            <div
              className="text-primary"
              style={{
                fontWeight: 600,
                fontSize: "0.9rem",
                marginBottom: 12,
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
                    <span className="text-muted">
                      Batch Code:{" "}
                    </span>
                    <span
                      className="text-primary"
                      style={{
                        fontWeight: 700,
                        fontFamily: "monospace",
                      }}
                    >
                      {traceResult.batchCode}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted">
                      Product:{" "}
                    </span>
                    <span className="text-primary">
                      {traceResult.product}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted">
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
                    <span className="text-muted">Origin: </span>
                    <span
                      className="text-primary"
                      style={{ fontWeight: 600 }}
                    >
                      {traceResult.originType === "field" ? "🌾" : "🐾"}{" "}
                      {traceResult.origin}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted">
                      Processed:{" "}
                    </span>
                    <span className="text-primary">
                      {new Date(traceResult.processedDate).toLocaleDateString(
                        "en-GB",
                      )}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted">
                      Quantity:{" "}
                    </span>
                    <span className="text-primary">
                      {traceResult.quantity} {traceResult.unit}
                    </span>
                  </div>
                </div>
              </div>
            )}
            {traceSearch && !traceResult && (
              <div
                className="text-muted"
                style={{
                  marginTop: 12,
                  fontSize: "0.85rem",
                }}
              >
                No batch found matching &quot;{traceSearch}&quot;
              </div>
            )}
          </div>

          {/* Batch list */}
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
                    <td className="text-primary">
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
                      <div style={{ display: "flex", gap: 4 }}>
                      <button
                        className="btn-ghost"
                        title="Edit batch"
                        style={{ padding: "4px 8px" }}
                        onClick={() => {
                          setEditingBatch(b);
                          setBatchForm({
                            batchCode: b.batchCode,
                            product: b.product,
                            origin: b.origin,
                            originType: b.originType,
                            processedDate: b.processedDate,
                            quantity: b.quantity,
                            unit: b.unit,
                            status: b.status,
                          });
                          setShowAddBatch(true);
                        }}
                      >
                        <Settings size={14} />
                      </button>
                      <button
                        className="btn-danger"
                        title="Delete batch"
                        style={{ padding: "4px 8px" }}
                        onClick={async () => {
                          try {
                            await deleteData("batches", b.id);
                            await load();
                            notifications.show({
                              title: "Success",
                              message: "Batch deleted",
                              color: "green",
                            });
                          } catch (error) {
                            notifications.show({
                              title: "Error",
                              message: error instanceof Error ? error.message : "Failed to delete batch",
                              color: "red",
                            });
                          }
                        }}
                      >
                        <Trash2 size={14} />
                      </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {batches.length === 0 && (
                  <tr>
                    <td colSpan={99}>
                      <EmptyState icon={Package} title="No batches" description="Create a batch to enable traceability and QR code generation." />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Stock Modal */}
      {showAddStock && (
        <Modal title={editingStock ? `Edit Stock — ${editingStock.name}` : "Add Stock Item"} onClose={() => { setShowAddStock(false); setEditingStock(null); setStockForm({}); }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <FormField
              label="Item Name"
              name="name"
              type="text"
              placeholder="Winter Wheat Grain"
              value={String((stockForm as Record<string, unknown>)["name"] ?? "")}
              onChange={(e) =>
                setStockForm((f) => ({
                  ...f,
                  name: e.target.value,
                }))
              }
              error={stockErrors.name}
              required
            />
            {[
              ["Quantity", "quantity", "number", "100"],
              ["Min Stock Level", "minStock", "number", "20"],
              ["Location", "location", "text", "Grain Store A"],
            ].map(([label, key, type, placeholder]) => (
              <FormField
                key={key}
                label={label}
                name={key}
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
            ))}
            <FormField
              as="select"
              label="Unit"
              name="unit"
              value={stockForm.unit ?? ""}
              onChange={(e) =>
                setStockForm((f) => ({ ...f, unit: e.target.value }))
              }
            >
              <option value="">Select unit...</option>
              {["tonnes", "kg", "bags", "litres", "units"].map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </FormField>
            <FormField
              as="select"
              label="Field Origin"
              name="fieldOrigin"
              value={stockForm.fieldOrigin ?? ""}
              onChange={(e) =>
                setStockForm((f) => ({ ...f, fieldOrigin: e.target.value }))
              }
            >
              <option value="">Select field...</option>
              {fields.map((f) => (
                <option key={f.id} value={f.name}>
                  {f.name}
                </option>
              ))}
            </FormField>
            <FormField
              as="select"
              label="Animal Origin"
              name="animalOrigin"
              value={stockForm.animalOrigin ?? ""}
              onChange={(e) =>
                setStockForm((f) => ({ ...f, animalOrigin: e.target.value }))
              }
            >
              <option value="">Select animal...</option>
              {animals.map((a) => (
                <option key={a.id} value={a.earTag}>
                  {a.earTag} - {a.breed}
                </option>
              ))}
            </FormField>
            <FormField
              as="select"
              label="Stock category"
              name="category"
              value={stockForm.category ?? "raw"}
              onChange={(e) =>
                setStockForm((f) => ({
                  ...f,
                  category: e.target.value as StockItem["category"],
                }))
              }
              error={stockErrors.category}
              required
            >
              {["raw", "processed", "packaging", "supplies"].map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </FormField>
            <Group grow mt={4}>
              <Button onClick={saveStock}>{editingStock ? "Update Item" : "Save Item"}</Button>
              <Button variant="default" onClick={() => { setShowAddStock(false); setEditingStock(null); setStockForm({}); }}>
                Cancel
              </Button>
            </Group>
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
            <FormField
              label="Stock item"
              name="stockItem"
              value={adjustItem.name}
              readOnly
            />
            <FormField
              label="Quantity adjustment"
              helperText="Use a positive number to add stock or a negative number to remove stock."
              name="delta"
              type="number"
              value={adjustForm.delta}
              error={adjustErrors.delta}
              required
              onChange={(e) =>
                setAdjustForm((f) => ({ ...f, delta: +e.target.value }))
              }
            />
            <FormField
              label="Adjustment reason"
              name="reason"
              placeholder="Received delivery"
              value={adjustForm.reason}
              onChange={(e) =>
                setAdjustForm((f) => ({ ...f, reason: e.target.value }))
              }
              error={adjustErrors.reason}
              required
            />
            <FormField
              as="select"
              label="Operator name"
              name="operator"
              value={adjustForm.operator ?? ""}
              onChange={(e) =>
                setAdjustForm((f) => ({ ...f, operator: e.target.value }))
              }
            >
              <option value="">Select operator...</option>
              {["Tom Greene", "John Smith", "Sarah Jones", "Mike Wilson", "Emma Davis"].map(
                (o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ),
              )}
            </FormField>
            <Group grow mt={4}>
              <Button onClick={saveAdjustment}>Save Adjustment</Button>
              <Button
                variant="default"
                onClick={() => {
                  setShowAdjust(false);
                  setAdjustItem(null);
                }}
              >
                Cancel
              </Button>
            </Group>
          </div>
        </Modal>
      )}

      {showAddBatch && (
        <Modal
          title={editingBatch ? `Edit Batch — ${editingBatch.batchCode}` : "Create Batch Record"}
          onClose={() => { setShowAddBatch(false); setEditingBatch(null); setBatchForm({}); }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <FormField
              label="Batch Code"
              name="batchCode"
              type="text"
              placeholder="BATCH-2026-WW-01"
              value={String((batchForm as Record<string, unknown>)["batchCode"] ?? "")}
              onChange={(e) =>
                setBatchForm((f) => ({
                  ...f,
                  batchCode: e.target.value,
                }))
              }
              error={batchErrors.batchCode}
              required
            />
            <FormField
              label="Quantity"
              name="quantity"
              type="number"
              placeholder="50"
              value={String((batchForm as Record<string, unknown>)["quantity"] ?? "")}
              onChange={(e) =>
                setBatchForm((f) => ({
                  ...f,
                  quantity: +e.target.value,
                }))
              }
              error={batchErrors.quantity}
              required
            />
            <FormField
              as="select"
              label="Product"
              name="product"
              value={batchForm.product ?? ""}
              onChange={(e) =>
                setBatchForm((f) => ({ ...f, product: e.target.value }))
              }
              error={batchErrors.product}
              required
            >
              <option value="">Select product...</option>
              {[...new Set(stock.map((s) => s.name).filter(Boolean))].map(
                (p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ),
              )}
            </FormField>
            <FormField
              as="select"
              label="Origin"
              name="origin"
              value={batchForm.origin ?? ""}
              onChange={(e) =>
                setBatchForm((f) => ({ ...f, origin: e.target.value }))
              }
              error={batchErrors.origin}
              required
            >
              <option value="">Select origin...</option>
              {batchForm.originType === "field"
                ? fields.map((f) => (
                    <option key={f.id} value={f.name}>
                      {f.name}
                    </option>
                  ))
                : animals.map((a) => (
                    <option key={a.id} value={a.earTag}>
                      {a.earTag} - {a.breed}
                    </option>
                  ))}
            </FormField>
            <FormField
              as="select"
              label="Unit"
              name="unit"
              value={batchForm.unit ?? ""}
              onChange={(e) =>
                setBatchForm((f) => ({ ...f, unit: e.target.value }))
              }
              error={batchErrors.unit}
              required
            >
              <option value="">Select unit...</option>
              {["tonnes", "kg", "bags", "litres", "units"].map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </FormField>
            <FormField
              as="select"
              label="Origin type"
              name="originType"
              value={batchForm.originType ?? "field"}
              onChange={(e) =>
                setBatchForm((f) => ({
                  ...f,
                  originType: e.target.value as "field" | "animal",
                }))
              }
              error={batchErrors.originType}
              required
            >
              <option value="field">Field</option>
              <option value="animal">Animal</option>
            </FormField>
            <FormField
              label="Processed date"
              name="processedDate"
              type="date"
              value={
                batchForm.processedDate ??
                new Date().toISOString().slice(0, 10)
              }
              onChange={(e) =>
                setBatchForm((f) => ({ ...f, processedDate: e.target.value }))
              }
              error={batchErrors.processedDate}
            />
            <Group grow mt={4}>
              <Button onClick={saveBatch}>{editingBatch ? "Update Batch" : "Save Batch"}</Button>
              <Button variant="default" onClick={() => { setShowAddBatch(false); setEditingBatch(null); setBatchForm({}); }}>
                Cancel
              </Button>
            </Group>
          </div>
        </Modal>
      )}
    </div>
  );
}








