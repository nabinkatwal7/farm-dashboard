"use client";

import { Button, Group, Text } from "@mantine/core";
import { Crosshair } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { LayerGroup, Map as LeafletMap } from "leaflet";
import type { FieldBoundaryPoint } from "@/app/base/services/farm-client";
import { attachMapPanFallback } from "@/app/components/map-pan-fallback";

interface FarmLocationPickerProps {
  value: FieldBoundaryPoint | null;
  label: string;
  onChange: (point: FieldBoundaryPoint, label: string) => void;
}

const FALLBACK_CENTER: FieldBoundaryPoint = { lat: 27.7172, lng: 85.324 };

async function describeLocation(point: FieldBoundaryPoint) {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${point.lat}&lon=${point.lng}`,
    );
    const result = (await response.json()) as {
      display_name?: string;
      address?: {
        village?: string;
        town?: string;
        city?: string;
        county?: string;
        state?: string;
        country?: string;
      };
    };
    const address = result.address;
    const shortLabel = [
      address?.village ?? address?.town ?? address?.city ?? address?.county,
      address?.state,
      address?.country,
    ]
      .filter(Boolean)
      .join(", ");

    return shortLabel || result.display_name || `${point.lat.toFixed(5)}, ${point.lng.toFixed(5)}`;
  } catch {
    return `${point.lat.toFixed(5)}, ${point.lng.toFixed(5)}`;
  }
}

export default function FarmLocationPicker({
  value,
  label,
  onChange,
}: FarmLocationPickerProps) {
  const mapRef = useRef<LeafletMap | null>(null);
  const markerLayerRef = useRef<LayerGroup | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const initialValueRef = useRef(value);
  const onChangeRef = useRef(onChange);
  const mapDraggedRef = useRef(false);
  const panCleanupRef = useRef<(() => void) | null>(null);
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

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

      const center = initialValueRef.current ?? FALLBACK_CENTER;
      const map = L.map(container, {
        center: [center.lat, center.lng],
        dragging: false,
        zoom: initialValueRef.current ? 13 : 6,
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

      markerLayerRef.current = L.layerGroup().addTo(map);
      panCleanupRef.current = attachMapPanFallback(map, {
        onDrag: () => {
          mapDraggedRef.current = true;
        },
      });
      mapRef.current = map;
      window.setTimeout(() => map.invalidateSize(), 0);

      map.on("click", async (event: { latlng: { lat: number; lng: number } }) => {
        if (mapDraggedRef.current) {
          mapDraggedRef.current = false;
          return;
        }
        const point = { lat: event.latlng.lat, lng: event.latlng.lng };
        onChangeRef.current(point, await describeLocation(point));
      });
    };

    void initMap();

    return () => {
      if (mapRef.current) {
        panCleanupRef.current?.();
        panCleanupRef.current = null;
        mapRef.current.remove();
        mapRef.current = null;
        markerLayerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const drawMarker = async () => {
      const layer = markerLayerRef.current;
      if (!layer) return;

      const L = (await import("leaflet")).default;
      layer.clearLayers();

      if (!value) return;

      L.marker([value.lat, value.lng]).addTo(layer);
    };

    void drawMarker();
  }, [value]);

  async function useCurrentLocation() {
    if (!navigator.geolocation) return;

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const point = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        mapRef.current?.setView([point.lat, point.lng], 13);
        onChangeRef.current(point, await describeLocation(point));
        setLocating(false);
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  return (
    <div className="rounded-lg border border-border bg-surface p-3">
      <Group justify="space-between" gap="sm" mb="xs">
        <div>
          <Text size="sm" fw={600} c="var(--content-primary)">
            Farm location
          </Text>
          <Text size="xs" c="var(--content-muted)">
            Drop a pin where the farm is based. You can fine-tune it later.
          </Text>
        </div>
        <Button
          size="xs"
          variant="default"
          leftSection={<Crosshair size={14} />}
          loading={locating}
          onClick={useCurrentLocation}
        >
          Use my location
        </Button>
      </Group>
      <div
        ref={containerRef}
        className="overflow-hidden rounded-md border border-border"
        style={{ height: 240, width: "100%", position: "relative", zIndex: 0 }}
      />
      <Text size="xs" c="var(--content-secondary)" mt="xs">
        {label || "No location selected yet"}
      </Text>
    </div>
  );
}
