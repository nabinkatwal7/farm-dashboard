"use client";

import { useEffect, useRef } from "react";
import type { CropField, PrescriptionMap } from "@/app/base/services/farm-client";
import type { Map as LeafletMap } from "leaflet";

interface SeedingMapProps {
  fields: CropField[];
  prescriptionMaps: PrescriptionMap[];
}

const STATUS_COLORS: Record<string, string> = {
  growing: "#4ade80",
  planted: "#60a5fa",
  harvested: "#fbbf24",
  fallow: "#64748b",
};

export default function SeedingMap({ fields, prescriptionMaps }: SeedingMapProps) {
  const mapRef = useRef<LeafletMap | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mapByField = new Map<string, PrescriptionMap>();
    for (const pm of prescriptionMaps) {
      if (pm.status === "active" || pm.status === "draft") {
        mapByField.set(pm.fieldId, pm);
      }
    }
    if (!containerRef.current || mapRef.current) return;

    const initMap = async () => {
      const L = (await import("leaflet")).default;
      await import("leaflet/dist/leaflet.css");

      if (!containerRef.current) return;

      const map = L.map(containerRef.current, {
        center: [53.94, -1.07],
        zoom: 13,
        zoomControl: true,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
      }).addTo(map);

      fields.forEach((field) => {
        const baseColor = STATUS_COLORS[field.status] ?? "#4ade80";
        const pm = mapByField.get(field.id);
        const hasRx = !!pm;
        const color = hasRx ? "#22d3ee" : baseColor;

        const spread = (field.acres / 1000) * 0.015;
        const polygon = L.polygon(
          [
            [field.lat + spread, field.lng - spread],
            [field.lat + spread, field.lng + spread],
            [field.lat - spread, field.lng + spread],
            [field.lat - spread, field.lng - spread],
          ],
          {
            color,
            fillColor: color,
            fillOpacity: hasRx ? 0.35 : 0.15,
            weight: hasRx ? 3 : 2,
            dashArray: hasRx ? undefined : "5,5",
          },
        ).addTo(map);

        const zoneInfo = pm && pm.zones.length > 0
          ? `<div style="margin-top:6px;font-size:11px">${pm.zones.map((z) =>
              `<span style="display:inline-block;padding:1px 6px;margin:1px;border-radius:4px;background:${z.color}30;color:${z.color};font-weight:600">${z.rate}k seeds/ac</span>`
            ).join("")}</div>`
          : "";

        const popupContent = `
          <div style="font-family:Inter,sans-serif;min-width:180px">
            <div style="font-weight:700;font-size:13px;margin-bottom:4px">${field.name}</div>
            <div style="font-size:11px;color:#64748b">${field.currentCrop} · ${field.acres} acres</div>
            ${hasRx ? `<div style="font-size:11px;color:#22d3ee;font-weight:600;margin-top:2px">🌱 Prescription: ${pm.name}</div>` : `<div style="font-size:11px;color:#64748b;margin-top:2px">No prescription map</div>`}
            ${zoneInfo}
          </div>
        `;
        polygon.bindPopup(popupContent);

        const icon = L.divIcon({
          className: "",
          html: `<div style="background:${color}20;border:1.5px solid ${color};color:${color};padding:3px 8px;border-radius:6px;font-size:11px;font-weight:600;white-space:nowrap;font-family:Inter,sans-serif;backdrop-filter:blur(4px)">${hasRx ? "🌱 " : ""}${field.name}</div>`,
          iconAnchor: [0, 0],
        });
        L.marker([field.lat, field.lng], { icon }).addTo(map);
      });

      mapRef.current = map;
    };

    initMap();

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [fields, prescriptionMaps]);

  return (
    <div
      ref={containerRef}
      style={{ height: 450, width: "100%", position: "relative", zIndex: 0 }}
    />
  );
}
