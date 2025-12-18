import { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L, { type LatLngExpression, Marker as LMarker } from "leaflet";
import { useSatellite } from "../context/SatelliteContext";
import { useSatelliteTracking } from "../hooks/useSatelliteTracking";
import type { SatellitePositionPoint } from "../services/n2yoAPI";

import SatelliteInfoPanel from "./SatelliteInfoPanel";

import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

/* ───────────────── Leaflet icon fix ───────────────── */

delete (L.Icon.Default.prototype as any)._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

/* ───────────────── Helper components ───────────────── */

// Recenter map when observer location changes
function RecenterMap({ center }: { center: LatLngExpression }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom(), { animate: true });
  }, [center, map]);
  return null;
}

// Follow satellite when enabled
function FollowSatellite({
  enabled,
  position,
}: {
  enabled: boolean;
  position?: [number, number];
}) {
  const map = useMap();

  useEffect(() => {
    if (!enabled || !position) return;
    map.setView(position, map.getZoom(), { animate: true });
  }, [enabled, position, map]);

  return null;
}

/* ───────────────── Main component ───────────────── */

export default function MapView() {
  const { observerLocation, selectedSatellite } = useSatellite();

  // 🔹 ALL tracking logic now comes from the hook
  const { positions } = useSatelliteTracking(
    selectedSatellite?.satid,
    observerLocation
  );

  const markerRef = useRef<LMarker | null>(null);
  const [followSatellite, setFollowSatellite] = useState(true);

  // convert satellite position to Leaflet LatLng
  const toLatLng = (p: SatellitePositionPoint) =>
    [p.satlat, p.satlng] as LatLngExpression;

  // animate marker between points
  useEffect(() => {
    if (!selectedSatellite || positions.length === 0) return;

    let rafId: number | null = null;
    let i = 0;

    const step = () => {
      if (!markerRef.current) {
        rafId = requestAnimationFrame(step);
        return;
      }

      if (i >= positions.length - 1) {
        rafId = requestAnimationFrame(step);
        return;
      }

      const a = positions[i];
      const b = positions[i + 1];

      const start = Date.now();
      const durationMs = Math.max(300, (b.timestamp - a.timestamp) * 1000);

      const animate = () => {
        const t = Math.min(1, (Date.now() - start) / durationMs);
        const lat = a.satlat + (b.satlat - a.satlat) * t;
        const lng = a.satlng + (b.satlng - a.satlng) * t;

        markerRef.current!.setLatLng([lat, lng]);

        if (t < 1) {
          rafId = requestAnimationFrame(animate);
        } else {
          i += 1;
          rafId = requestAnimationFrame(step);
        }
      };

      rafId = requestAnimationFrame(animate);
    };

    rafId = requestAnimationFrame(step);

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [positions, selectedSatellite?.satid]);

  const center: LatLngExpression = [
    observerLocation.lat,
    observerLocation.lng,
  ];

  return (
    <div className="flex flex-col lg:flex-row gap-4">
      {/* MAP */}
      <div className="flex-1">
        <div className="relative h-[540px] bg-gray-50 rounded-lg overflow-hidden">
          {/* Follow toggle */}
          <div className="absolute top-3 right-3 z-[1000] bg-white rounded shadow px-3 py-2 text-sm">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={followSatellite}
                onChange={() => setFollowSatellite((v) => !v)}
              />
              Follow satellite
            </label>
          </div>

          <MapContainer center={center} zoom={3} className="h-full w-full">
            <RecenterMap center={center} />

            {followSatellite && positions.length > 0 && (
              <FollowSatellite
                enabled={followSatellite}
                position={[
                  positions[positions.length - 1].satlat,
                  positions[positions.length - 1].satlng,
                ]}
              />
            )}

            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://openstreetmap.org">OpenStreetMap</a> contributors'
            />

            {/* Observer */}
            <Marker position={center}>
              <Popup>
                Observer
                <br />
                Lat: {observerLocation.lat.toFixed(4)}
                <br />
                Lng: {observerLocation.lng.toFixed(4)}
              </Popup>
            </Marker>

            {/* Satellite trail */}
            {positions.length > 1 && (
              <Polyline
                positions={positions.map((p) => toLatLng(p))}
                color="blue"
              />
            )}

            {/* Satellite marker */}
            {selectedSatellite && positions.length > 0 && (
              <Marker
                position={toLatLng(positions[0])}
                ref={(m) => {
                  markerRef.current = m
                    ? ((m as unknown) as LMarker)
                    : null;
                }}
              >
                <Popup>
                  <div className="text-sm">
                    <div className="font-medium">
                      {selectedSatellite.satname}
                    </div>
                    <div className="text-xs">
                      NORAD: {selectedSatellite.satid}
                    </div>
                  </div>
                </Popup>
              </Marker>
            )}
          </MapContainer>
        </div>
      </div>

      {/* INFO PANEL */}
      <div className="w-full lg:w-[320px]">
        <SatelliteInfoPanel positions={positions} />
      </div>
    </div>
  );
}
