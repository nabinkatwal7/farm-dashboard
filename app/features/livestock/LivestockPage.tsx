"use client";

import Modal from "@/app/abstract/ui/Modal";
import StatCard from "@/app/abstract/ui/StatCard";
import { useFarmData } from "@/app/base/hooks/useFarmData";
import {
  deleteData,
  generateId,
  saveData,
  type Animal,
  type BreedingRecord,
  type MedicalRecord,
  type WeightRecord,
} from "@/app/base/services/farm-client";
import { AlertTriangle, Beef, Clock, Heart, Plus, Trash2 } from "lucide-react";
import { useState } from "react";

const LIVESTOCK_ENTITIES = {
  animals: "animals",
  medical: "medicalRecords",
  breeding: "breedingRecords",
  weights: "weightRecords",
} as const;

type Tab = "animals" | "medical" | "breeding" | "weights";

const SPECIES_EMOJI: Record<string, string> = {
  cattle: "🐄",
  sheep: "🐑",
  pig: "🐖",
  poultry: "🐔",
  other: "🐾",
};

function daysUntil(dateStr: string) {
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.ceil(diff / 86400000);
}

function gestationProgress(breedDate: string, expectedBirth: string) {
  const total =
    new Date(expectedBirth).getTime() - new Date(breedDate).getTime();
  const elapsed = Date.now() - new Date(breedDate).getTime();
  return Math.min(100, Math.max(0, Math.round((elapsed / total) * 100)));
}

