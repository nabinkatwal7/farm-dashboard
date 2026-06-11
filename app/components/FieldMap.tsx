"use client";

import { useEffect, useRef } from "react";
import type { CropField } from "../lib/store";
import type { Map as LeafletMap } from "leaflet";

interface FieldMapProps {
  fields: CropField[];
}

const STATUS_COLORS: Record<string, string> = {
  growing: "#4ade80",
  planted: "#60a5fa",
  harvested: "#fbbf24",
  fallow: "#64748b",
};

export default function FieldMap({ fields }: FieldMapProps) {
  const mapRef = useRef<LeafletMap | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
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

      // Draw field markers and polygons
      fields.forEach((field) => {
        const color = STATUS_COLORS[field.status] ?? "#4ade80";

        // Random small polygon around the lat/lng
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
            fillOpacity: 0.25,
            weight: 2,
          },
        ).addTo(map);

        const popupContent = `
          <div style="font-family:Inter,sans-serif;min-width:160px">
            <div style="font-weight:700;font-size:13px;margin-bottom:4px">${field.name}</div>
            <div style="font-size:11px;color:#64748b">${field.currentCrop}</div>
            <div style="font-size:11px;color:#64748b">${field.acres} acres · <span style="color:${color};font-weight:600">${field.status}</span></div>
          </div>
        `;
        polygon.bindPopup(popupContent);

        // Label marker
        const icon = L.divIcon({
          className: "",
          html: `<div style="background:${color}20;border:1.5px solid ${color};color:${color};padding:3px 8px;border-radius:6px;font-size:11px;font-weight:600;white-space:nowrap;font-family:Inter,sans-serif;backdrop-filter:blur(4px)">${field.name}</div>`,
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
  }, [fields]);

  return <div ref={containerRef} style={{ height: 400, width: "100%" }} />;
}
