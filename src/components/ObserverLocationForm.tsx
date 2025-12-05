import { useState } from "react";
import { useSatellite } from "../context/SatelliteContext";

type FormState = {
    lat: string;
    lng: string;
    alt: string;
};

export default function ObserverLocationForm() {
    const { observerLocation, setObserverLocation } = useSatellite();
    const [form, setForm] = useState<FormState>({
        lat: String(observerLocation.lat),
        lng: String(observerLocation.lng),
        alt: String(observerLocation.alt ?? 0),
    });

    const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
    const [isGeoLoading, setIsGeoLoading] = useState(false);

    const onChange = (field: keyof FormState, value: string) => {
        setForm((prev) => ({ ...prev, [field]: value }));
        setErrors((prev) => ({ ...prev, [field]: undefined }));
    };

    const validateAndParse = () => {
        const outErrors: typeof errors = {};
        const trimmed = {
            lat: form.lat.trim(),
            lng: form.lng.trim(),
            alt: form.alt.trim(),
        };

        const latNum = Number(trimmed.lat);
        const lngNum = Number(trimmed.lng);
        const altNum = trimmed.alt === "" ? 0 : Number(trimmed.alt);

        if (trimmed.lat === "" || Number.isNaN(latNum) || latNum < -90 || latNum > 90) {
            outErrors.lat = "Latitude must be a number between -90 and 90.";
        }
        if (trimmed.lng === "" || Number.isNaN(lngNum) || lngNum < -180 || lngNum > 180) {
            outErrors.lng = "Longitude must be a number between -180 and 180.";
        }
        if (trimmed.alt !== "" && Number.isNaN(altNum)){
            outErrors.alt = "Altitude must be a number between -413 and 8850 km.";
        }

        setErrors(outErrors);
        if (Object.keys(outErrors).length > 0) {
            return null;
        }

        return { lat: latNum, lng: lngNum, alt: altNum };
    };


    const onSetLocation = () => {
        const parsed = validateAndParse();
        if (parsed) {
            setObserverLocation(parsed);
        }
    };


    const useGeolocation = () => {
        if (!("geolocation" in navigator)) {
            alert("Geolocation is not supported by your browser.");
            setErrors({ ...errors, lat: "Geolocation not supported", lng: "Geolocation not supported" });
            return;
        }

        setIsGeoLoading(true);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const { latitude, longitude, altitude } = pos.coords;
                setForm({
                    lat: String(latitude),
                    lng: String(longitude),
                    alt: String(altitude ?? 0),
                });
                setIsGeoLoading(false);
            },
            (err) => {
                alert("Failed to get geolocation: " + err.message);
                setIsGeoLoading(false);
                setErrors({ ...errors, lat: "Unable to get location. Permission denied or unavailable." });
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    };

    const applyPreset = (lat: number, lng: number, alt = 0) => {
        setForm({ lat: String(lat), lng: String(lng), alt: String(alt) });
        setErrors({});
    };



    return (
        <div className="p-4 bg-white rounded-lg shadow-sm w-full max-w-md">
            <h3 className="text-lg font-semibold mb-3">Observer Location</h3>

            <label className="block mb-2">
                <span className="text-sm font-medium">Latitude</span>
                <input
                    value={form.lat}
                    onChange={(e) => onChange("lat", e.target.value)}
                    placeholder="e.g., 28.6139"
                    className="mt-1 block w-full border p-2 rounded"
                    inputMode="decimal"
                />
                {errors.lat && <div className="text-red-600 text-sm mt-1">{errors.lat}</div>}
                <div className="text-xs text-gray-500 mt-1">Range: -90 to 90</div>
            </label>

            <label className="block mb-2">
                <span className="text-sm font-medium">Longitude</span>
                <input
                    value={form.lng}
                    onChange={(e) => onChange("lng", e.target.value)}
                    placeholder="e.g., 77.2090"
                    className="mt-1 block w-full border p-2 rounded"
                    inputMode="decimal"
                />
                {errors.lng && <div className="text-red-600 text-sm mt-1">{errors.lng}</div>}
                <div className="text-xs text-gray-500 mt-1">Range: -180 to 180</div>
            </label>

            <label className="block mb-3">
                <span className="text-sm font-medium">Altitude (meters)</span>
                <input
                    value={form.alt}
                    onChange={(e) => onChange("alt", e.target.value)}
                    placeholder="e.g., 0"
                    className="mt-1 block w-full border p-2 rounded"
                    inputMode="numeric"
                />
                {errors.alt && <div className="text-red-600 text-sm mt-1">{errors.alt}</div>}
            </label>

            <div className="flex gap-2 items-center">
                <button
                    onClick={onSetLocation}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                    Set Location
                </button>

                <button
                    onClick={useGeolocation}
                    disabled={isGeoLoading}
                    className="px-3 py-2 bg-gray-200 rounded hover:bg-gray-300"
                >
                    {isGeoLoading ? "Locating..." : "Use my location"}
                </button>

                <div className="ml-auto space-x-1">
                    <button
                        onClick={() => applyPreset(28.6139, 77.2090, 0)}
                        className="text-xs px-2 py-1 bg-gray-100 rounded"
                        title="New Delhi"
                    >
                        Delhi
                    </button>
                    <button
                        onClick={() => applyPreset(51.5074, -0.1278, 35)}
                        className="text-xs px-2 py-1 bg-gray-100 rounded"
                        title="London"
                    >
                        London
                    </button>
                </div>
            </div>
        </div>
    );


};