export default function LivestockPage() {
  const [tab, setTab] = useState<Tab>("animals");
  const { data, reload: load } = useFarmData(LIVESTOCK_ENTITIES);
  const animals = data.animals as Animal[];
  const medical = data.medical as MedicalRecord[];
  const breeding = data.breeding as BreedingRecord[];
  const weights = data.weights as WeightRecord[];
  const [searchAnimal, setSearchAnimal] = useState("");
  const [showAddAnimal, setShowAddAnimal] = useState(false);
  const [showAddMed, setShowAddMed] = useState(false);
  const [showAddBreed, setShowAddBreed] = useState(false);
  const [animalForm, setAnimalForm] = useState<Partial<Animal>>({});
  const [medForm, setMedForm] = useState<Partial<MedicalRecord>>({});
  const [breedForm, setBreedForm] = useState<Partial<BreedingRecord>>({});
  const [showAddWeight, setShowAddWeight] = useState(false);
  const [weightForm, setWeightForm] = useState<Partial<WeightRecord>>({});

  const saveAnimal = async () => {
    if (!animalForm.earTag) return;
    await saveData("animals", {
      id: generateId(),
      status: "healthy",
      species: "cattle",
      sex: "F",
      ...animalForm,
    } as Animal);
    await load();
    setShowAddAnimal(false);
    setAnimalForm({});
  };

  const saveMed = async () => {
    if (!medForm.earTag) return;
    const animal = animals.find((a) => a.earTag === medForm.earTag);
    let withdrawalEnd: string | undefined;
    if (medForm.withdrawalDays && medForm.date) {
      const d = new Date(medForm.date);
      d.setDate(d.getDate() + (medForm.withdrawalDays as number));
      withdrawalEnd = d.toISOString().slice(0, 10);
    }
    await saveData("medicalRecords", {
      id: generateId(),
      date: new Date().toISOString().slice(0, 10),
      animalId: animal?.id ?? "",
      type: "vaccination",
      ...medForm,
      withdrawalEnd,
    } as MedicalRecord);
    await load();
    setShowAddMed(false);
    setMedForm({});
  };

  const saveWeight = async () => {
    if (!weightForm.earTag || !weightForm.weightKg) return;
    await saveData("weightRecords", {
      id: generateId(),
      animalId: animals.find((a) => a.earTag === weightForm.earTag)?.id ?? "",
      date: new Date().toISOString().slice(0, 10),
      ...weightForm,
    } as WeightRecord);
    await load();
    setShowAddWeight(false);
    setWeightForm({});
  };

  const saveBreed = async () => {
    if (!breedForm.damEarTag || !breedForm.breedingDate) return;
    // Calculate expected birth based on species
    const breedDate = new Date(breedForm.breedingDate);
    breedDate.setDate(breedDate.getDate() + 283); // Default cattle gestation
    await saveData("breedingRecords", {
      id: generateId(),
      status: "pregnant",
      expectedBirth: breedDate.toISOString().slice(0, 10),
      ...breedForm,
    } as BreedingRecord);
    await load();
    setShowAddBreed(false);
    setBreedForm({});
  };

  const filteredAnimals = animals.filter(
    (a) =>
      a.earTag.toLowerCase().includes(searchAnimal.toLowerCase()) ||
      a.breed.toLowerCase().includes(searchAnimal.toLowerCase()) ||
      a.species.toLowerCase().includes(searchAnimal.toLowerCase()) ||
      (a.group ?? "").toLowerCase().includes(searchAnimal.toLowerCase())
  );

  const activeWithdrawals = medical.filter(
    (m) => m.withdrawalEnd && new Date(m.withdrawalEnd) > new Date()
  );

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
          🐄 Livestock & Herd Management
        </h1>
        <p
          className="text-muted"
          style={{
            fontSize: "0.875rem",
            marginTop: 4,
          }}
        >
          Animal ID tracking, medical records, and breeding cycles
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
          label="Total Animals"
          value={
            animals.filter(
              (a) => a.status !== "sold" && a.status !== "deceased"
            ).length
          }
          icon={Beef}
          color="#60a5fa"
          delay={0}
        />
        <StatCard
          label="Sick / Quarantine"
          value={
            animals.filter(
              (a) => a.status === "sick" || a.status === "quarantine"
            ).length
          }
          icon={AlertTriangle}
          color="#f87171"
          delay={60}
        />
        <StatCard
          label="Active Withdrawals"
          value={activeWithdrawals.length}
          sub="medicine withdrawal periods"
          icon={Clock}
          color="#fbbf24"
          delay={120}
        />
        <StatCard
          label="Pregnancies"
          value={breeding.filter((b) => b.status === "pregnant").length}
          sub={`${
            breeding.filter((b) => b.status === "birthed").length
          } birthed this season`}
          icon={Heart}
          color="#a78bfa"
          delay={180}
        />
      </div>

      {/* Tab bar */}
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
            ["animals", "🏷️ Animal Registry"],
            ["medical", "💉 Medical Records"],
            ["breeding", "🍼 Breeding Cycles"],
            ["weights", "⚖️ Weights"],
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
              background: tab === t ? "rgba(96,165,250,0.15)" : "transparent",
              color: tab === t ? "#60a5fa" : "var(--text-secondary)",
              transition: "all 0.15s",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Animal Registry */}
      {tab === "animals" && (
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
              placeholder="🔍 Search by ear tag, breed, group…"
              value={searchAnimal}
              onChange={(e) => setSearchAnimal(e.target.value)}
            />
            <button
              className="btn-primary"
              onClick={() => setShowAddAnimal(true)}
            >
              <Plus size={14} /> Register Animal
            </button>
          </div>
          <table className="farm-table">
            <thead>
              <tr>
                <th>Species</th>
                <th>Ear Tag</th>
                <th>Breed</th>
                <th>Sex</th>
                <th>DOB</th>
                <th>Group</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filteredAnimals.map((a) => (
                <tr key={a.id}>
                  <td style={{ fontSize: "1.1rem" }}>
                    {SPECIES_EMOJI[a.species]}{" "}
                    <span
                      className="text-muted"
                      style={{ fontSize: "0.8rem" }}
                    >
                      {a.species}
                    </span>
                  </td>
                  <td
                    className="text-primary"
                    style={{
                      fontWeight: 700,
                      fontFamily: "monospace",
                      fontSize: "0.85rem",
                    }}
                  >
                    {a.earTag}
                  </td>
                  <td>{a.breed}</td>
                  <td style={{ color: a.sex === "F" ? "#f472b6" : "#60a5fa" }}>
                    {a.sex === "F" ? "♀ Female" : "♂ Male"}
                  </td>
                  <td>{new Date(a.dob).toLocaleDateString("en-GB")}</td>
                  <td>
                    <span className="badge-blue">{a.group || "—"}</span>
                  </td>
                  <td>
                    <span
                      className={
                        a.status === "healthy"
                          ? "badge-green"
                          : a.status === "sick" || a.status === "quarantine"
                          ? "badge-red"
                          : "badge-amber"
                      }
                    >
                      {a.status}
                    </span>
                  </td>
                  <td>
                    <button
                      onClick={async () => {
                        await deleteData("animals", a.id);
                        await load();
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
                      title="Delete animal"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Medical Records */}
      {tab === "medical" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {activeWithdrawals.length > 0 && (
            <div
              style={{
                background: "rgba(251,191,36,0.07)",
                border: "1px solid rgba(251,191,36,0.25)",
                borderRadius: 12,
                padding: "16px 20px",
              }}
            >
              <div
                style={{
                  fontSize: "0.8rem",
                  fontWeight: 700,
                  color: "#fbbf24",
                  marginBottom: 12,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <Clock size={14} /> ACTIVE MEDICINE WITHDRAWAL PERIODS
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
                  gap: 10,
                }}
              >
                {activeWithdrawals.map((m) => {
                  const days = daysUntil(m.withdrawalEnd!);
                  return (
                    <div
                      key={m.id}
                      style={{
                        background: "rgba(251,191,36,0.08)",
                        border: "1px solid rgba(251,191,36,0.2)",
                        borderRadius: 8,
                        padding: "12px",
                      }}
                    >
                      <div
                        style={{
                          fontWeight: 700,
                          fontFamily: "monospace",
                          color: "#fbbf24",
                          marginBottom: 2,
                        }}
                      >
                        {m.earTag}
                      </div>
                      <div
                        className="text-primary"
                        style={{
                          fontSize: "0.8rem",
                        }}
                      >
                        {m.product}
                      </div>
                      <div
                        className="text-muted"
                        style={{
                          fontSize: "0.75rem",
                          marginTop: 2,
                        }}
                      >
                        {days > 0
                          ? `${days} days remaining`
                          : "Withdrawal complete"}
                        {" · "} Ends{" "}
                        {new Date(m.withdrawalEnd!).toLocaleDateString("en-GB")}
                      </div>
                      <div
                        style={{
                          marginTop: 8,
                          background: "rgba(0,0,0,0.2)",
                          borderRadius: 4,
                          height: 4,
                        }}
                      >
                        <div
                          style={{
                            height: "100%",
                            borderRadius: 4,
                            background: days > 7 ? "#fbbf24" : "#f87171",
                            width: `${Math.max(
                              5,
                              100 - (days / (m.withdrawalDays ?? 28)) * 100
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
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
              }}
            >
              <span style={{ fontWeight: 600, fontSize: "0.9rem" }}>
                Medical Log
              </span>
              <button
                className="btn-primary"
                onClick={() => setShowAddMed(true)}
              >
                <Plus size={14} /> Add Record
              </button>
            </div>
            <table className="farm-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Ear Tag</th>
                  <th>Type</th>
                  <th>Product / Condition</th>
                  <th>Vet</th>
                  <th>Withdrawal</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {medical.map((m) => (
                  <tr key={m.id}>
                    <td>{new Date(m.date).toLocaleDateString("en-GB")}</td>
                    <td
                      className="text-primary"
                      style={{
                        fontWeight: 700,
                        fontFamily: "monospace",
                      }}
                    >
                      {m.earTag}
                    </td>
                    <td>
                      <span
                        className={
                          m.type === "vaccination"
                            ? "badge-green"
                            : m.type === "treatment"
                            ? "badge-red"
                            : m.type === "illness"
                            ? "badge-amber"
                            : "badge-blue"
                        }
                      >
                        {m.type}
                      </span>
                    </td>
                    <td className="text-primary">
                      {m.product || m.condition || m.notes || "—"}
                    </td>
                    <td>{m.vetName || "—"}</td>
                    <td>
                      {m.withdrawalDays ? (
                        <span
                          className={
                            m.withdrawalEnd &&
                            new Date(m.withdrawalEnd) > new Date()
                              ? "badge-amber"
                              : "badge-green"
                          }
                        >
                          {m.withdrawalDays}d{" "}
                          {m.withdrawalEnd &&
                          new Date(m.withdrawalEnd) > new Date()
                            ? `(${daysUntil(m.withdrawalEnd)} left)`
                            : "✓"}
                        </span>
                      ) : (
                        <span className="text-muted">None</span>
                      )}
                    </td>
                    <td>
                      <button
                        onClick={async () => {
                          await deleteData("medicalRecords", m.id);
                          await load();
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
                        title="Delete record"
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

      {/* Breeding Cycles */}
      {tab === "breeding" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button
              className="btn-primary"
              onClick={() => setShowAddBreed(true)}
            >
              <Plus size={14} /> Add Breeding Record
            </button>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
              gap: 14,
            }}
          >
            {breeding.map((b) => {
              const progress =
                b.status === "pregnant"
                  ? gestationProgress(b.breedingDate, b.expectedBirth)
                  : 100;
              const daysLeft =
                b.status === "pregnant" ? daysUntil(b.expectedBirth) : 0;
              const dam = animals.find((a) => a.earTag === b.damEarTag);
              return (
                  <div
                    key={b.id}
                    className="bg-card"
                    style={{
                      border: `1px solid ${
                        b.status === "pregnant"
                          ? "rgba(167,139,250,0.3)"
                          : "var(--border)"
                      }`,
                      borderRadius: 12,
                      padding: "18px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: 12,
                      }}
                    >
                      <div>
                        <div
                          className="text-primary"
                          style={{
                            fontWeight: 700,
                            fontFamily: "monospace",
                          }}
                        >
                          {SPECIES_EMOJI[dam?.species ?? "other"]} {b.damEarTag}
                        </div>
                        <div
                          className="text-muted"
                          style={{
                            fontSize: "0.75rem",
                            marginTop: 2,
                          }}
                        >
                        Sire: {b.sireEarTag ?? "Unknown"}
                      </div>
                    </div>
                    <span
                      className={
                        b.status === "pregnant"
                          ? "badge-purple"
                          : b.status === "birthed"
                          ? "badge-green"
                          : "badge-red"
                      }
                    >
                      {b.status}
                    </span>
                  </div>
                  <div
                    className="text-muted"
                    style={{
                      fontSize: "0.8rem",
                      marginBottom: 10,
                    }}
                  >
                    Bred: {new Date(b.breedingDate).toLocaleDateString("en-GB")}
                    {" · "}
                    {b.status === "birthed" && b.actualBirth
                      ? `Birthed: ${new Date(b.actualBirth).toLocaleDateString(
                          "en-GB"
                        )}`
                      : `Expected: ${new Date(
                          b.expectedBirth
                        ).toLocaleDateString("en-GB")}`}
                  </div>
                  {b.status === "pregnant" && (
                    <>
                      <div
                        className="text-muted"
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          fontSize: "0.75rem",
                          marginBottom: 4,
                        }}
                      >
                        <span>Gestation: {progress}%</span>
                        <span>
                          {daysLeft > 0 ? `${daysLeft} days to go` : "Overdue"}
                        </span>
                      </div>
                      <div
                        style={{
                          height: 6,
                          background: "rgba(255,255,255,0.06)",
                          borderRadius: 4,
                        }}
                      >
                        <div
                          style={{
                            height: "100%",
                            borderRadius: 4,
                            background:
                              "linear-gradient(90deg, #a78bfa, #7c3aed)",
                            width: `${progress}%`,
                            transition: "width 0.4s",
                          }}
                        />
                      </div>
                    </>
                  )}
                  {b.status === "birthed" && (
                    <div
                      style={{
                        marginTop: 8,
                        padding: "8px 12px",
                        borderRadius: 6,
                        background: "rgba(74,222,128,0.08)",
                        border: "1px solid rgba(74,222,128,0.2)",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "0.8rem",
                          color: "#4ade80",
                          fontWeight: 600,
                        }}
                      >
                        ✓ {b.offspring ?? "?"} offspring born
                      </span>
                    </div>
                  )}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "flex-end",
                      marginTop: 10,
                    }}
                  >
                    <button
                      onClick={async () => {
                        await deleteData("breedingRecords", b.id);
                        await load();
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
                      title="Delete record"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Weight Records Tab */}
      {tab === "weights" && (
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
              Weight Records
            </span>
            <button
              className="btn-primary"
              onClick={() => setShowAddWeight(true)}
            >
              <Plus size={14} /> Log Weight
            </button>
          </div>
          <table className="farm-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Ear Tag</th>
                <th>Weight (kg)</th>
                <th>Notes</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {weights.map((w) => (
                <tr key={w.id}>
                  <td>{new Date(w.date).toLocaleDateString("en-GB")}</td>
                  <td
                    className="text-primary"
                    style={{
                      fontWeight: 700,
                      fontFamily: "monospace",
                      fontSize: "0.85rem",
                    }}
                  >
                    {w.earTag}
                  </td>
                  <td className="text-primary" style={{ fontWeight: 600 }}>
                    {w.weightKg} kg
                  </td>
                  <td
                    className="text-muted"
                    style={{ fontSize: "0.8rem" }}
                  >
                    {w.notes || "—"}
                  </td>
                  <td>
                    <button
                      onClick={async () => {
                        await deleteData("weightRecords", w.id);
                        await load();
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
                      title="Delete record"
                    >
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Animal Modal */}
      {showAddAnimal && (
        <Modal title="Register Animal" onClose={() => setShowAddAnimal(false)}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {[
              ["Ear Tag", "earTag", "text", "UK123999"],
              ["Breed", "breed", "text", "Hereford"],
              ["Date of Birth", "dob", "date", ""],
              ["Group", "group", "text", "Breeding Herd"],
            ].map(([label, key, type, placeholder]) => (
              <div key={key}>
              <label
                className="text-muted"
                style={{
                  fontSize: "0.8rem",
                  display: "block",
                  marginBottom: 6,
                }}
              >
                Animal Ear Tag
              </label>
                <input
                  className="farm-input"
                  type={type}
                  placeholder={placeholder}
                  value={String(
                    (animalForm as Record<string, unknown>)[key] ?? ""
                  )}
                  onChange={(e) =>
                    setAnimalForm((f) => ({ ...f, [key]: e.target.value }))
                  }
                />
              </div>
            ))}
            <div>
              <label
                className="text-muted"
                style={{
                  fontSize: "0.8rem",
                  display: "block",
                  marginBottom: 6,
                }}
              >
                Species
              </label>
              <select
                className="farm-input"
                value={animalForm.species ?? "cattle"}
                onChange={(e) =>
                  setAnimalForm((f) => ({
                    ...f,
                    species: e.target.value as Animal["species"],
                  }))
                }
              >
                {["cattle", "sheep", "pig", "poultry", "other"].map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                className="text-muted"
                style={{
                  fontSize: "0.8rem",
                  display: "block",
                  marginBottom: 6,
                }}
              >
                Sex
              </label>
              <select
                className="farm-input"
                value={animalForm.sex ?? "F"}
                onChange={(e) =>
                  setAnimalForm((f) => ({
                    ...f,
                    sex: e.target.value as "M" | "F",
                  }))
                }
              >
                <option value="F">Female</option>
                <option value="M">Male</option>
              </select>
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
              <button
                className="btn-primary"
                style={{ flex: 1 }}
                onClick={saveAnimal}
              >
                Register
              </button>
              <button
                className="btn-ghost"
                onClick={() => setShowAddAnimal(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Add Medical Modal */}
      {showAddMed && (
        <Modal title="Add Medical Record" onClose={() => setShowAddMed(false)}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label
                className="text-muted"
                style={{
                  fontSize: "0.8rem",
                  display: "block",
                  marginBottom: 6,
                }}
              >
                Animal Ear Tag
              </label>
              <select
                className="farm-input"
                value={medForm.earTag ?? ""}
                onChange={(e) =>
                  setMedForm((f) => ({ ...f, earTag: e.target.value }))
                }
              >
                <option value="">Select animal…</option>
                {animals.map((a) => (
                  <option key={a.id} value={a.earTag}>
                    {a.earTag} — {a.breed}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                className="text-muted"
                style={{
                  fontSize: "0.8rem",
                  display: "block",
                  marginBottom: 6,
                }}
              >
                Date
              </label>
              <input
                className="farm-input"
                type="date"
                value={medForm.date ?? new Date().toISOString().slice(0, 10)}
                onChange={(e) =>
                  setMedForm((f) => ({ ...f, date: e.target.value }))
                }
              />
            </div>
            <div>
              <label
                className="text-muted"
                style={{
                  fontSize: "0.8rem",
                  display: "block",
                  marginBottom: 6,
                }}
              >
                Type
              </label>
              <select
                className="farm-input"
                value={medForm.type ?? "vaccination"}
                onChange={(e) =>
                  setMedForm((f) => ({
                    ...f,
                    type: e.target.value as MedicalRecord["type"],
                  }))
                }
              >
                {["vaccination", "treatment", "illness", "checkup"].map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            {[
              ["Product / Medicine", "product", "text", "Bovilis Bovipast RSP"],
              ["Condition", "condition", "text", "e.g. Pneumonia"],
              ["Vet Name", "vetName", "text", "Dr. Alice James"],
              ["Withdrawal Days", "withdrawalDays", "number", "28"],
              ["Notes", "notes", "text", "Optional"],
            ].map(([label, key, type, placeholder]) => (
              <div key={key}>
                <label
                  className="text-muted"
                  style={{
                    fontSize: "0.8rem",
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
                  value={String(
                    (medForm as Record<string, unknown>)[key] ?? ""
                  )}
                  onChange={(e) =>
                    setMedForm((f) => ({
                      ...f,
                      [key]:
                        type === "number" ? +e.target.value : e.target.value,
                    }))
                  }
                />
              </div>
            ))}
            <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
              <button
                className="btn-primary"
                style={{ flex: 1 }}
                onClick={saveMed}
              >
                Save Record
              </button>
              <button
                className="btn-ghost"
                onClick={() => setShowAddMed(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Add Weight Modal */}
      {showAddWeight && (
        <Modal
          title="Log Weight Record"
          onClose={() => setShowAddWeight(false)}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label
                className="text-muted"
                style={{
                  fontSize: "0.8rem",
                  display: "block",
                  marginBottom: 6,
                }}
              >
                Animal Ear Tag
              </label>
              <select
                className="farm-input"
                value={weightForm.earTag ?? ""}
                onChange={(e) =>
                  setWeightForm((f) => ({ ...f, earTag: e.target.value }))
                }
              >
                <option value="">Select animal…</option>
                {animals.map((a) => (
                  <option key={a.id} value={a.earTag}>
                    {a.earTag} — {a.breed}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                className="text-muted"
                style={{
                  fontSize: "0.8rem",
                  display: "block",
                  marginBottom: 6,
                }}
              >
                Date
              </label>
              <input
                className="farm-input"
                type="date"
                value={weightForm.date ?? new Date().toISOString().slice(0, 10)}
                onChange={(e) =>
                  setWeightForm((f) => ({ ...f, date: e.target.value }))
                }
              />
            </div>
            <div>
              <label
                className="text-muted"
                style={{
                  fontSize: "0.8rem",
                  display: "block",
                  marginBottom: 6,
                }}
              >
                Weight (kg)
              </label>
              <input
                className="farm-input"
                type="number"
                placeholder="450"
                value={weightForm.weightKg ?? ""}
                onChange={(e) =>
                  setWeightForm((f) => ({ ...f, weightKg: +e.target.value }))
                }
              />
            </div>
            <div>
              <label
                className="text-muted"
                style={{
                  fontSize: "0.8rem",
                  display: "block",
                  marginBottom: 6,
                }}
              >
                Notes
              </label>
              <textarea
                className="farm-input"
                placeholder="Optional notes"
                value={weightForm.notes ?? ""}
                onChange={(e) =>
                  setWeightForm((f) => ({ ...f, notes: e.target.value }))
                }
                rows={3}
              />
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
              <button
                className="btn-primary"
                style={{ flex: 1 }}
                onClick={saveWeight}
              >
                Save Weight
              </button>
              <button
                className="btn-ghost"
                onClick={() => setShowAddWeight(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Add Breeding Modal */}
      {showAddBreed && (
        <Modal
          title="Add Breeding Record"
          onClose={() => setShowAddBreed(false)}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label
                className="text-muted"
                style={{
                  fontSize: "0.8rem",
                  display: "block",
                  marginBottom: 6,
                }}
              >
                Dam (Female) Ear Tag
              </label>
              <select
                className="farm-input"
                value={breedForm.damEarTag ?? ""}
                onChange={(e) =>
                  setBreedForm((f) => ({ ...f, damEarTag: e.target.value }))
                }
              >
                <option value="">Select female…</option>
                {animals
                  .filter((a) => a.sex === "F")
                  .map((a) => (
                    <option key={a.id} value={a.earTag}>
                      {a.earTag} — {a.breed}
                    </option>
                  ))}
              </select>
            </div>
            <div>
              <label
                className="text-muted"
                style={{
                  fontSize: "0.8rem",
                  display: "block",
                  marginBottom: 6,
                }}
              >
                Sire (Male) Ear Tag
              </label>
              <input
                className="farm-input"
                placeholder="UK789050"
                value={breedForm.sireEarTag ?? ""}
                onChange={(e) =>
                  setBreedForm((f) => ({ ...f, sireEarTag: e.target.value }))
                }
              />
            </div>
            <div>
              <label
                className="text-muted"
                style={{
                  fontSize: "0.8rem",
                  display: "block",
                  marginBottom: 6,
                }}
              >
                Breeding Date
              </label>
              <input
                className="farm-input"
                type="date"
                value={breedForm.breedingDate ?? ""}
                onChange={(e) =>
                  setBreedForm((f) => ({ ...f, breedingDate: e.target.value }))
                }
              />
            </div>
            <div>
              <label
                className="text-muted"
                style={{
                  fontSize: "0.8rem",
                  display: "block",
                  marginBottom: 6,
                }}
              >
                Notes
              </label>
              <input
                className="farm-input"
                placeholder="Scanning date, AI batch, etc."
                value={breedForm.notes ?? ""}
                onChange={(e) =>
                  setBreedForm((f) => ({ ...f, notes: e.target.value }))
                }
              />
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
              <button
                className="btn-primary"
                style={{ flex: 1 }}
                onClick={saveBreed}
              >
                Save Record
              </button>
              <button
                className="btn-ghost"
                onClick={() => setShowAddBreed(false)}
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
