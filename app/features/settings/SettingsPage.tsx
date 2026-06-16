"use client";

import { Leaf, Pencil, Plus, Settings as SettingsIcon, Trash2 } from "lucide-react";
import { useState } from "react";
import { Button, Group } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import FormField from "@/app/abstract/ui/FormField";
import Modal from "@/app/abstract/ui/Modal";
import TableSkeleton from "@/app/abstract/ui/TableSkeleton";
import { useFarmData } from "@/app/base/hooks/useFarmData";
import {
  deleteData,
  generateId,
  saveData,
  type CropModel,
} from "@/app/base/services/farm-client";
import { COMMON_CROPS, cropOptions } from "@/app/lib/crops";

const ENTITIES = { cropModels: "cropModels" } as const;

export default function SettingsPage() {
  const { data, reload, loading } = useFarmData(ENTITIES);
  const cropModels = data.cropModels as CropModel[];
  const [showCropModal, setShowCropModal] = useState(false);
  const [editingCrop, setEditingCrop] = useState<CropModel | null>(null);
  const [cropForm, setCropForm] = useState<Partial<CropModel>>({});

  const saveCrop = async () => {
    if (!cropForm.crop) return;
    try {
      await saveData("cropModels", {
        id: editingCrop?.id || generateId(),
        baseTemp: 0,
        optimalTemp: 25,
        maxTemp: 35,
        ...cropForm,
      } as CropModel);
      await reload();
      setShowCropModal(false);
      setEditingCrop(null);
      setCropForm({});
      notifications.show({ title: "Saved", message: `Crop "${cropForm.crop}" saved`, color: "green" });
    } catch (error) {
      notifications.show({
        title: "Error",
        message: error instanceof Error ? error.message : "Failed to save crop",
        color: "red",
      });
    }
  };

  const deleteCrop = async (id: string, crop: string) => {
    try {
      await deleteData("cropModels", id);
      await reload();
      notifications.show({ title: "Deleted", message: `Crop "${crop}" deleted`, color: "green" });
    } catch (error) {
      notifications.show({
        title: "Error",
        message: error instanceof Error ? error.message : "Failed to delete crop",
        color: "red",
      });
    }
  };

  if (loading) return <TableSkeleton rows={5} cols={5} />;

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 28 }}>
        <h1
          className="text-primary"
          style={{ fontSize: "1.6rem", fontWeight: 800, letterSpacing: "-0.02em" }}
        >
          Settings
        </h1>
        <p className="text-muted" style={{ fontSize: "0.875rem", marginTop: 4 }}>
          Manage reference data for your farm
        </p>
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
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Leaf size={18} className="text-green" />
            <span className="text-primary" style={{ fontWeight: 600 }}>
              Crop Types
            </span>
          </div>
          <button className="btn-primary" onClick={() => { setEditingCrop(null); setCropForm({}); setShowCropModal(true); }}>
            <Plus size={14} /> Add Crop
          </button>
        </div>

        <table className="farm-table">
          <thead>
            <tr>
              <th>Crop</th>
              <th>Base Temp</th>
              <th>Optimal Temp</th>
              <th>Max Temp</th>
              <th>GDD Stages</th>
              <th style={{ textAlign: "right" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {cropModels.map((cm) => {
              const gddCount = [cm.gddToGermination, cm.gddToEmergence, cm.gddToVegetative, cm.gddToFlowering, cm.gddToFruiting, cm.gddToMaturity].filter((v) => v !== null && v !== undefined).length;
              return (
                <tr key={cm.id}>
                  <td className="text-primary" style={{ fontWeight: 600 }}>{cm.crop}</td>
                  <td className="text-muted">{cm.baseTemp}°C</td>
                  <td className="text-muted">{cm.optimalTemp}°C</td>
                  <td className="text-muted">{cm.maxTemp}°C</td>
                  <td className="text-muted">{gddCount} / 6</td>
                  <td style={{ textAlign: "right" }}>
                    <div style={{ display: "flex", gap: 4, justifyContent: "flex-end" }}>
                      <button
                        className="btn-ghost"
                        style={{ padding: "4px 8px" }}
                        onClick={() => {
                          setEditingCrop(cm);
                          setCropForm({
                            crop: cm.crop,
                            baseTemp: cm.baseTemp,
                            optimalTemp: cm.optimalTemp,
                            maxTemp: cm.maxTemp,
                            gddToGermination: cm.gddToGermination,
                            gddToEmergence: cm.gddToEmergence,
                            gddToVegetative: cm.gddToVegetative,
                            gddToFlowering: cm.gddToFlowering,
                            gddToFruiting: cm.gddToFruiting,
                            gddToMaturity: cm.gddToMaturity,
                          });
                          setShowCropModal(true);
                        }}
                        title="Edit"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        className="btn-ghost"
                        style={{ padding: "4px 8px", color: "var(--red)" }}
                        onClick={() => deleteCrop(cm.id, cm.crop)}
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {cropModels.length === 0 && (
              <tr>
                <td colSpan={6} className="text-muted" style={{ textAlign: "center", padding: "48px 16px", fontSize: "0.875rem" }}>
                  No crop types defined yet. Add your first crop to enable crop dropdowns across the app.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showCropModal && (
        <Modal
          title={editingCrop ? `Edit Crop — ${editingCrop.crop}` : "Add Crop Type"}
          onClose={() => { setShowCropModal(false); setEditingCrop(null); setCropForm({}); }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <FormField
              as="select"
              label="Crop name"
              name="crop"
              value={cropForm.crop ?? ""}
              onChange={(e) => setCropForm((f) => ({ ...f, crop: e.target.value }))}
              required
            >
              <option value="">Select crop...</option>
              {COMMON_CROPS.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
              {cropForm.crop && !COMMON_CROPS.includes(cropForm.crop as typeof COMMON_CROPS[number]) && (
                <option value={cropForm.crop}>{cropForm.crop}</option>
              )}
            </FormField>
            <FormField
              label="Base temperature (°C)"
              name="baseTemp"
              type="number"
              placeholder="0"
              value={cropForm.baseTemp ?? 0}
              onChange={(e) => setCropForm((f) => ({ ...f, baseTemp: +e.target.value }))}
            />
            <FormField
              label="Optimal temperature (°C)"
              name="optimalTemp"
              type="number"
              placeholder="25"
              value={cropForm.optimalTemp ?? 25}
              onChange={(e) => setCropForm((f) => ({ ...f, optimalTemp: +e.target.value }))}
            />
            <FormField
              label="Max temperature (°C)"
              name="maxTemp"
              type="number"
              placeholder="35"
              value={cropForm.maxTemp ?? 35}
              onChange={(e) => setCropForm((f) => ({ ...f, maxTemp: +e.target.value }))}
            />
            <div style={{ borderTop: "1px solid var(--border)", paddingTop: 10 }}>
              <p className="text-muted" style={{ fontSize: "0.8rem", marginBottom: 10 }}>
                Optional GDD thresholds
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <FormField
                  label="Germination"
                  name="gddToGermination"
                  type="number"
                  placeholder="—"
                  value={cropForm.gddToGermination ?? ""}
                  onChange={(e) => setCropForm((f) => ({ ...f, gddToGermination: +e.target.value || undefined }))}
                />
                <FormField
                  label="Emergence"
                  name="gddToEmergence"
                  type="number"
                  placeholder="—"
                  value={cropForm.gddToEmergence ?? ""}
                  onChange={(e) => setCropForm((f) => ({ ...f, gddToEmergence: +e.target.value || undefined }))}
                />
                <FormField
                  label="Vegetative"
                  name="gddToVegetative"
                  type="number"
                  placeholder="—"
                  value={cropForm.gddToVegetative ?? ""}
                  onChange={(e) => setCropForm((f) => ({ ...f, gddToVegetative: +e.target.value || undefined }))}
                />
                <FormField
                  label="Flowering"
                  name="gddToFlowering"
                  type="number"
                  placeholder="—"
                  value={cropForm.gddToFlowering ?? ""}
                  onChange={(e) => setCropForm((f) => ({ ...f, gddToFlowering: +e.target.value || undefined }))}
                />
                <FormField
                  label="Fruiting"
                  name="gddToFruiting"
                  type="number"
                  placeholder="—"
                  value={cropForm.gddToFruiting ?? ""}
                  onChange={(e) => setCropForm((f) => ({ ...f, gddToFruiting: +e.target.value || undefined }))}
                />
                <FormField
                  label="Maturity"
                  name="gddToMaturity"
                  type="number"
                  placeholder="—"
                  value={cropForm.gddToMaturity ?? ""}
                  onChange={(e) => setCropForm((f) => ({ ...f, gddToMaturity: +e.target.value || undefined }))}
                />
              </div>
            </div>
            <Group grow mt={4}>
              <Button onClick={saveCrop}>{editingCrop ? "Update" : "Add Crop"}</Button>
              <Button variant="default" onClick={() => { setShowCropModal(false); setEditingCrop(null); setCropForm({}); }}>Cancel</Button>
            </Group>
          </div>
        </Modal>
      )}
    </div>
  );
}
