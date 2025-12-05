export type ObserverLocation = { lat: number; lng: number; alt: number };

export type SatelliteSummary = {
    satid: number;
    satname: string;
    intDesignator?: string;
    launchDate?: string;
    satlat?: number;
    satlng?: number;
    satalt?: number;
    azimuth?: number;
    elevation?: number;
    category?: string | number;
};

const KEY = import.meta.env.VITE_N2YO_KEY as string;
if (!KEY) {
    console.warn("N2YO API key is not set. Please set VITE_N2YO_KEY in your environment variables.");
};

export async function getSatellitesAbove(
    location: ObserverLocation,
    radius = 70,
    signal?: AbortSignal
): Promise<SatelliteSummary[]> {
    const { lat, lng, alt } = location;
    const url = `/api/above?lat=${encodeURIComponent(lat)}&lng=${encodeURIComponent(lng)}&alt=${encodeURIComponent(alt)}&radius=${encodeURIComponent(radius)}`;

    const proxyOrigin = import.meta.env.VITE_PROXY_ORIGIN;
    const fetchUrl = proxyOrigin ? `${proxyOrigin}${url}` : `http://localhost:8000${url}`;

    const res = await fetch(fetchUrl, { signal });
    if (!res.ok) {
        let body: any = null;
        try {
            body = await res.json();
        } catch (e) {
            // ignore JSON parse errors
        }
        const msg = (body && (body.error || body.message)) || `Proxy error ${res.status}`;
        throw new Error(msg);
    }

    const data = await res.json();
    const rawList = Array.isArray(data.above) ? data.above : [];

    const normalized: SatelliteSummary[] = rawList.map((s: any) => ({
        satid: s.satid,
        satname: s.satname,
        intDesignator: s.intDesignator,
        launchDate: s.launchDate,
        satlat: s.satlat ?? undefined,
        satlng: s.satlng ?? undefined,
        satalt: s.satalt ?? undefined,
        azimuth: s.azimuth ?? undefined,
        elevation: s.elevation ?? undefined,
        category: s.category ?? undefined,
    }));
    return normalized;
}