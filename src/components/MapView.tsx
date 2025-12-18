
import { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L, { type LatLngExpression, Marker as LMarker } from "leaflet";
import { useSatellite } from "../context/SatelliteContext";
import type { SatellitePositionPoint } from "../services/n2yoAPI";
import { getSatellitePositions } from "../services/n2yoAPI";


import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";


// fix default marker icon (Leaflet + Webpack issue)

delete (L.Icon.Default.prototype as any)._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});


// small helper component to recenter map when observer changes
function RecenterMap({ center }: { center: LatLngExpression }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom(), { animate: true });
  }, [center, map]);
  return null;
}

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


export default function MapView() {
  const { observerLocation, selectedSatellite } = useSatellite();
  const [positions, setPositions] = useState<SatellitePositionPoint[]>([]);
  const pollingRef = useRef<number | null>(null);
  const animRef = useRef<number | null>(null);
  const markerRef = useRef<LMarker | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const [followSatellite, setFollowSatellite] = useState(true);

  // helper to convert sat position to Leaflet LatLng
  const toLatLng = (p: SatellitePositionPoint) => [p.satlat, p.satlng] as LatLngExpression;

  // fetch positions once (and used for polling)
  const fetchAndSetPositions = async (satId: number) => {
    // cancel previous fetch
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      // seconds=60 to get next 60 seconds at 1s step (N2YO returns step depends on endpoint)
      const pts = await getSatellitePositions(satId, observerLocation, 60, controller.signal);
      if (pts && pts.length > 0) {
        setPositions(pts);
      } else {
        setPositions([]);
      }
    } catch (err: any) {
      if (err?.name === "AbortError") return;
      console.error("Failed to fetch positions:", err);
    } finally {
      abortRef.current = null;
    }
  };




  // start/stop polling when selectedSatellite changes
  useEffect(() => {
    // clear previous polling & animation when selection changes
    if (pollingRef.current) {
      window.clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    if (animRef.current) {
      cancelAnimationFrame(animRef.current);
      animRef.current = null;
    }
    setPositions([]);

    if (!selectedSatellite) return;

    // initial fetch
    fetchAndSetPositions(selectedSatellite.satid);

    // poll every 3000 ms for fresh positions (tune as needed)
    pollingRef.current = window.setInterval(() => {
      fetchAndSetPositions(selectedSatellite.satid);
    }, 3000);

    // cleanup on unmount/selection change
    return () => {
      if (pollingRef.current) {
        window.clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
      if (abortRef.current) {
        abortRef.current.abort();
        abortRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSatellite?.satid, observerLocation.lat, observerLocation.lng, observerLocation.alt]);

  // animate marker between position updates (smooth)
  useEffect(() => {
    // if no marker or no positions, nothing to animate
    if (!selectedSatellite || positions.length === 0) return;

    // if no markerRef yet, we create a temporary one via leaflet once map loads.
    // markerRef is attached via <Marker ref={...}> below

    // We will step through `positions` with timestamps; since the positions array is a sequence,
    // we interpolate linearly between consecutive points in a short animation.
    let rafId: number | null = null;
    let i = 0;

    const step = () => {
      if (!markerRef.current) {
        rafId = requestAnimationFrame(step);
        return;
      }
      // keep i within bounds (animate to the latest available point)
      if (i >= positions.length - 1) {
        // hold at last point until new positions arrive
        rafId = requestAnimationFrame(step);
        return;
      }
      const a = positions[i];
      const b = positions[i + 1];

      const start = Date.now();
      const durationMs = Math.max(300, (b.timestamp - a.timestamp) * 1000); // fallback 300ms
      const animate = () => {
        const t = Math.min(1, (Date.now() - start) / durationMs);
        // linear interpolation function
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [positions, selectedSatellite?.satid]);

  // map center set to observer location
  const center: LatLngExpression = [observerLocation.lat, observerLocation.lng];

  return (
    <div className="w-full h-[540px] bg-gray-50 rounded-lg overflow-hidden">

      <div className="absolute top-3 right-3 z-[1000] bg-white rounded shadow px-3 py-2 text-sm flex items-center gap-2">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={followSatellite}
            onChange={() => setFollowSatellite((v) => !v)}
          />
          Follow satellite
        </label>
      </div>

      <MapContainer center={center} zoom={3} style={{ height: "100%", width: "100%" }}>
        <RecenterMap center={center} />
        {followSatellite && positions.length > 0 && (
          <FollowSatellite
            enabled={followSatellite}
            position={[positions[positions.length - 1].satlat, positions[positions.length - 1].satlng]}
          />
        )}

        <TileLayer
          // OpenStreetMap tiles (free). You can use other tile providers with attribution.
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://openstreetmap.org">OpenStreetMap</a> contributors'
        />

        {/* observer marker */}
        <Marker position={center}>
          <Popup>
            Observer<br />
            Lat: {observerLocation.lat.toFixed(4)} <br />
            Lng: {observerLocation.lng.toFixed(4)}
          </Popup>
        </Marker>

        {/* satellite polyline */}
        {positions.length > 1 && <Polyline positions={positions.map((p) => toLatLng(p))} color="blue" />}

        {/* selected satellite marker */}
        {selectedSatellite && positions.length > 0 && (
          <Marker
            // initial position is first point (markerRef ensures we can animate it)
            position={toLatLng(positions[0])}
            ref={(m) => {
              // m is Leaflet element or null
              // react-leaflet ref passes the underlying Leaflet marker instance as m?.leafletElement in older versions;
              // in react-leaflet v4, ref is the instance directly
              // We'll try to normalize
              if (!m) {
                markerRef.current = null;
                return;
              }
              //   const underlying = (m as any).getElement ? (m as any) : (m as any).leafletElement ?? m;
              // `m` in v4 is a Leaflet instance with setLatLng. So set markerRef accordingly:
              markerRef.current = (m as unknown as LMarker) ?? null;
            }}
          >
            <Popup>
              <div className="text-sm">
                <div className="font-medium">{selectedSatellite.satname}</div>
                <div className="text-xs">NORAD: {selectedSatellite.satid}</div>
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
}
