"use client";

import { useEffect, useRef, useState } from "react";
import type {
  CropField,
  FieldBoundaryPoint,
} from "@/app/base/services/farm-client";
import { attachMapPanFallback } from "@/app/components/map-pan-fallback";
import type { LayerGroup, Map as LeafletMap } from "leaflet";

interface FieldMapProps {
  fields: CropField[];
  farmLocation?: string | null;
  farmCoordinates?: FieldBoundaryPoint | null;
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

const geocodeCache = new Map<string, FieldBoundaryPoint | null>();

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
  farmLocation,
  farmCoordinates,
  drawingBoundary = false,
  draftBoundary = [],
  onBoundaryChange,
  height = 400,
}: FieldMapProps) {
  const mapRef = useRef<LeafletMap | null>(null);
  const fieldsLayerRef = useRef<LayerGroup | null>(null);
  const draftLayerRef = useRef<LayerGroup | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const initialViewSetRef = useRef(false);
  const mapDraggedRef = useRef(false);
  const panCleanupRef = useRef<(() => void) | null>(null);
  const [mapReady, setMapReady] = useState(false);

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
      draftLayerRef.current = L.layerGroup().addTo(map);
      panCleanupRef.current = attachMapPanFallback(map, {
        onDrag: () => {
          mapDraggedRef.current = true;
        },
      });
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
        draftLayerRef.current = null;
        initialViewSetRef.current = false;
        setMapReady(false);
      }
    };
  }, []);

  useEffect(() => {
    const drawFields = async () => {
      const layer = fieldsLayerRef.current;
      if (!mapReady || !layer) return;

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

      const points = fields.flatMap((field) =>
        field.boundary && field.boundary.length >= 3
          ? field.boundary
          : [{ lat: field.lat, lng: field.lng }],
      );
      const map = mapRef.current;
      if (map && points.length > 0 && !initialViewSetRef.current) {
        const bounds = L.latLngBounds(
          points.map((point) => [point.lat, point.lng]),
        );
        map.fitBounds(bounds, { padding: [24, 24], maxZoom: 15 });
        initialViewSetRef.current = true;
      }
    };

    void drawFields();
  }, [fields, mapReady]);

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
    const fieldMap = map;

    if (
      farmCoordinates &&
      Number.isFinite(farmCoordinates.lat) &&
      Number.isFinite(farmCoordinates.lng)
    ) {
      fieldMap.setView([farmCoordinates.lat, farmCoordinates.lng], 13);
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
          fieldMap.setView([cached.lat, cached.lng], 13);
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
          fieldMap.setView([point.lat, point.lng], 13);
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

  useEffect(() => {
    const drawDraft = async () => {
      const layer = draftLayerRef.current;
      if (!mapReady || !layer) return;

      const L = (await import("leaflet")).default;
      layer.clearLayers();

      draftBoundary.forEach((point, index) => {
        L.circleMarker([point.lat, point.lng], {
          radius: 5,
          color: "#2563eb",
          fillColor: "#2563eb",
          fillOpacity: 1,
          interactive: false,
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
          {
            color: "#2563eb",
            dashArray: "6 6",
            interactive: false,
            weight: 2,
          },
        ).addTo(layer);
      }

      if (draftBoundary.length >= 3) {
        L.polygon(
          draftBoundary.map((point) => [point.lat, point.lng]),
          {
            color: "#2563eb",
            fillColor: "#2563eb",
            fillOpacity: 0.16,
            interactive: false,
            weight: 2,
          },
        ).addTo(layer);
      }
    };

    void drawDraft();
  }, [draftBoundary, mapReady]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !drawingBoundary || !onBoundaryChange) return;

    const handleDragStart = () => {
      mapDraggedRef.current = true;
    };
    const handleClick = (event: { latlng: { lat: number; lng: number } }) => {
      if (mapDraggedRef.current) {
        mapDraggedRef.current = false;
        return;
      }
      onBoundaryChange([
        ...draftBoundary,
        { lat: event.latlng.lat, lng: event.latlng.lng },
      ]);
    };

    map.getContainer().style.cursor = "crosshair";
    map.on("dragstart", handleDragStart);
    map.on("click", handleClick);

    return () => {
      map.off("dragstart", handleDragStart);
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
