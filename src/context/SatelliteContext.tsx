import { createContext, useContext, useState, useEffect, useRef } from 'react';
import type { ReactNode } from "react";
import type { SatelliteSummary, ObserverLocation } from '../services/n2yoAPI';
import { getSatellitesAbove } from '../services/n2yoAPI';

type SatelliteContextType = {
    observerLocation: ObserverLocation;
    setObserverLocation: (loc: ObserverLocation) => void;

    satellitesAbove: SatelliteSummary[];
    loadingSatellites: boolean;
    satellitesError: string | null;
    refreshSatellites: () => Promise<void>;

    selectedSatellite?: SatelliteSummary;
    setSelectedSatellite: (s?: SatelliteSummary) => void;

    lastUpdated?: number;
}

const SatelliteContext = createContext<SatelliteContextType | undefined>(undefined);

export const SatelliteProvider = ({ children }: { children: ReactNode }) => {
    const [observerLocation, setObserverLocation] = useState<ObserverLocation>(
        { lat: 28.6139, lng: 77.2090, alt: 0 }
    );

    const [satellitesAbove, setSatellitesAbove] = useState<SatelliteSummary[]>([]);
    const [loadingSatellites, setLoadingSatellites] = useState<boolean>(false);
    const [satellitesError, setSatellitesError] = useState<string | null>(null);
    const [selectedSatellite, setSelectedSatellite] = useState<SatelliteSummary | undefined>(undefined);
    const [lastUpdated, setLastUpdated] = useState<number | undefined>(undefined);

    const cacheRef = useRef<Map<string, { ts: number; data: SatelliteSummary[] }>>(new Map());
    const abortRef = useRef<AbortController | null>(null);

    const CACHE_TTL_MS = 2 * 60 * 1000;
    const makeCacheKey = (loc: ObserverLocation) =>
        `${loc.lat.toFixed(4)}_${loc.lng.toFixed(4)}_${Math.round(loc.alt)}`;

    const fetchSatellites = async (loc: ObserverLocation, force = false) => {
        if (abortRef.current) {
            abortRef.current.abort();
            abortRef.current = null;
        }

        const key = makeCacheKey(loc);
        const cached = cacheRef.current.get(key);
        if (!force && cached && (Date.now() - cached.ts) < CACHE_TTL_MS) {
            setSatellitesAbove(cached.data);
            setSatellitesError(null);
            setLastUpdated(cached.ts);
            return;
        }

        const controller = new AbortController();
        abortRef.current = controller;

        setLoadingSatellites(true);
        setSatellitesError(null);
        try {
            const list = await getSatellitesAbove(loc, 70, controller.signal);
            setSatellitesAbove(list);
            setLastUpdated(Date.now());
            cacheRef.current.set(key, { ts: Date.now(), data: list });
        } catch (error: any) {
            if (error && error.name === "AbortError") {
                // silently ignore
                return;
            }
            console.error("Error fetching satellites:", error);
            setSatellitesError(error?.message || "Failed to fetch satellites");
        } finally {
            setLoadingSatellites(false);
            abortRef.current = null;
        }
    };

    const refreshSatellites = async () => {
        await fetchSatellites(observerLocation, true);
    }

    useEffect(() => {
        let mounted = true;
        const run = async () => {
            if (!mounted) return;
            await fetchSatellites(observerLocation, false);
        };

        const t = setTimeout(() => {
            run();
        }, 250);
        return () => {
            mounted = false;
            clearTimeout(t);
            if (abortRef.current) {
                abortRef.current.abort();
                abortRef.current = null;
            }
        };
    }, [observerLocation.lat, observerLocation.lng, observerLocation.alt]);


    const value: SatelliteContextType = {
        observerLocation,
        setObserverLocation,

        satellitesAbove,
        loadingSatellites,
        satellitesError,
        refreshSatellites,

        selectedSatellite,
        setSelectedSatellite,

        lastUpdated,
    }

    return <SatelliteContext.Provider value={value}>{children}</SatelliteContext.Provider>;
};

export const useSatellite = () => {
    const ctx = useContext(SatelliteContext);
    if (!ctx) {
        throw new Error("useSatellite must be used within a SatelliteProvider");
    }
    return ctx;
}