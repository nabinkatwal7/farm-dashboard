"use client";

import {
  Banknote,
  CheckCircle,
  CreditCard,
  Globe,
  Pencil,
  ShoppingCart,
  Store,
  Trash2,
  TrendingUp,
} from "lucide-react";
import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
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
  type Product,
  type SaleRecord,
} from "@/app/base/services/farm-client";
import FormField from "@/app/abstract/ui/FormField";
import { Button, Group } from "@mantine/core";

const SHOP_ENTITIES = {
  products: "products",
  sales: "sales",
} as const;

type Tab = "pos" | "sales" | "analytics";

interface CartItem {
  product: Product;
  qty: number;
}

export default function ShopPage() {
  const [tab, setTab] = useState<Tab>("pos");
  const { data, reload: load } = useFarmData(SHOP_ENTITIES);
  const products = data.products as Product[];
  const sales = data.sales as SaleRecord[];
  const [cart, setCart] = useState<CartItem[]>([]);
  const [checkoutDone, setCheckoutDone] = useState(false);
  const [showEditProduct, setShowEditProduct] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<
    "card" | "cash" | "online"
  >("card");
  const [channel, setChannel] = useState<"shop" | "online">("shop");

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing)
        return prev.map((i) =>
          i.product.id === product.id ? { ...i, qty: i.qty + 1 } : i
        );
      return [...prev, { product, qty: 1 }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((i) => i.product.id !== productId));
  };

  const cartTotal = cart.reduce((s, i) => s + i.product.price * i.qty, 0);
  const cartProfit = cart.reduce(
    (s, i) => s + (i.product.price - i.product.cost) * i.qty,
    0
  );

  const saveEditProduct = async () => {
    if (!editProduct) return;
    await saveData("products", editProduct);
    await load();
    setShowEditProduct(false);
    setEditProduct(null);
  };

  const checkout = async () => {
    if (cart.length === 0) return;
    const sale: SaleRecord = {
      id: generateId(),
      date: new Date().toISOString().slice(0, 10),
      channel,
      items: cart.map((i) => ({
        productId: i.product.id,
        name: i.product.name,
        qty: i.qty,
        price: i.product.price,
      })),
      total: cartTotal,
      paymentMethod,
    };
    await saveData("sales", sale);
    setCart([]);
    setCheckoutDone(true);
    setTimeout(() => setCheckoutDone(false), 3000);
    await load();
  };

  // Analytics data
  const categoryMap = new Map<string, { revenue: number; cost: number }>();
  products.forEach((p) => {
    const rev = sales
      .flatMap((s) => s.items)
      .filter((i) => i.productId === p.id)
      .reduce((s, i) => s + i.qty * i.price, 0);
    const cos = sales
      .flatMap((s) => s.items)
      .filter((i) => i.productId === p.id)
      .reduce((s, i) => s + i.qty * p.cost, 0);
    const existing = categoryMap.get(p.category) ?? { revenue: 0, cost: 0 };
    categoryMap.set(p.category, {
      revenue: existing.revenue + rev,
      cost: existing.cost + cos,
    });
  });
  const profitData = Array.from(categoryMap.entries())
    .map(([name, data]) => ({
      name,
      Revenue: +data.revenue.toFixed(2),
      COGS: +data.cost.toFixed(2),
      Profit: +(data.revenue - data.cost).toFixed(2),
    }))
    .filter((d) => d.Revenue > 0);

  const totalRevenue = sales.reduce((s, r) => s + r.total, 0);
  const shopSales = sales
    .filter((s) => s.channel === "shop")
    .reduce((s, r) => s + r.total, 0);
  const onlineSales = sales
    .filter((s) => s.channel === "online")
    .reduce((s, r) => s + r.total, 0);

  return (
    <div style={{ padding: "32px 32px 48px" }}>
      <div style={{ marginBottom: 28 }}>
        <h1
          className="text-primary"
          style={{
            fontSize: "1.6rem",
            fontWeight: 800,
            letterSpacing: "-0.02em",
          }}
        >
          🛒 Shop Retail & POS
        </h1>
        <p
          className="text-muted"
          style={{
            fontSize: "0.875rem",
            marginTop: 4,
          }}
        >
          Omnichannel sales, point of sale terminal, and profit analytics
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
          label="Total Revenue"
          value={`£${totalRevenue.toFixed(2)}`}
          icon={TrendingUp}
          color="#a78bfa"
          delay={0}
        />
        <StatCard
          label="Farm Shop Sales"
          value={`£${shopSales.toFixed(2)}`}
          icon={Store}
          color="#4ade80"
          delay={60}
        />
        <StatCard
          label="Online Sales"
          value={`£${onlineSales.toFixed(2)}`}
          icon={Globe}
          color="#60a5fa"
          delay={120}
        />
        <StatCard
          label="Products"
          value={products.length}
          sub={`${products.filter((p) => p.stock > 0).length} in stock`}
          icon={ShoppingCart}
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
            ["pos", "🖥️ POS Terminal"],
            ["sales", "📋 Sales History"],
            ["analytics", "📊 Profit Analytics"],
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
              background: tab === t ? "rgba(167,139,250,0.15)" : "transparent",
              color: tab === t ? "#a78bfa" : "var(--text-secondary)",
              transition: "all 0.15s",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* POS Terminal */}
      {tab === "pos" && (
        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 20 }}
        >
          {/* Product grid */}
          <div
            className="bg-card border border-border"
            style={{
              borderRadius: 12,
              padding: "20px",
            }}
          >
            <div style={{ marginBottom: 14 }}>
              <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
                <div className="text-muted" style={{ fontSize: "0.8rem" }}>
                  Channel:
                </div>
                {(["shop", "online"] as const).map((ch) => (
                  <button
                    key={ch}
                    onClick={() => setChannel(ch)}
                    style={{
                      padding: "4px 12px",
                      borderRadius: 6,
                      border: "1px solid",
                      fontSize: "0.8rem",
                      cursor: "pointer",
                      fontWeight: 500,
                      background:
                        channel === ch
                          ? "rgba(167,139,250,0.15)"
                          : "transparent",
                      borderColor:
                        channel === ch
                          ? "rgba(167,139,250,0.4)"
                          : "var(--border)",
                      color: channel === ch ? "#a78bfa" : "var(--text-muted)",
                    }}
                  >
                    {ch === "shop" ? "🏪 Farm Shop" : "🌐 Online"}
                  </button>
                ))}
              </div>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
                gap: 12,
              }}
            >
              {products.map((product) => (
                <div
                  key={product.id}
                  style={{ display: "flex", flexDirection: "column", gap: 4 }}
                >
                  <button
                    onClick={() => addToCart(product)}
                    disabled={product.stock === 0}
                    style={{
                      background:
                        product.stock === 0
                          ? "rgba(255,255,255,0.02)"
                          : "rgba(255,255,255,0.03)",
                      border: `1px solid ${
                        product.stock === 0
                          ? "var(--border)"
                          : "rgba(167,139,250,0.2)"
                      }`,
                      borderRadius: 10,
                      padding: "14px",
                      cursor: product.stock === 0 ? "not-allowed" : "pointer",
                      textAlign: "left",
                      opacity: product.stock === 0 ? 0.4 : 1,
                      transition: "all 0.2s",
                      width: "100%",
                    }}
                    onMouseEnter={(e) => {
                      if (product.stock > 0)
                        (
                          e.currentTarget as HTMLButtonElement
                        ).style.borderColor = "rgba(167,139,250,0.5)";
                    }}
                    onMouseLeave={(e) => {
                      if (product.stock > 0)
                        (
                          e.currentTarget as HTMLButtonElement
                        ).style.borderColor = "rgba(167,139,250,0.2)";
                    }}
                  >
                    <div
                      className="text-primary"
                      style={{
                        fontSize: "0.85rem",
                        fontWeight: 600,
                        marginBottom: 4,
                      }}
                    >
                      {product.name}
                    </div>
                    <div
                      className="text-muted"
                      style={{
                        fontSize: "0.75rem",
                        marginBottom: 8,
                      }}
                    >
                      {product.category}
                    </div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-end",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "1rem",
                          fontWeight: 700,
                          color: "#a78bfa",
                        }}
                      >
                        £{product.price.toFixed(2)}
                      </span>
                      <span
                        className="text-muted"
                        style={{
                          fontSize: "0.72rem",
                        }}
                      >
                        Stock: {product.stock}
                      </span>
                    </div>
                  </button>
                  <div style={{ display: "flex", gap: 4 }}>
                    <button
                      className="btn-ghost"
                      style={{
                        flex: 1,
                        padding: "4px 6px",
                        fontSize: "0.72rem",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 4,
                      }}
                      onClick={() => {
                        setEditProduct({ ...product });
                        setShowEditProduct(true);
                      }}
                    >
                      <Pencil size={12} /> Edit
                    </button>
                    <button
                      className="btn-danger"
                      style={{
                        flex: 1,
                        padding: "4px 6px",
                        fontSize: "0.72rem",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 4,
                      }}
                      onClick={async () => {
                        await deleteData("products", product.id);
                        await load();
                      }}
                    >
                      <Trash2 size={12} /> Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Cart */}
          <div
            className="bg-card border border-border"
            style={{
              borderRadius: 12,
              padding: "20px",
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}
          >
            <div
              className="text-primary"
              style={{
                fontWeight: 700,
                fontSize: "1rem",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span>Shopping Cart</span>
              {cart.length > 0 && (
                <span className="badge-purple">
                  {cart.length} item{cart.length !== 1 ? "s" : ""}
                </span>
              )}
            </div>

            {checkoutDone && (
              <div
                style={{
                  background: "rgba(74,222,128,0.1)",
                  border: "1px solid rgba(74,222,128,0.3)",
                  borderRadius: 8,
                  padding: "12px",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <CheckCircle size={16} color="#4ade80" />
                <span
                  style={{
                    color: "#4ade80",
                    fontWeight: 600,
                    fontSize: "0.85rem",
                  }}
                >
                  Sale recorded successfully!
                </span>
              </div>
            )}

            {cart.length === 0 ? (
              <div
                className="text-muted"
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "0.85rem",
                  flexDirection: "column",
                  gap: 8,
                }}
              >
                <ShoppingCart size={28} strokeWidth={1.5} />
                <span>Cart is empty</span>
              </div>
            ) : (
              <div
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                }}
              >
                {cart.map((item) => (
                  <div
                    key={item.product.id}
                    className="border border-border"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "10px",
                      borderRadius: 8,
                      background: "rgba(255,255,255,0.03)",

                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div
                        className="text-primary"
                        style={{
                          fontSize: "0.82rem",
                          fontWeight: 500,
                        }}
                      >
                        {item.product.name}
                      </div>
                      <div
                        className="text-muted"
                        style={{
                          fontSize: "0.75rem",
                        }}
                      >
                        £{item.product.price.toFixed(2)} × {item.qty}
                      </div>
                    </div>
                    <span
                      style={{
                        fontWeight: 700,
                        color: "#a78bfa",
                        fontSize: "0.9rem",
                      }}
                    >
                      £{(item.product.price * item.qty).toFixed(2)}
                    </span>
                    <button
                      className="btn-danger"
                      style={{ padding: "4px 8px" }}
                      onClick={() => removeFromCart(item.product.id)}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {cart.length > 0 && (
              <div
                className="border-t border-border"
                style={{
                  paddingTop: 14,
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                }}
              >
                <div
                  className="text-muted"
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "0.8rem",
                  }}
                >
                  <span>Total</span>
                  <span
                    className="text-primary"
                    style={{
                      fontSize: "1.1rem",
                      fontWeight: 700,
                    }}
                  >
                    £{cartTotal.toFixed(2)}
                  </span>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "0.78rem",
                    color: "#4ade80",
                  }}
                >
                  <span>Profit margin</span>
                  <span>
                    £{cartProfit.toFixed(2)} (
                    {((cartProfit / cartTotal) * 100).toFixed(1)}%)
                  </span>
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  {(["card", "cash"] as const).map((pm) => (
                    <button
                      key={pm}
                      onClick={() => setPaymentMethod(pm)}
                      style={{
                        flex: 1,
                        padding: "8px",
                        borderRadius: 6,
                        border: "1px solid",
                        cursor: "pointer",
                        fontSize: "0.8rem",
                        background:
                          paymentMethod === pm
                            ? "rgba(167,139,250,0.15)"
                            : "transparent",
                        borderColor:
                          paymentMethod === pm
                            ? "rgba(167,139,250,0.4)"
                            : "var(--border)",
                        color:
                          paymentMethod === pm
                            ? "#a78bfa"
                            : "var(--text-muted)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 4,
                      }}
                    >
                      {pm === "card" ? (
                        <CreditCard size={12} />
                      ) : (
                        <Banknote size={12} />
                      )}{" "}
                      {pm.charAt(0).toUpperCase() + pm.slice(1)}
                    </button>
                  ))}
                </div>
                <button
                  className="btn-primary"
                  style={{
                    justifyContent: "center",
                    fontSize: "0.95rem",
                    padding: "12px",
                  }}
                  onClick={checkout}
                >
                  <CheckCircle size={16} /> Checkout · £{cartTotal.toFixed(2)}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sales History */}
      {tab === "sales" && (
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
              Transaction History
            </span>
          </div>
          <table className="farm-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Channel</th>
                <th>Items</th>
                <th>Total</th>
                <th>Payment</th>
              </tr>
            </thead>
            <tbody>
              {[...sales].reverse().map((sale) => (
                <tr key={sale.id}>
                  <td>{new Date(sale.date).toLocaleDateString("en-GB")}</td>
                  <td>
                    <span
                      className={
                        sale.channel === "shop" ? "badge-green" : "badge-blue"
                      }
                    >
                      {sale.channel === "shop" ? "🏪 Shop" : "🌐 Online"}
                    </span>
                  </td>
                  <td
                    className="text-secondary"
                    style={{
                      fontSize: "0.8rem",
                    }}
                  >
                    {sale.items.map((i) => `${i.name} ×${i.qty}`).join(", ")}
                  </td>
                  <td style={{ fontWeight: 700, color: "#a78bfa" }}>
                    £{sale.total.toFixed(2)}
                  </td>
                  <td style={{ textTransform: "capitalize" }}>
                    {sale.paymentMethod}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Analytics */}
      {tab === "analytics" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div
            className="bg-card border border-border"
            style={{
              borderRadius: 12,
              padding: "20px",
            }}
          >
            <div className="section-header">
              <div>
                <div className="section-title">Profit Margin by Category</div>
                <div
                  className="text-muted"
                  style={{ fontSize: "0.75rem" }}
                >
                  Revenue vs COGS vs Profit · £
                </div>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={profitData} barGap={4}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(255,255,255,0.05)"
                  vertical={false}
                />
                <XAxis
                  dataKey="name"
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
                  formatter={(v) =>
                    typeof v === "number" ? `£${v.toFixed(2)}` : String(v)
                  }
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
                <Bar dataKey="Revenue" fill="#a78bfa" radius={[4, 4, 0, 0]} />
                <Bar dataKey="COGS" fill="#334155" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Profit" fill="#4ade80" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

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
                Product Profitability Breakdown
              </span>
            </div>
            <table className="farm-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>COGS</th>
                  <th>Margin</th>
                  <th>Margin %</th>
                  <th>Stock</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => {
                  const margin = p.price - p.cost;
                  const marginPct = ((margin / p.price) * 100).toFixed(1);
                  return (
                    <tr key={p.id}>
                      <td
                        className="text-primary"
                        style={{
                          fontWeight: 500,
                        }}
                      >
                        {p.name}
                      </td>
                      <td>{p.category}</td>
                      <td>£{p.price.toFixed(2)}</td>
                      <td className="text-muted">
                        £{p.cost.toFixed(2)}
                      </td>
                      <td style={{ color: "#4ade80", fontWeight: 600 }}>
                        £{margin.toFixed(2)}
                      </td>
                      <td>
                        <span
                          style={{
                            color:
                              +marginPct >= 50
                                ? "#4ade80"
                                : +marginPct >= 30
                                ? "#fbbf24"
                                : "#f87171",
                            fontWeight: 600,
                          }}
                        >
                          {marginPct}%
                        </span>
                      </td>
                      <td
                        className="text-secondary"
                        style={{
                          color:
                            p.stock < 20 ? "#f87171" : undefined,
                        }}
                      >
                        {p.stock} {p.unit}s
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {showEditProduct && editProduct && (
        <Modal
          title="Edit Product"
          onClose={() => {
            setShowEditProduct(false);
            setEditProduct(null);
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {(
              [
                ["Product name", "name", "text"],
                ["Product category", "category", "text"],
                ["Sale price", "price", "number"],
                ["Unit cost", "cost", "number"],
                ["Stock on hand", "stock", "number"],
                ["Unit of measure", "unit", "text"],
              ] as [string, keyof Product, string][]
            ).map(([label, key, type]) => (
              <FormField
                key={key}
                label={label}
                name={key}
                type={type}
                value={editProduct[key] as string | number}
                onChange={(e) =>
                  setEditProduct((p) =>
                    p
                      ? {
                          ...p,
                          [key]:
                            type === "number"
                              ? +e.target.value
                              : e.target.value,
                        }
                      : p
                  )
                }
              />
            ))}
            <Group grow mt={4}>
              <Button onClick={saveEditProduct}>Save Product</Button>
              <Button
                variant="default"
                onClick={() => {
                  setShowEditProduct(false);
                  setEditProduct(null);
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


