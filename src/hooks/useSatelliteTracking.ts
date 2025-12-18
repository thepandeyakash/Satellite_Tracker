import { useEffect, useRef, useState } from "react";
import type { SatellitePositionPoint } from "../services/n2yoAPI";
import { getSatellitePositions } from "../services/n2yoAPI";

const POLL_INTERVAL_MS = 8000;
const MAX_TRAIL_POINTS = 30;

export function useSatelliteTracking(
  satId?: number,
  observer?: { lat: number; lng: number; alt: number }
) {
  const [positions, setPositions] = useState<SatellitePositionPoint[]>([]);
  const [isTabVisible, setIsTabVisible] = useState(!document.hidden);

  const pollingRef = useRef<number | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  /* ───────────── Tab visibility ───────────── */
  useEffect(() => {
    const onVisibilityChange = () => {
      setIsTabVisible(!document.hidden);
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", onVisibilityChange);
  }, []);

  /* ───────────── Polling logic ───────────── */
  useEffect(() => {
    // Cleanup old polling
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }

    setPositions([]);

    if (!satId || !observer || !isTabVisible) return;

    const fetchPositions = async () => {
      if (abortRef.current) abortRef.current.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const pts = await getSatellitePositions(
          satId,
          observer,
          60,
          controller.signal
        );
        setPositions(pts.slice(-MAX_TRAIL_POINTS));
      } catch (err: any) {
        if (err?.name !== "AbortError") {
          console.error("Tracking error:", err);
        }
      } finally {
        abortRef.current = null;
      }
    };

    fetchPositions();
    pollingRef.current = window.setInterval(fetchPositions, POLL_INTERVAL_MS);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
      if (abortRef.current) abortRef.current.abort();
    };
  }, [
    satId,
    observer?.lat,
    observer?.lng,
    observer?.alt,
    isTabVisible,
  ]);

  return {
    positions,
    isTracking: !!satId && isTabVisible,
  };
}
