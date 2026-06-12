"use client";

import { useEffect, useRef, useState } from "react";
import type {
  CropField,
  FieldBoundaryPoint,
  PrescriptionMap,
} from "@/app/base/services/farm-client";
import { attachMapPanFallback } from "@/app/components/map-pan-fallback";
import type { LayerGroup, Map as LeafletMap } from "leaflet";

interface SeedingMapProps {
  fields: CropField[];
  prescriptionMaps: PrescriptionMap[];
  farmLocation?: string | null;
  farmCoordinates?: FieldBoundaryPoint | null;
}

const STATUS_COLORS: Record<string, string> = {
  growing: "#4ade80",
  planted: "#60a5fa",
  harvested: "#fbbf24",
  fallow: "#64748b",
};

const geocodeCache = new Map<string, FieldBoundaryPoint | null>();

function fieldBoundary(field: CropField): FieldBoundaryPoint[] {
  if (field.boundary && field.boundary.length >= 3) return field.boundary;

  const spread = (field.acres / 1000) * 0.015;
  return [
    { lat: field.lat + spread, lng: field.lng - spread },
    { lat: field.lat + spread, lng: field.lng + spread },
    { lat: field.lat - spread, lng: field.lng + spread },
    { lat: field.lat - spread, lng: field.lng - spread },
  ];
}

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

