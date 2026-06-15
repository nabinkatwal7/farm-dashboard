"use client";

import { MapContainer, TileLayer, Polygon, Tooltip } from "react-leaflet";
import { LatLngExpression } from "leaflet";

type Point = { lat: number; lng: number };

export default function PublicFieldMap({ boundary, fieldName }: { boundary: Point[]; fieldName: string }) {
  if (boundary.length < 3) return null;

  const positions = boundary.map((p) => [p.lat, p.lng] as LatLngExpression);
  const centerLat = boundary.reduce((s, p) => s + p.lat, 0) / boundary.length;
  const centerLng = boundary.reduce((s, p) => s + p.lng, 0) / boundary.length;

  return (
    <div style={{ height: 280, borderRadius: 12, overflow: "hidden" }}>
      <MapContainer
        center={[centerLat, centerLng] as LatLngExpression}
        zoom={16}
        scrollWheelZoom={false}
        dragging={false}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Polygon
          positions={positions}
          pathOptions={{ color: "#16a34a", fillColor: "#22c55e", fillOpacity: 0.2, weight: 2 }}
        >
          <Tooltip permanent direction="center" className="bg-white/90 text-sm font-medium px-3 py-1.5 rounded-lg shadow border">
            {fieldName}
          </Tooltip>
        </Polygon>
      </MapContainer>
    </div>
  );
}
