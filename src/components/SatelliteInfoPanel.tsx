import { useMemo } from "react";
import { useSatellite } from "../context/SatelliteContext";
import type { SatellitePositionPoint } from "../services/n2yoAPI";

function haversineKm(a: SatellitePositionPoint, b: SatellitePositionPoint) {
    const R = 6371; // Earth radius in km
    const toRad = (d: number) => (d * Math.PI) / 180;

    const dLat = toRad(b.satlat - a.satlat);
    const dLng = toRad(b.satlng - a.satlng);

    const lat1 = toRad(a.satlat);
    const lat2 = toRad(b.satlat);

    const h =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;

    return 2 * R * Math.asin(Math.sqrt(h));
}

type Props = {
    positions: SatellitePositionPoint[];
};

export default function SatelliteInfoPanel({ positions }: Props) {
    const { selectedSatellite, setSelectedSatellite } = useSatellite();

    const latest = positions[positions.length - 1];

    const speed = useMemo(() => {
        if (positions.length < 2) return null;
        const a = positions[positions.length - 2];
        const b = positions[positions.length - 1];
        const dist = haversineKm(a, b);
        const dt = b.timestamp - a.timestamp;
        if (dt <= 0) return null;
        return dist / dt; // km/s
    }, [positions]);

    if (!selectedSatellite || !latest) {
        return (
            <div className="p-4 bg-white rounded shadow text-sm text-gray-600">
                No satellite selected
            </div>
        );
    }

    return (
        <div className="p-4 bg-white rounded shadow text-sm space-y-1">
            <div className="font-semibold">{selectedSatellite.satname}</div>

            <button
                onClick={() => setSelectedSatellite(undefined)}
                className="mt-2 px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
            >
                Untrack satellite
            </button>


            <div>
                <span className="font-medium">Latitude:</span>{" "}
                {latest.satlat.toFixed(4)}°
            </div>

            <div>
                <span className="font-medium">Longitude:</span>{" "}
                {latest.satlng.toFixed(4)}°
            </div>

            <div>
                <span className="font-medium">Altitude:</span>{" "}
                {(latest.satalt / 1000).toFixed(2)} km
            </div>

            <div>
                <span className="font-medium">Speed:</span>{" "}
                {speed ? speed.toFixed(2) : "--"} km/s
            </div>
        </div>
    );
}