export default function SeedingMap({
  fields,
  prescriptionMaps,
  farmLocation,
  farmCoordinates,
}: SeedingMapProps) {
  const mapRef = useRef<LeafletMap | null>(null);
  const fieldsLayerRef = useRef<LayerGroup | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const initialViewSetRef = useRef(false);
  const panCleanupRef = useRef<(() => void) | null>(null);
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const initMap = async () => {
      const L = (await import("leaflet")).default;
      await import("leaflet/dist/leaflet.css");

      if (!containerRef.current) return;

      const container = containerRef.current as HTMLDivElement & {
        _leaflet_id?: number | null;
      };
      if (container._leaflet_id) {
        container._leaflet_id = null;
      }

      const map = L.map(container, {
        center: [0, 0],
        dragging: false,
        zoom: 2,
        zoomControl: true,
        scrollWheelZoom: true,
        touchZoom: true,
      });
      map.dragging.disable();

      L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        {
          attribution: "Tiles © Esri",
          maxZoom: 19,
        },
      ).addTo(map);

      fieldsLayerRef.current = L.layerGroup().addTo(map);
      panCleanupRef.current = attachMapPanFallback(map);
      mapRef.current = map;
      setMapReady(true);
      window.setTimeout(() => map.invalidateSize(), 0);
    };

    void initMap();

    return () => {
      if (mapRef.current) {
        panCleanupRef.current?.();
        panCleanupRef.current = null;
        mapRef.current.remove();
        mapRef.current = null;
        fieldsLayerRef.current = null;
        initialViewSetRef.current = false;
        setMapReady(false);
      }
    };
  }, []);

  useEffect(() => {
    const drawFields = async () => {
      const layer = fieldsLayerRef.current;
      const map = mapRef.current;
      if (!mapReady || !layer || !map) return;

      const L = (await import("leaflet")).default;
      layer.clearLayers();

      const mapByField = new Map<string, PrescriptionMap>();
      for (const prescription of prescriptionMaps) {
        if (
          prescription.status === "active" ||
          prescription.status === "draft"
        ) {
          mapByField.set(prescription.fieldId, prescription);
        }
      }

      fields.forEach((field) => {
        const baseColor = STATUS_COLORS[field.status] ?? "#4ade80";
        const prescription = mapByField.get(field.id);
        const hasPrescription = Boolean(prescription);
        const color = hasPrescription ? "#22d3ee" : baseColor;
        const boundary = fieldBoundary(field);
        const center = fieldCenter(field);

        const polygon = L.polygon(
          boundary.map((point) => [point.lat, point.lng]),
          {
            color,
            fillColor: color,
            fillOpacity: hasPrescription ? 0.35 : 0.15,
            weight: hasPrescription ? 3 : 2,
            dashArray: hasPrescription ? undefined : "5,5",
          },
        ).addTo(layer);

        const zoneInfo =
          prescription && prescription.zones.length > 0
            ? `<div style="margin-top:6px;font-size:11px">${prescription.zones
                .map(
                  (zone) =>
                    `<span style="display:inline-block;padding:1px 6px;margin:1px;border-radius:4px;background:${zone.color}30;color:${zone.color};font-weight:600">${zone.rate}k seeds/ac</span>`,
                )
                .join("")}</div>`
            : "";

        const popupContent = `
          <div style="font-family:Inter,sans-serif;min-width:180px">
            <div style="font-weight:700;font-size:13px;margin-bottom:4px">${field.name}</div>
            <div style="font-size:11px;color:#64748b">${field.currentCrop} - ${field.acres} acres</div>
            ${
              hasPrescription && prescription
                ? `<div style="font-size:11px;color:#22d3ee;font-weight:600;margin-top:2px">Prescription: ${prescription.name}</div>`
                : `<div style="font-size:11px;color:#64748b;margin-top:2px">No prescription map</div>`
            }
            ${zoneInfo}
          </div>
        `;
        polygon.bindPopup(popupContent);

        const icon = L.divIcon({
          className: "",
          html: `<div style="background:${color}20;border:1.5px solid ${color};color:${color};padding:3px 8px;border-radius:6px;font-size:11px;font-weight:600;white-space:nowrap;font-family:Inter,sans-serif">${hasPrescription ? "Rx " : ""}${field.name}</div>`,
          iconAnchor: [0, 0],
        });
        L.marker([center.lat, center.lng], { icon }).addTo(layer);
      });

      const points = fields.flatMap((field) =>
        field.boundary && field.boundary.length >= 3
          ? field.boundary
          : [{ lat: field.lat, lng: field.lng }],
      );
      if (points.length > 0 && !initialViewSetRef.current) {
        const bounds = L.latLngBounds(
          points.map((point) => [point.lat, point.lng]),
        );
        map.fitBounds(bounds, { padding: [24, 24], maxZoom: 15 });
        initialViewSetRef.current = true;
      }
    };

    void drawFields();
  }, [fields, prescriptionMaps, mapReady]);

  useEffect(() => {
    const map = mapRef.current;
    const location = farmLocation?.trim();
    if (
      !mapReady ||
      !map ||
      fields.length > 0 ||
      initialViewSetRef.current
    ) {
      return;
    }
    const seedingMap = map;

    if (
      farmCoordinates &&
      Number.isFinite(farmCoordinates.lat) &&
      Number.isFinite(farmCoordinates.lng)
    ) {
      seedingMap.setView([farmCoordinates.lat, farmCoordinates.lng], 13);
      initialViewSetRef.current = true;
      return;
    }

    if (!location) return;
    const farmLocationQuery = location;

    let cancelled = false;

    async function centerOnFarmLocation() {
      const cached = geocodeCache.get(farmLocationQuery);
      if (cached !== undefined) {
        if (cached && !cancelled) {
          seedingMap.setView([cached.lat, cached.lng], 13);
          initialViewSetRef.current = true;
        }
        return;
      }

      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(
            farmLocationQuery,
          )}`,
        );
        const results = (await response.json()) as Array<{
          lat?: string;
          lon?: string;
        }>;
        const first = results[0];
        const point =
          first?.lat && first?.lon
            ? { lat: Number(first.lat), lng: Number(first.lon) }
            : null;

        geocodeCache.set(farmLocationQuery, point);
        if (point && !cancelled) {
          seedingMap.setView([point.lat, point.lng], 13);
          initialViewSetRef.current = true;
        }
      } catch {
        geocodeCache.set(farmLocationQuery, null);
      }
    }

    void centerOnFarmLocation();

    return () => {
      cancelled = true;
    };
  }, [farmCoordinates, farmLocation, fields.length, mapReady]);

  return (
    <div
      ref={containerRef}
      style={{ height: 450, width: "100%", position: "relative", zIndex: 0 }}
    />
  );
}
