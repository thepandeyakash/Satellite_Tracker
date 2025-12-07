
import React, { useMemo, useState } from "react";
import { useSatellite } from "../context/SatelliteContext";
import type { SatelliteSummary } from "../services/n2yoAPI";

const PAGE_SIZE = 10; // show 10 items per page

export default function SatelliteList() {
  const {
    satellitesAbove,
    loadingSatellites,
    satellitesError,
    selectedSatellite,
    setSelectedSatellite,
    refreshSatellites,
    lastUpdated,
  } = useSatellite();

  const [page, setPage] = useState(0);

  // Reset to first page whenever the underlying list changes (new location / refresh)
  React.useEffect(() => {
    setPage(0);
  }, [satellitesAbove.length]);

  const total = satellitesAbove.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const startIndex = page * PAGE_SIZE;
  const endIndex = Math.min(startIndex + PAGE_SIZE, total);

  // current page items
  const current = useMemo(
    () => satellitesAbove.slice(startIndex, endIndex),
    [satellitesAbove, startIndex, endIndex]
  );

  const onTrack = (sat: SatelliteSummary) => {
    setSelectedSatellite(sat);
  };

  const goPrev = () => setPage((p) => Math.max(0, p - 1));
  const goNext = () => setPage((p) => Math.min(totalPages - 1, p + 1));
  const jumpTo = (p: number) => setPage(() => Math.max(0, Math.min(totalPages - 1, p)));

  return (
    <div className="p-4 bg-white rounded-lg shadow-sm w-full">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold">Satellites Above</h3>

        <div className="flex items-center gap-3">
          <button
            onClick={() => refreshSatellites()}
            className="px-3 py-1 text-sm border rounded hover:bg-gray-50"
            aria-label="Refresh satellites"
          >
            Refresh
          </button>

          <div className="text-xs text-gray-500">
            {lastUpdated ? `Updated ${(new Date(lastUpdated)).toLocaleTimeString()}` : "Not loaded yet"}
          </div>
        </div>
      </div>

      {loadingSatellites && <div className="text-sm text-gray-600">Loading satellites…</div>}

      {satellitesError && (
        <div className="text-sm text-red-600 mb-2">
          {satellitesError}
          <div>
            <button onClick={() => refreshSatellites()} className="mt-2 px-3 py-1 bg-red-100 rounded text-sm">
              Retry
            </button>
          </div>
        </div>
      )}

      {!loadingSatellites && !satellitesError && total === 0 && (
        <div className="text-sm text-gray-600">No satellites above your location right now.</div>
      )}

      {!loadingSatellites && total > 0 && (
        <>
          <div className="text-xs text-gray-600 mb-2">
            Showing <strong>{startIndex + 1}</strong>–<strong>{endIndex}</strong> of <strong>{total}</strong>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left border-b">
                  <th className="py-2">Name</th>
                  <th className="py-2">NORAD</th>
                  <th className="py-2">Alt (km)</th>
                  <th className="py-2">El/Az</th>
                  <th className="py-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {current.map((s) => {
                  const isSelected = selectedSatellite?.satid === s.satid;
                  return (
                    <tr key={s.satid} className={`${isSelected ? "bg-blue-50" : ""} border-b`}>
                      <td className="py-2">{s.satname}</td>
                      <td className="py-2">{s.satid}</td>
                      <td className="py-2">{s.satalt != null ? s.satalt.toFixed(1) : "-"}</td>
                      <td className="py-2">
                        {s.elevation != null ? `${s.elevation}°` : "-"} / {s.azimuth != null ? `${s.azimuth}°` : "-"}
                      </td>
                      <td className="py-2">
                        <button
                          onClick={() => onTrack(s)}
                          className="px-2 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                        >
                          {isSelected ? "Tracking" : "Track"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination controls */}
          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={goPrev}
                disabled={page === 0}
                className={`px-3 py-1 border rounded text-sm ${page === 0 ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-50"}`}
                aria-label="Previous page"
              >
                ← Prev
              </button>
                ``
              <button
                onClick={goNext}
                disabled={page >= totalPages - 1}
                className={`px-3 py-1 border rounded text-sm ${page >= totalPages - 1 ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-50"}`}
                aria-label="Next page"
              >
                Next →
              </button>

              <div className="text-sm text-gray-600 ml-3">
                Page <strong>{page + 1}</strong> of <strong>{totalPages}</strong>
              </div>
            </div>

            {/* Optional: small page jump control */}
            <div className="text-sm text-gray-600">
              Go to page:
              <select
                value={page}
                onChange={(e) => jumpTo(Number(e.target.value))}
                className="ml-2 border rounded px-2 py-1 text-sm"
                aria-label="Jump to page"
              >
                {Array.from({ length: totalPages }).map((_, i) => (
                  <option key={i} value={i}>
                    {i + 1}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
