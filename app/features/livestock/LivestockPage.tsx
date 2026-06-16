"use client";

import Modal from "@/app/abstract/ui/Modal";
import FormField from "@/app/abstract/ui/FormField";
import HelpHint from "@/app/abstract/ui/HelpHint";
import StatCard from "@/app/abstract/ui/StatCard";
import ImageUpload from "@/app/components/ImageUpload";
import TableSkeleton from "@/app/abstract/ui/TableSkeleton";
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
import { AlertTriangle, Beef, Clock, Heart, Pencil, Plus, Trash2 } from "lucide-react";
import { Button, Group } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { validate, hasErrors, type Errors, type Rule } from "@/app/lib/validate";
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
  const { data, reload: load, loading } = useFarmData(LIVESTOCK_ENTITIES);
  const animals = data.animals as Animal[];
  const medical = data.medical as MedicalRecord[];
  const breeding = data.breeding as BreedingRecord[];
  const weights = data.weights as WeightRecord[];
  const [searchAnimal, setSearchAnimal] = useState("");
  const [showAddAnimal, setShowAddAnimal] = useState(false);
  const [editingAnimal, setEditingAnimal] = useState<Animal | null>(null);
  const [showAddMed, setShowAddMed] = useState(false);
  const [editingMed, setEditingMed] = useState<MedicalRecord | null>(null);
  const [showAddBreed, setShowAddBreed] = useState(false);
  const [editingBreed, setEditingBreed] = useState<BreedingRecord | null>(null);
  const [showAddWeight, setShowAddWeight] = useState(false);
  const [editingWeight, setEditingWeight] = useState<WeightRecord | null>(null);
  const [animalForm, setAnimalForm] = useState<Partial<Animal>>({});
  const [medForm, setMedForm] = useState<Partial<MedicalRecord>>({});
  const [breedForm, setBreedForm] = useState<Partial<BreedingRecord>>({});
  const [weightForm, setWeightForm] = useState<Partial<WeightRecord>>({});
  const [animalErrors, setAnimalErrors] = useState<Errors>({});
  const [medErrors, setMedErrors] = useState<Errors>({});
  const [breedErrors, setBreedErrors] = useState<Errors>({});
  const [weightErrors, setWeightErrors] = useState<Errors>({});

  const ANIMAL_RULES: Rule[] = [
    { key: "earTag", label: "Ear tag", required: true },
    { key: "species", label: "Species", required: true },
    { key: "breed", label: "Breed", required: true },
    { key: "sex", label: "Sex", required: true },
    { key: "dob", label: "Date of birth", required: true },
  ];
  const MED_RULES: Rule[] = [
    { key: "earTag", label: "Animal", required: true },
    { key: "date", label: "Date", required: true },
    { key: "type", label: "Record type", required: true },
  ];
  const BREED_RULES: Rule[] = [
    { key: "damEarTag", label: "Dam ear tag", required: true },
    { key: "sireEarTag", label: "Sire ear tag", required: true },
    { key: "matingDate", label: "Mating date", required: true },
    { key: "expectedBirth", label: "Expected birth", required: true },
  ];
  const WEIGHT_RULES: Rule[] = [
    { key: "earTag", label: "Animal", required: true },
    { key: "date", label: "Date", required: true },
    { key: "weightKg", label: "Weight", required: true },
  ];

  const saveAnimal = async () => {
    const errors = validate(animalForm as Record<string, unknown>, ANIMAL_RULES);
    setAnimalErrors(errors);
    if (hasErrors(errors)) return;
    try {
      await saveData("animals", {
        id: editingAnimal?.id || generateId(),
        status: "healthy",
        species: "cattle",
        sex: "F",
        ...animalForm,
      } as Animal);
      await load();
      notifications.show({ title: "Success", message: editingAnimal ? "Animal updated" : "Animal registered", color: "green" });
      setShowAddAnimal(false);
      setEditingAnimal(null);
      setAnimalForm({});
    } catch (error) {
      setAnimalErrors({});
      notifications.show({
        title: "Error",
        message: error instanceof Error ? error.message : "Failed to register animal",
        color: "red",
      });
    } finally {
      setAnimalErrors({});
    }
  };

  const saveMed = async () => {
    const errors = validate(medForm as Record<string, unknown>, MED_RULES);
    setMedErrors(errors);
    if (hasErrors(errors)) return;
    const animal = editingMed
      ? animals.find((a) => a.id === editingMed.animalId)
      : animals.find((a) => a.earTag === medForm.earTag);
    let withdrawalEnd: string | undefined;
    if (medForm.withdrawalDays && medForm.date) {
      const d = new Date(medForm.date);
      d.setDate(d.getDate() + (medForm.withdrawalDays as number));
      withdrawalEnd = d.toISOString().slice(0, 10);
    }
    try {
      await saveData("medicalRecords", {
        id: editingMed?.id || generateId(),
        date: new Date().toISOString().slice(0, 10),
        animalId: animal?.id ?? (editingMed?.animalId ?? ""),
        type: "vaccination",
        ...medForm,
        withdrawalEnd,
      } as MedicalRecord);
      await load();
      notifications.show({ title: "Success", message: "Medical record saved", color: "green" });
      setShowAddMed(false);
      setEditingMed(null);
      setMedForm({});
    } catch (error) {
      setMedErrors({});
      notifications.show({
        title: "Error",
        message: error instanceof Error ? error.message : "Failed to save medical record",
        color: "red",
      });
    } finally {
      setMedErrors({});
    }
  };

  const saveWeight = async () => {
    const errors = validate(weightForm as Record<string, unknown>, WEIGHT_RULES);
    setWeightErrors(errors);
    if (hasErrors(errors)) return;
    try {
      await saveData("weightRecords", {
        id: editingWeight?.id || generateId(),
        animalId: editingWeight?.animalId || (animals.find((a) => a.earTag === weightForm.earTag)?.id ?? ""),
        date: new Date().toISOString().slice(0, 10),
        ...weightForm,
      } as WeightRecord);
      await load();
      notifications.show({ title: "Success", message: "Weight record saved", color: "green" });
      setShowAddWeight(false);
      setEditingWeight(null);
      setWeightForm({});
    } catch (error) {
      setWeightErrors({});
      notifications.show({
        title: "Error",
        message: error instanceof Error ? error.message : "Failed to save weight record",
        color: "red",
      });
    } finally {
      setWeightErrors({});
    }
  };

  const saveBreed = async () => {
    const errors = validate(breedForm as Record<string, unknown>, BREED_RULES);
    setBreedErrors(errors);
    if (hasErrors(errors)) return;
    if (!breedForm.breedingDate) return;
    const breedDate = new Date(breedForm.breedingDate);
    breedDate.setDate(breedDate.getDate() + 283);
    try {
      await saveData("breedingRecords", {
        id: editingBreed?.id || generateId(),
        status: "pregnant",
        expectedBirth: editingBreed?.expectedBirth || breedDate.toISOString().slice(0, 10),
        ...breedForm,
      } as BreedingRecord);
      await load();
      notifications.show({ title: "Success", message: "Breeding record saved", color: "green" });
      setShowAddBreed(false);
      setEditingBreed(null);
      setBreedForm({});
    } catch (error) {
      setBreedErrors({});
      notifications.show({
        title: "Error",
        message: error instanceof Error ? error.message : "Failed to save breeding record",
        color: "red",
      });
    } finally {
      setBreedErrors({});
    }
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

  if (loading) return <TableSkeleton rows={5} cols={7} />;

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
                <th></th>
                <th>Group</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filteredAnimals.length === 0 ? (
                <tr><td colSpan={99}><div style={{textAlign:"center",padding:"32px 16px",fontSize:"0.875rem",color:"var(--text-muted)"}}>No animals registered yet. Add your first animal to get started.</div></td></tr>
              ) : filteredAnimals.map((a) => (
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
                  <td>
                    {a.photoUrl ? (
                      <img
                        src={a.photoUrl}
                        alt={a.earTag}
                        className="h-8 w-8 rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-muted" style={{ fontSize: "0.72rem" }}>—</span>
                    )}
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
                    <div style={{ display: "flex", gap: 4 }}>
                    <button
                      onClick={() => {
                        setEditingAnimal(a);
                        setAnimalForm({
                          earTag: a.earTag,
                          species: a.species,
                          breed: a.breed,
                          sex: a.sex,
                          dob: a.dob,
                          group: a.group,
                          status: a.status,
                          notes: a.notes,
                          photoUrl: a.photoUrl,
                        });
                        setShowAddAnimal(true);
                      }}
                      style={{
                        background: "rgba(96,165,250,0.15)",
                        border: "1px solid rgba(96,165,250,0.3)",
                        color: "#60a5fa",
                        borderRadius: 6,
                        padding: "4px 8px",
                        fontSize: "0.72rem",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 3,
                      }}
                      title="Edit animal"
                    >
                      <Pencil size={12} />
                    </button>
                    <button
                      onClick={async () => {
                        try {
                          await deleteData("animals", a.id);
                          await load();
                          notifications.show({ title: "Success", message: "Animal deleted", color: "green" });
                        } catch (error) {
                          notifications.show({
                            title: "Error",
                            message: error instanceof Error ? error.message : "Failed to delete animal",
                            color: "red",
                          });
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
                      title="Delete animal"
                    >
                      <Trash2 size={14} />
                    </button>
                    </div>
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
              {medical.length === 0 ? (
                <tr><td colSpan={99}><div style={{textAlign:"center",padding:"32px 16px",fontSize:"0.875rem",color:"var(--text-muted)"}}>No medical records yet.</div></td></tr>
              ) : medical.map((m) => (
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
                    <div style={{ display: "flex", gap: 4 }}>
                    <button
                      onClick={() => {
                        setEditingMed(m);
                        setMedForm({
                          earTag: m.earTag,
                          date: m.date,
                          type: m.type,
                          product: m.product,
                          condition: m.condition,
                          vetName: m.vetName,
                          withdrawalDays: m.withdrawalDays,
                          notes: m.notes,
                        });
                        setShowAddMed(true);
                      }}
                      style={{
                        background: "rgba(96,165,250,0.15)",
                        border: "1px solid rgba(96,165,250,0.3)",
                        color: "#60a5fa",
                        borderRadius: 6,
                        padding: "4px 8px",
                        fontSize: "0.72rem",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 3,
                      }}
                      title="Edit record"
                    >
                      <Pencil size={12} />
                    </button>
                    <button
                      onClick={async () => {
                        try {
                          await deleteData("medicalRecords", m.id);
                          await load();
                          notifications.show({ title: "Success", message: "Medical record deleted", color: "green" });
                        } catch (error) {
                          notifications.show({
                            title: "Error",
                            message: error instanceof Error ? error.message : "Failed to delete medical record",
                            color: "red",
                          });
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
                      title="Delete record"
                    >
                      <Trash2 size={14} />
                    </button>
                    </div>
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
            {breeding.length === 0 ? (
              <div style={{ textAlign:"center", padding:"32px 16px", fontSize:"0.875rem", color:"var(--text-muted)" }}>
                No breeding records yet.
              </div>
            ) : breeding.map((b) => {
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
                            background: "#7c3aed",
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
                    <div style={{ display: "flex", gap: 4 }}>
                    <button
                      onClick={() => {
                        setEditingBreed(b);
                        setBreedForm({
                          damEarTag: b.damEarTag,
                          sireEarTag: b.sireEarTag,
                          breedingDate: b.breedingDate,
                          expectedBirth: b.expectedBirth,
                          actualBirth: b.actualBirth,
                          offspring: b.offspring,
                          status: b.status,
                          notes: b.notes,
                        });
                        setShowAddBreed(true);
                      }}
                      style={{
                        background: "rgba(96,165,250,0.15)",
                        border: "1px solid rgba(96,165,250,0.3)",
                        color: "#60a5fa",
                        borderRadius: 6,
                        padding: "4px 8px",
                        fontSize: "0.72rem",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 3,
                      }}
                      title="Edit record"
                    >
                      <Pencil size={12} />
                    </button>
                    <button
                      onClick={async () => {
                        try {
                          await deleteData("breedingRecords", b.id);
                          await load();
                          notifications.show({ title: "Success", message: "Breeding record deleted", color: "green" });
                        } catch (error) {
                          notifications.show({
                            title: "Error",
                            message: error instanceof Error ? error.message : "Failed to delete breeding record",
                            color: "red",
                          });
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
                      title="Delete record"
                    >
                      <Trash2 size={14} />
                    </button>
                    </div>
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
              {weights.length === 0 ? (
                <tr><td colSpan={99}><div style={{textAlign:"center",padding:"32px 16px",fontSize:"0.875rem",color:"var(--text-muted)"}}>No weight records yet.</div></td></tr>
              ) : weights.map((w) => (
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
                    <div style={{ display: "flex", gap: 4 }}>
                    <button
                      onClick={() => {
                        setEditingWeight(w);
                        setWeightForm({
                          earTag: w.earTag,
                          date: w.date,
                          weightKg: w.weightKg,
                          notes: w.notes,
                        });
                        setShowAddWeight(true);
                      }}
                      style={{
                        background: "rgba(96,165,250,0.15)",
                        border: "1px solid rgba(96,165,250,0.3)",
                        color: "#60a5fa",
                        borderRadius: 6,
                        padding: "4px 8px",
                        fontSize: "0.72rem",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 3,
                      }}
                      title="Edit record"
                    >
                      <Pencil size={12} />
                    </button>
                    <button
                      onClick={async () => {
                        try {
                          await deleteData("weightRecords", w.id);
                          await load();
                          notifications.show({ title: "Success", message: "Weight record deleted", color: "green" });
                        } catch (error) {
                          notifications.show({
                            title: "Error",
                            message: error instanceof Error ? error.message : "Failed to delete weight record",
                            color: "red",
                          });
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
                      title="Delete record"
                    >
                      <Trash2 size={14} />
                    </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Animal Modal */}
      {showAddAnimal && (
        <Modal title={editingAnimal ? `Edit Animal — ${editingAnimal.earTag}` : "Register animal"} onClose={() => { setShowAddAnimal(false); setEditingAnimal(null); setAnimalForm({}); }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <ImageUpload
              currentUrl={animalForm.photoUrl}
              folder="animals"
              onUpload={(url) =>
                setAnimalForm((f) => ({ ...f, photoUrl: url }))
              }
              onRemove={() =>
                setAnimalForm((f) => ({ ...f, photoUrl: "" }))
              }
              label="Animal photo"
            />
            {[
              ["Ear tag", "earTag", "text", "UK123999"],
              ["Date of birth", "dob", "date", ""],
              ["Management group", "group", "text", "Breeding herd"],
            ].map(([label, key, type, placeholder]) => (
              <FormField
                key={key}
                label={label}
                name={key}
                type={type}
                placeholder={placeholder}
                value={String((animalForm as Record<string, unknown>)[key] ?? "")}
                onChange={(e) =>
                  setAnimalForm((f) => ({ ...f, [key]: e.target.value }))
                }
                error={(animalErrors as Record<string, string | null>)[key]}
                required={ANIMAL_RULES.some((r) => r.key === key)}
              />
            ))}
            <FormField
              as="select"
              label="Breed"
              name="breed"
              value={animalForm.breed ?? ""}
              onChange={(e) =>
                setAnimalForm((f) => ({ ...f, breed: e.target.value }))
              }
              error={animalErrors.breed}
              required
            >
              <option value="">Select breed...</option>
              {[...new Set(animals.map((a) => a.breed).filter(Boolean))].map(
                (b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ),
              )}
            </FormField>
            <FormField
              as="select"
              label="Species"
              name="species"
              value={animalForm.species ?? "cattle"}
              onChange={(e) =>
                setAnimalForm((f) => ({
                  ...f,
                  species: e.target.value as Animal["species"],
                }))
              }
              error={animalErrors.species}
              required
            >
              {["cattle", "sheep", "pig", "poultry", "other"].map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </FormField>
            <FormField
              as="select"
              label="Sex"
              name="sex"
              value={animalForm.sex ?? "F"}
              onChange={(e) =>
                setAnimalForm((f) => ({
                  ...f,
                  sex: e.target.value as "M" | "F",
                }))
              }
              error={animalErrors.sex}
              required
            >
              <option value="F">Female</option>
              <option value="M">Male</option>
            </FormField>
            <Group grow mt={4}>
              <Button onClick={saveAnimal}>Register</Button>
              <Button variant="default" onClick={() => setShowAddAnimal(false)}>
                Cancel
              </Button>
            </Group>
          </div>
        </Modal>
      )}

      {/* Add Medical Modal */}
      {showAddMed && (
        <Modal title={editingMed ? `Edit Medical Record — ${editingMed.earTag}` : "Add medical record"} onClose={() => { setShowAddMed(false); setEditingMed(null); setMedForm({}); }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <FormField
              as="select"
              label={<span className="inline-flex items-center gap-1.5">Animal <HelpHint label="Choose the animal receiving treatment or being checked. Register animals first so health records stay linked correctly." /></span>}
              name="medicalAnimal"
              helperText={
                animals.length > 0
                  ? "Choose the animal this record belongs to."
                  : "No animals available yet. Register livestock before adding medical records."
              }
              disabled={animals.length === 0}
              value={medForm.earTag ?? ""}
              onChange={(e) =>
                setMedForm((f) => ({ ...f, earTag: e.target.value }))
              }
              error={medErrors.earTag}
              required
            >
              <option value="">Select animal...</option>
              {animals.map((a) => (
                <option key={a.id} value={a.earTag}>
                  {a.earTag} - {a.breed}
                </option>
              ))}
            </FormField>
            <FormField
              label="Record date"
              name="medicalDate"
              type="date"
              value={medForm.date ?? new Date().toISOString().slice(0, 10)}
              onChange={(e) =>
                setMedForm((f) => ({ ...f, date: e.target.value }))
              }
              error={medErrors.date}
              required
            />
            <FormField
              as="select"
              label="Record type"
              name="medicalType"
              value={medForm.type ?? "vaccination"}
              onChange={(e) =>
                setMedForm((f) => ({
                  ...f,
                  type: e.target.value as MedicalRecord["type"],
                }))
              }
              error={medErrors.type}
              required
            >
              {["vaccination", "treatment", "illness", "checkup"].map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </FormField>
            {[
              ["Product or medicine", "product", "text", "Bovilis Bovipast RSP"],
              ["Condition", "condition", "text", "Pneumonia"],
              ["Vet name", "vetName", "text", "Dr. Alice James"],
              ["Withdrawal period", "withdrawalDays", "number", "28"],
              ["Notes", "notes", "text", "Optional"],
            ].map(([label, key, type, placeholder]) => (
              <FormField
                key={key}
                label={label}
                name={key}
                type={type}
                placeholder={placeholder}
                value={String((medForm as Record<string, unknown>)[key] ?? "")}
                onChange={(e) =>
                  setMedForm((f) => ({
                    ...f,
                    [key]:
                      type === "number" ? +e.target.value : e.target.value,
                  }))
                }
                error={(medErrors as Record<string, string | null>)[key]}
                required={MED_RULES.some((r) => r.key === key)}
              />
            ))}
            <Group grow mt={4}>
              <Button onClick={saveMed}>Save Record</Button>
              <Button variant="default" onClick={() => setShowAddMed(false)}>
                Cancel
              </Button>
            </Group>
          </div>
        </Modal>
      )}

      {/* Add Weight Modal */}
      {showAddWeight && (
        <Modal
          title={editingWeight ? `Edit Weight Record — ${editingWeight.earTag}` : "Log weight record"}
          onClose={() => { setShowAddWeight(false); setEditingWeight(null); setWeightForm({}); }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <FormField
              as="select"
              label={<span className="inline-flex items-center gap-1.5">Animal <HelpHint label="Choose the animal being weighed so growth history builds on the correct record." /></span>}
              name="weightAnimal"
              helperText={
                animals.length > 0
                  ? "Choose the animal for this weight record."
                  : "No animals available yet. Register livestock before logging weights."
              }
              disabled={animals.length === 0}
              value={weightForm.earTag ?? ""}
              onChange={(e) =>
                setWeightForm((f) => ({ ...f, earTag: e.target.value }))
              }
              error={weightErrors.earTag}
              required
            >
              <option value="">Select animal...</option>
              {animals.map((a) => (
                <option key={a.id} value={a.earTag}>
                  {a.earTag} - {a.breed}
                </option>
              ))}
            </FormField>
            <FormField
              label="Weigh date"
              name="weightDate"
              type="date"
              value={weightForm.date ?? new Date().toISOString().slice(0, 10)}
              onChange={(e) =>
                setWeightForm((f) => ({ ...f, date: e.target.value }))
              }
              error={weightErrors.date}
              required
            />
            <FormField
              label="Weight"
              name="weightKg"
              type="number"
              placeholder="450"
              helperText="Recorded in kilograms."
              value={weightForm.weightKg ?? ""}
              onChange={(e) =>
                setWeightForm((f) => ({ ...f, weightKg: +e.target.value }))
              }
              error={weightErrors.weightKg}
              required
            />
            <FormField
              as="textarea"
              label="Notes"
              name="weightNotes"
              placeholder="Optional notes"
              rows={3}
              value={weightForm.notes ?? ""}
              onChange={(e) =>
                setWeightForm((f) => ({ ...f, notes: e.target.value }))
              }
            />
            <Group grow mt={4}>
              <Button onClick={saveWeight}>Save Weight</Button>
              <Button variant="default" onClick={() => setShowAddWeight(false)}>
                Cancel
              </Button>
            </Group>
          </div>
        </Modal>
      )}

      {/* Add Breeding Modal */}
      {showAddBreed && (
        <Modal
          title={editingBreed ? `Edit Breeding Record — ${editingBreed.damEarTag}` : "Add breeding record"}
          onClose={() => { setShowAddBreed(false); setEditingBreed(null); setBreedForm({}); }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <FormField
              as="select"
              label={<span className="inline-flex items-center gap-1.5">Dam <HelpHint label="Select the female parent for this breeding event. This keeps pregnancy and offspring history attached to the right animal." /></span>}
              name="damEarTag"
              helperText={
                animals.some((animal) => animal.sex === "F")
                  ? "Choose the female animal for this breeding record."
                  : "No female animals available yet. Register a female animal before adding breeding records."
              }
              disabled={!animals.some((animal) => animal.sex === "F")}
              value={breedForm.damEarTag ?? ""}
              onChange={(e) =>
                setBreedForm((f) => ({ ...f, damEarTag: e.target.value }))
              }
              error={breedErrors.damEarTag}
              required
            >
              <option value="">Select female...</option>
              {animals
                .filter((a) => a.sex === "F")
                .map((a) => (
                  <option key={a.id} value={a.earTag}>
                    {a.earTag} - {a.breed}
                  </option>
                ))}
            </FormField>
            <FormField
              as="select"
              label={<span className="inline-flex items-center gap-1.5">Sire ear tag <HelpHint label="Select the male parent used in the breeding event. Keep naming consistent so breeding history stays easy to audit." /></span>}
              name="sireEarTag"
              helperText={
                animals.some((animal) => animal.sex === "M")
                  ? "Choose the sire for this breeding record."
                  : "No male animals available yet. Register a male animal before adding breeding records."
              }
              disabled={!animals.some((animal) => animal.sex === "M")}
              value={breedForm.sireEarTag ?? ""}
              onChange={(e) =>
                setBreedForm((f) => ({ ...f, sireEarTag: e.target.value }))
              }
              error={breedErrors.sireEarTag}
              required
            >
              <option value="">Select sire...</option>
              {animals
                .filter((a) => a.sex === "M")
                .map((a) => (
                  <option key={a.id} value={a.earTag}>
                    {a.earTag} - {a.breed}
                  </option>
                ))}
            </FormField>
            <FormField
              label="Breeding date"
              name="breedingDate"
              type="date"
              value={breedForm.breedingDate ?? ""}
              onChange={(e) =>
                setBreedForm((f) => ({ ...f, breedingDate: e.target.value }))
              }
              error={breedErrors.matingDate}
              required
            />
            <FormField
              label="Notes"
              name="breedingNotes"
              placeholder="Scanning date, AI batch, etc."
              value={breedForm.notes ?? ""}
              onChange={(e) =>
                setBreedForm((f) => ({ ...f, notes: e.target.value }))
              }
            />
            <Group grow mt={4}>
              <Button onClick={saveBreed}>Save Record</Button>
              <Button variant="default" onClick={() => setShowAddBreed(false)}>
                Cancel
              </Button>
            </Group>
          </div>
        </Modal>
      )}
    </div>
  );
}
