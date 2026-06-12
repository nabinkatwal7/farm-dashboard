"use client";

import { useEffect, useRef } from "react";
import type {
  CropField,
  FieldBoundaryPoint,
} from "@/app/base/services/farm-client";
import type { LayerGroup, Map as LeafletMap } from "leaflet";

interface FieldMapProps {
  fields: CropField[];
  drawingBoundary?: boolean;
  draftBoundary?: FieldBoundaryPoint[];
  onBoundaryChange?: (points: FieldBoundaryPoint[]) => void;
  height?: number;
}

const STATUS_COLORS: Record<string, string> = {
  growing: "#4ade80",
  planted: "#60a5fa",
  harvested: "#fbbf24",
  fallow: "#64748b",
};

function fieldCenter(field: CropField): FieldBoundaryPoint {
  const boundary = field.boundary?.filter(
    (point) => Number.isFinite(point.lat) && Number.isFinite(point.lng),
  );

  if (boundary && boundary.length > 0) {
    return {
      lat:
        boundary.reduce((sum, point) => sum + point.lat, 0) / boundary.length,
      lng:
        boundary.reduce((sum, point) => sum + point.lng, 0) / boundary.length,
    };
  }

  return { lat: field.lat, lng: field.lng };
}

function fallbackBoundary(field: CropField): FieldBoundaryPoint[] {
  const spread = (field.acres / 1000) * 0.015;
  return [
    { lat: field.lat + spread, lng: field.lng - spread },
    { lat: field.lat + spread, lng: field.lng + spread },
    { lat: field.lat - spread, lng: field.lng + spread },
    { lat: field.lat - spread, lng: field.lng - spread },
  ];
}

export default function FieldMap({
  fields,
  drawingBoundary = false,
  draftBoundary = [],
  onBoundaryChange,
  height = 400,
}: FieldMapProps) {
  const mapRef = useRef<LeafletMap | null>(null);
  const fieldsLayerRef = useRef<LayerGroup | null>(null);
  const draftLayerRef = useRef<LayerGroup | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const initMap = async () => {
      const L = (await import("leaflet")).default;
      await import("leaflet/dist/leaflet.css");

      if (!containerRef.current) return;

      // Leaflet stores an internal id on the DOM node. React Strict Mode and
      // modal remount timing can leave that marker behind after cleanup.
      const container = containerRef.current as HTMLDivElement & {
        _leaflet_id?: number | null;
      };
      if (container._leaflet_id) {
        container._leaflet_id = null;
      }

      const map = L.map(container, {
        center: [53.94, -1.07],
        zoom: 13,
        zoomControl: true,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "OpenStreetMap contributors",
      }).addTo(map);

      fieldsLayerRef.current = L.layerGroup().addTo(map);
      draftLayerRef.current = L.layerGroup().addTo(map);
      mapRef.current = map;
      window.setTimeout(() => map.invalidateSize(), 0);
    };

    void initMap();

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        fieldsLayerRef.current = null;
        draftLayerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const drawFields = async () => {
      const layer = fieldsLayerRef.current;
      if (!layer) return;

      const L = (await import("leaflet")).default;
      layer.clearLayers();

      fields.forEach((field) => {
        const color = STATUS_COLORS[field.status] ?? "#4ade80";
        const boundary =
          field.boundary && field.boundary.length >= 3
            ? field.boundary
            : fallbackBoundary(field);
        const center = fieldCenter(field);

        const polygon = L.polygon(
          boundary.map((point) => [point.lat, point.lng]),
          {
            color,
            fillColor: color,
            fillOpacity: 0.25,
            weight: 2,
          },
        ).addTo(layer);

        polygon.bindPopup(`
          <div style="font-family:Inter,sans-serif;min-width:160px">
            <div style="font-weight:700;font-size:13px;margin-bottom:4px">${field.name}</div>
            <div style="font-size:11px;color:#64748b">${field.currentCrop}</div>
            <div style="font-size:11px;color:#64748b">${field.acres} acres - <span style="color:${color};font-weight:600">${field.status}</span></div>
          </div>
        `);

        const icon = L.divIcon({
          className: "",
          html: `<div style="background:${color}20;border:1.5px solid ${color};color:${color};padding:3px 8px;border-radius:6px;font-size:11px;font-weight:600;white-space:nowrap;font-family:Inter,sans-serif">${field.name}</div>`,
          iconAnchor: [0, 0],
        });
        L.marker([center.lat, center.lng], { icon }).addTo(layer);
      });
    };

    void drawFields();
  }, [fields]);

  useEffect(() => {
    const drawDraft = async () => {
      const layer = draftLayerRef.current;
      if (!layer) return;

      const L = (await import("leaflet")).default;
      layer.clearLayers();

      draftBoundary.forEach((point, index) => {
        L.circleMarker([point.lat, point.lng], {
          radius: 5,
          color: "#2563eb",
          fillColor: "#2563eb",
          fillOpacity: 1,
          weight: 2,
        })
          .bindTooltip(String(index + 1), {
            permanent: true,
            direction: "center",
            className: "field-boundary-point-label",
          })
          .addTo(layer);
      });

      if (draftBoundary.length >= 2) {
        L.polyline(
          draftBoundary.map((point) => [point.lat, point.lng]),
          { color: "#2563eb", dashArray: "6 6", weight: 2 },
        ).addTo(layer);
      }

      if (draftBoundary.length >= 3) {
        L.polygon(
          draftBoundary.map((point) => [point.lat, point.lng]),
          {
            color: "#2563eb",
            fillColor: "#2563eb",
            fillOpacity: 0.16,
            weight: 2,
          },
        ).addTo(layer);
      }
    };

    void drawDraft();
  }, [draftBoundary]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !drawingBoundary || !onBoundaryChange) return;

    const handleClick = (event: { latlng: { lat: number; lng: number } }) => {
      onBoundaryChange([
        ...draftBoundary,
        { lat: event.latlng.lat, lng: event.latlng.lng },
      ]);
    };

    map.getContainer().style.cursor = "crosshair";
    map.on("click", handleClick);

    return () => {
      map.off("click", handleClick);
      map.getContainer().style.cursor = "";
    };
  }, [drawingBoundary, draftBoundary, onBoundaryChange]);

  return (
    <div
      ref={containerRef}
      style={{ height, width: "100%", position: "relative", zIndex: 0 }}
    />
  );
}
